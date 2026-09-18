const asyncHandler = require('express-async-handler');
const SuccessStory = require('../models/SuccessStory');
const { deleteCloudinaryAsset } = require('../utils/cloudinaryCleanup');
const { releaseCloudinaryAsset } = require('../utils/cloudinaryUpload');
const path = require('path');

/**
 * Normalize an image value before writing to the database.
 * - Cloudinary/HTTP/HTTPS URLs are stored unchanged.
 * - Windows absolute paths (C:\...) are converted to /uploads/<filename>
 *   so they are portable across machines.
 * - Other relative paths are stored as-is.
 */
function normalizeStoryImageForStorage(raw) {
    if (!raw || typeof raw !== 'string') return raw;
    const s = raw.trim();
    if (!s) return s;
    // Already an absolute URL — keep it
    if (/^https?:\/\//i.test(s)) return s;
    // Windows absolute path — extract filename only
    if (/^[A-Za-z]:[/\\]/.test(s)) {
        const filename = path.basename(s.replace(/\\/g, '/'));
        return filename ? `/uploads/${filename}` : '';
    }
    return s;
}

// @desc    Create a success story
// @route   POST /api/stories/add
// @access  Public/Private
const createStory = asyncHandler(async (req, res) => {
    const { experience, rating, image, name, college, company } = req.body;
    
    if (!experience || !rating) {
        res.status(400);
        throw new Error('Please provide experience and rating');
    }

    const storyData = { experience, rating, image: normalizeStoryImageForStorage(image), name, college, company, status: 'approved' };
    if (req.user) {
        storyData.studentId = req.user._id;
        if (!name) storyData.name = req.user.name;
    }

    const story = await SuccessStory.create(storyData);
    res.status(201).json({ success: true, data: story });
});

// @desc    Get all stories
// @route   GET /api/stories
// @access  Public
const getStories = asyncHandler(async (req, res) => {
    const query = req.query.status ? { status: req.query.status } : {};
    const stories = await SuccessStory.find(query).populate('studentId', 'name course').sort('-createdAt');
        
    res.status(200).json({ success: true, count: stories.length, data: stories });
});

// @desc    Update a story
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
    );
    
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

// @desc    Delete a story
// @route   DELETE /api/stories/:id
// @access  Private (Admin)
const deleteStory = asyncHandler(async (req, res) => {
    const story = await SuccessStory.findById(req.params.id);

    if (!story) {
        res.status(404);
        throw new Error('Story not found');
    }

    // Release image asset safely (checks refcount — won't delete if shared)
    if (story.image) {
        await releaseCloudinaryAsset(story.image);
    }

    await SuccessStory.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, data: {} });
});

module.exports = { createStory, getStories, updateStory, deleteStory };
