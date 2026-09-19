const asyncHandler = require('express-async-handler');
const SuccessStory = require('../models/SuccessStory');
const StoryRating = require('../models/StoryRating');
const { deleteCloudinaryAsset } = require('../utils/cloudinaryCleanup');
const { releaseCloudinaryAsset } = require('../utils/cloudinaryUpload');
const path = require('path');

/**
 * Normalize an image value before writing to the database.
 */
function normalizeStoryImageForStorage(raw) {
    if (!raw || typeof raw !== 'string') return raw;
    const s = raw.trim();
    if (!s) return s;
    if (/^https?:\/\//i.test(s)) return s;
    if (/^[A-Za-z]:[/\\]/.test(s)) {
        const filename = path.basename(s.replace(/\\/g, '/'));
        return filename ? `/uploads/${filename}` : '';
    }
    return s;
}

/**
 * Recalculate rating summary for a story.
 */
async function recalculateRatingSummary(storyId) {
    const ratings = await StoryRating.find({ storyId });
    const ratingAverage = ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
        : 0;
    const ratingCount = ratings.length;
    
    await SuccessStory.findByIdAndUpdate(
        storyId,
        { ratingAverage: parseFloat(ratingAverage), ratingCount }
    );
}

// @desc    Create a success story
// @route   POST /api/stories/add
// @access  Private (authenticated student)
const createStory = asyncHandler(async (req, res) => {
    const { experience, image, name, college, company } = req.body;
    
    if (!experience) {
        res.status(400);
        throw new Error('Please provide experience');
    }

    if (!req.user) {
        res.status(401);
        throw new Error('Authentication required to submit a story');
    }

    const storyData = {
        experience,
        image: normalizeStoryImageForStorage(image),
        name: name || req.user.name,
        college,
        company,
        studentId: req.user._id,
        status: 'approved',  // Auto-approve stories so they appear immediately
        ratingAverage: 0,
        ratingCount: 0
    };

    const story = await SuccessStory.create(storyData);
    await story.populate('studentId', 'name course');
    res.status(201).json({ success: true, data: story });
});

// @desc    Get current user's stories
// @route   GET /api/stories/me
// @access  Private (authenticated student)
const getUserStories = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401);
        throw new Error('Authentication required');
    }

    const stories = await SuccessStory.find({ studentId: req.user._id })
        .populate('studentId', 'name course')
        .sort('-createdAt');

    res.status(200).json({
        success: true,
        count: stories.length,
        data: stories,
        message: stories.length === 0 ? "You haven't submitted a success story yet." : null
    });
});

// @desc    Get all public (approved) stories
// @route   GET /api/stories
// @access  Public
const getPublicStories = asyncHandler(async (req, res) => {
    const stories = await SuccessStory.find({ status: 'approved' })
        .populate('studentId', 'name course')
        .sort('-createdAt');

    res.status(200).json({ success: true, count: stories.length, data: stories });
});

// @desc    Update user's own story
// @route   PUT /api/stories/user/:id
// @access  Private (story owner only)
const updateUserStory = asyncHandler(async (req, res) => {
    const story = await SuccessStory.findById(req.params.id);

    if (!story) {
        res.status(404);
        throw new Error('Story not found');
    }

    // Only story owner can update
    if (story.studentId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this story');
    }

    const { experience, name, college, company, image } = req.body;

    // Capture old image BEFORE update
    const oldImage = story.image || null;

    const updateData = {};
    if (experience) updateData.experience = experience;
    if (name) updateData.name = name;
    if (college) updateData.college = college;
    if (company) updateData.company = company;
    if (image !== undefined) {
        updateData.image = normalizeStoryImageForStorage(image);
    }

    const updatedStory = await SuccessStory.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    ).populate('studentId', 'name course');

    // Release old image after successful DB update, only if it changed
    if (oldImage && oldImage !== updatedStory.image) {
        await releaseCloudinaryAsset(oldImage);
    }

    res.status(200).json({ success: true, data: updatedStory });
});

// @desc    Delete user's own story
// @route   DELETE /api/stories/user/:id
// @access  Private (story owner only)
const deleteUserStory = asyncHandler(async (req, res) => {
    const story = await SuccessStory.findById(req.params.id);

    if (!story) {
        res.status(404);
        throw new Error('Story not found');
    }

    // Only story owner can delete
    if (story.studentId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to delete this story');
    }

    // Release image asset safely
    if (story.image) {
        await releaseCloudinaryAsset(story.image);
    }

    // Delete all ratings for this story
    await StoryRating.deleteMany({ storyId: req.params.id });

    await SuccessStory.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, data: {} });
});

// @desc    Update a story (admin only)
// @route   PUT /api/stories/:id
// @access  Private (Admin)
const updateStory = asyncHandler(async (req, res) => {
    const updateData = { ...req.body };
    if (updateData.image !== undefined) {
        updateData.image = normalizeStoryImageForStorage(updateData.image);
    }

    // Capture old image BEFORE update
    const existing = await SuccessStory.findById(req.params.id).select('image');
    const oldImage = existing?.image || null;

    const story = await SuccessStory.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    ).populate('studentId', 'name course');
    
    if (!story) {
        res.status(404);
        throw new Error('Story not found');
    }

    // Release old image after successful DB update, only if it changed
    if (oldImage && oldImage !== story.image) {
        await releaseCloudinaryAsset(oldImage);
    }

    res.status(200).json({ success: true, data: story });
});

// @desc    Delete a story (admin only)
// @route   DELETE /api/stories/:id
// @access  Private (Admin)
const deleteStory = asyncHandler(async (req, res) => {
    const story = await SuccessStory.findById(req.params.id);

    if (!story) {
        res.status(404);
        throw new Error('Story not found');
    }

    // Release image asset safely
    if (story.image) {
        await releaseCloudinaryAsset(story.image);
    }

    // Delete all ratings for this story
    await StoryRating.deleteMany({ storyId: req.params.id });

    await SuccessStory.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, data: {} });
});

// @desc    Submit or update a rating for a story
// @route   POST /api/stories/:id/rate
// @access  Private (authenticated user)
const rateStory = asyncHandler(async (req, res) => {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        res.status(400);
        throw new Error('Rating must be between 1 and 5');
    }

    if (!req.user) {
        res.status(401);
        throw new Error('Authentication required');
    }

    const story = await SuccessStory.findById(req.params.id);
    if (!story) {
        res.status(404);
        throw new Error('Story not found');
    }

    // Update or create rating (upsert by unique index)
    const storyRating = await StoryRating.findOneAndUpdate(
        { storyId: req.params.id, userId: req.user._id },
        { rating },
        { upsert: true, new: true }
    );

    // Recalculate rating summary
    await recalculateRatingSummary(req.params.id);

    // Fetch updated story with new ratings
    const updatedStory = await SuccessStory.findById(req.params.id).populate('studentId', 'name course');

    res.status(200).json({
        success: true,
        message: 'Rating submitted successfully',
        data: updatedStory,
        userRating: storyRating.rating
    });
});

// @desc    Get user's rating for a story
// @route   GET /api/stories/:id/my-rating
// @access  Private (authenticated user)
const getUserRating = asyncHandler(async (req, res) => {
    if (!req.user) {
        res.status(401);
        throw new Error('Authentication required');
    }

    const rating = await StoryRating.findOne({
        storyId: req.params.id,
        userId: req.user._id
    });

    res.status(200).json({
        success: true,
        data: rating ? rating.rating : null
    });
});

module.exports = {
    createStory,
    getUserStories,
    getPublicStories,
    updateStory,
    deleteStory,
    updateUserStory,
    deleteUserStory,
    rateStory,
    getUserRating
};
