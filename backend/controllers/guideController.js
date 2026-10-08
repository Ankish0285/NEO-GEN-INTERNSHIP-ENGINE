const asyncHandler = require('express-async-handler');
const Guide = require('../models/Guide');

// ---------------------------------------------------------------------------
// Helper: extract the 11-character YouTube video ID from various URL formats
// Supported: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
// Returns the video ID string or null for unrecognised / invalid input.
// ---------------------------------------------------------------------------
const extractYouTubeVideoId = (url) => {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  // Pattern 1: standard watch URL  — youtube.com/watch?v=XXXXXXXXXXX
  const watchMatch = trimmed.match(/[?&]v=([A-Za-z0-9_-]{11})(?:[&# ]|$)/);
  if (watchMatch) return watchMatch[1];

  // Pattern 2: short URL — youtu.be/XXXXXXXXXXX
  const shortMatch = trimmed.match(/youtu\.be\/([A-Za-z0-9_-]{11})(?:[?/#]|$)/);
  if (shortMatch) return shortMatch[1];

  // Pattern 3: embed URL — youtube.com/embed/XXXXXXXXXXX
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})(?:[?/#]|$)/);
  if (embedMatch) return embedMatch[1];

  return null;
};

// ---------------------------------------------------------------------------
// Shared helper: build the Mongoose query filter + pagination params from req
// ---------------------------------------------------------------------------
const buildQueryParams = (req) => {
  const { search, category, page = 1, limit = 12 } = req.query;
  const filter = {};

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) {
    filter.category = category;
  }

  const parsedLimit = Math.min(parseInt(limit, 10) || 12, 50);
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const skip = (parsedPage - 1) * parsedLimit;

  return { filter, skip, limit: parsedLimit, page: parsedPage };
};

// ---------------------------------------------------------------------------
// Shared helper: execute query and return paginated JSON
// ---------------------------------------------------------------------------
const sendPaginated = async (res, baseFilter, req) => {
  const { filter, skip, limit, page } = buildQueryParams(req);
  const combined = { ...baseFilter, ...filter };

  // If baseFilter already contains $or and filter also has $or, merge them with $and
  if (baseFilter.$or && filter.$or) {
    const { $or: _ignored, ...restFilter } = filter;
    combined.$and = [{ $or: baseFilter.$or }, { $or: filter.$or }];
    delete combined.$or;
    Object.assign(combined, restFilter);
  }

  const total = await Guide.countDocuments(combined);
  const docs = await Guide.find(combined)
    .populate('author', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    data: docs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

// ---------------------------------------------------------------------------
// @desc    Get all guides (backward-compat, no auth required)
// @route   GET /api/guides (handled via getPublicResources)
// @access  Public
// ---------------------------------------------------------------------------
const getGuides = asyncHandler(async (req, res) => {
  const guides = await Guide.find({ status: 'published' }).populate('author', 'name email');
  res.status(200).json(guides);
});

// ---------------------------------------------------------------------------
// @desc    Get publicly visible resources (no auth required)
// @route   GET /api/guides
// @access  Public
// ---------------------------------------------------------------------------
const getPublicResources = asyncHandler(async (req, res) => {
  const baseFilter = {
    status: 'published',
    $or: [{ targetAudience: 'public' }, { isPublic: true }],
  };
  await sendPaginated(res, baseFilter, req);
});

// ---------------------------------------------------------------------------
// @desc    Get student-scoped resources
// @route   GET /api/guides/student
// @access  Private — student | admin | super_admin
// ---------------------------------------------------------------------------
const getStudentResources = asyncHandler(async (req, res) => {
  const role = req.user && req.user.role;
  if (!['student', 'admin', 'super_admin'].includes(role)) {
    res.status(403);
    throw new Error('Forbidden - Student access required');
  }

  const baseFilter = {
    status: 'published',
    targetAudience: { $in: ['students', 'both', 'public'] },
  };
  await sendPaginated(res, baseFilter, req);
});

// ---------------------------------------------------------------------------
// @desc    Get partner-scoped resources
// @route   GET /api/guides/partner
// @access  Private — partner | admin | super_admin
// ---------------------------------------------------------------------------
const getPartnerResources = asyncHandler(async (req, res) => {
  const role = req.user && req.user.role;
  if (!['partner', 'admin', 'super_admin'].includes(role)) {
    res.status(403);
    throw new Error('Forbidden - Partner access required');
  }

  const baseFilter = {
    status: 'published',
    targetAudience: { $in: ['partners', 'both', 'public'] },
  };
  await sendPaginated(res, baseFilter, req);
});

// ---------------------------------------------------------------------------
// @desc    Get all resources (admin view, any status)
// @route   GET /api/guides/admin
// @access  Private/Admin
// ---------------------------------------------------------------------------
const getAdminResources = asyncHandler(async (req, res) => {
  const { filter, skip, limit, page } = buildQueryParams(req);

  // Admin can also filter by publication status
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const total = await Guide.countDocuments(filter);
  const docs = await Guide.find(filter)
    .populate('author', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    data: docs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// ---------------------------------------------------------------------------
// @desc    Get single resource by ID (respects audience access rules)
// @route   GET /api/guides/:id
// @access  optionalAuth — public resources served freely; others require role
// ---------------------------------------------------------------------------
const getResourceById = asyncHandler(async (req, res) => {
  const resource = await Guide.findById(req.params.id).populate('author', 'name email');

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  // Public / isPublic resources are accessible to everyone
  if (resource.targetAudience === 'public' || resource.isPublic) {
    return res.status(200).json(resource);
  }

  // Admins can always see any resource
  const role = req.user && req.user.role;
  if (role === 'admin' || role === 'super_admin') {
    return res.status(200).json(resource);
  }

  // Student access
  if (
    role === 'student' &&
    ['students', 'both', 'public'].includes(resource.targetAudience)
  ) {
    return res.status(200).json(resource);
  }

  // Partner access
  if (
    role === 'partner' &&
    ['partners', 'both', 'public'].includes(resource.targetAudience)
  ) {
    return res.status(200).json(resource);
  }

  res.status(403);
  throw new Error('Forbidden - You do not have access to this resource');
});

// ---------------------------------------------------------------------------
// @desc    Create a new learning resource
// @route   POST /api/guides
// @access  Private/Admin
// ---------------------------------------------------------------------------
const createResource = asyncHandler(async (req, res) => {
  const body = { ...req.body, author: req.user.id };

  // Validate and extract YouTube video ID if a URL was supplied
  if (body.youtubeUrl) {
    const videoId = extractYouTubeVideoId(body.youtubeUrl);
    if (!videoId) {
      res.status(400);
      throw new Error('Invalid YouTube URL');
    }
    body.youtubeVideoId = videoId;
  }

  const resource = await Guide.create(body);
  res.status(201).json(resource);
});

// ---------------------------------------------------------------------------
// @desc    Update an existing learning resource
// @route   PUT /api/guides/:id
// @access  Private/Admin
// ---------------------------------------------------------------------------
const updateResource = asyncHandler(async (req, res) => {
  const resource = await Guide.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  const updates = { ...req.body };

  // Re-validate YouTube URL if it was changed
  if (updates.youtubeUrl !== undefined) {
    if (updates.youtubeUrl) {
      const videoId = extractYouTubeVideoId(updates.youtubeUrl);
      if (!videoId) {
        res.status(400);
        throw new Error('Invalid YouTube URL');
      }
      updates.youtubeVideoId = videoId;
    } else {
      // URL cleared — clear the stored ID too
      updates.youtubeVideoId = null;
    }
  }

  const updated = await Guide.findByIdAndUpdate(req.params.id, updates, { new: true });
  res.status(200).json(updated);
});

// ---------------------------------------------------------------------------
// @desc    Delete a learning resource
// @route   DELETE /api/guides/:id
// @access  Private/Admin
// ---------------------------------------------------------------------------
const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Guide.findById(req.params.id);

  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  await resource.deleteOne();
  res.status(200).json({ id: req.params.id });
});

// Backward-compat aliases so existing code that imported createGuide etc. still works
const createGuide = createResource;
const updateGuide = updateResource;
const deleteGuide = deleteResource;

module.exports = {
  extractYouTubeVideoId,
  getGuides,
  getPublicResources,
  getStudentResources,
  getPartnerResources,
  getAdminResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  // backward-compat aliases
  createGuide,
  updateGuide,
  deleteGuide,
};
