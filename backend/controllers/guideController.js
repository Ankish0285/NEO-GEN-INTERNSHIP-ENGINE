const asyncHandler = require('express-async-handler');
const Guide = require('../models/Guide');

// @desc    Get all guides
// @route   GET /api/guides
// @access  Public
const getGuides = asyncHandler(async (req, res) => {
    const guides = await Guide.find();
    res.status(200).json(guides);
});

// @desc    Create new guide
// @route   POST /api/guides
// @access  Private/Admin
const createGuide = asyncHandler(async (req, res) => {
    req.body.author = req.user.id;
    const guide = await Guide.create(req.body);
    res.status(201).json(guide);
});

// @desc    Update guide
// @route   PUT /api/guides/:id
// @access  Private/Admin
const updateGuide = asyncHandler(async (req, res) => {
    const guide = await Guide.findById(req.params.id);

    if (!guide) {
        res.status(404);
        throw new Error('Guide not found');
    }

    const updatedGuide = await Guide.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });

    res.status(200).json(updatedGuide);
});

// @desc    Delete guide
// @route   DELETE /api/guides/:id
// @access  Private/Admin
const deleteGuide = asyncHandler(async (req, res) => {
    const guide = await Guide.findById(req.params.id);

    if (!guide) {
        res.status(404);
        throw new Error('Guide not found');
    }

    await guide.deleteOne();

    res.status(200).json({ id: req.params.id });
});

module.exports = {
    getGuides,
    createGuide,
    updateGuide,
    deleteGuide,
};
