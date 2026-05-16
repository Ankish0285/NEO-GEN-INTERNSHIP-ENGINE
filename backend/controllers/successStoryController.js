const asyncHandler = require('express-async-handler');
const SuccessStory = require('../models/SuccessStory');


// @desc    Create a success story
// @route   POST /api/stories/add
// @access  Public/Private
const createStory = asyncHandler(async (req, res) => {
    const { experience, rating, image, name, college, company } = req.body;
    
    if (!experience || !rating) {
        res.status(400);
        throw new Error('Please provide experience and rating');
    }

    const storyData = { experience, rating, image, name, college, company, status: 'approved' };
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
    const story = await SuccessStory.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );
    
    if (!story) {
        res.status(404);
        throw new Error('Story not found');
    }

    res.status(200).json({ success: true, data: story });
});

// @desc    Delete a story
// @route   DELETE /api/stories/:id
// @access  Private (Admin)
const deleteStory = asyncHandler(async (req, res) => {
    const story = await SuccessStory.findByIdAndDelete(req.params.id);
    
    if (!story) {
        res.status(404);
        throw new Error('Story not found');
    }

    res.status(200).json({ success: true, data: {} });
});

module.exports = { createStory, getStories, updateStory, deleteStory };
