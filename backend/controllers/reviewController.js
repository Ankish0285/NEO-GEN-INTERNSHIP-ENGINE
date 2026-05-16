const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
const getReviews = asyncHandler(async (req, res) => {
    // Only fetch verified reviews for public display
    const reviews = await Review.find({ verified: true }).sort({ createdAt: -1 });
    res.json(reviews);
});

// @desc    Create a review
// @route   POST /api/reviews
// @access  Public (Student)
const createReview = asyncHandler(async (req, res) => {
    const { name, university, course, rating, review } = req.body;

    const newReview = new Review({
        name,
        university,
        course,
        rating,
        review,
        verified: false // Default to false, admin must approve
    });

    const createdReview = await newReview.save();
    res.status(201).json(createdReview);
});

// @desc    Verify/Update review
// @route   PUT /api/reviews/:id
// @access  Private/Admin
const updateReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);

    if (review) {
        review.verified = req.body.verified !== undefined ? req.body.verified : review.verified;
        // Admin might want to edit other fields too
        if (req.body.name) review.name = req.body.name;
        if (req.body.review) review.review = req.body.review;

        const updatedReview = await review.save();
        res.json(updatedReview);
    } else {
        res.status(404);
        throw new Error('Review not found');
    }
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
const deleteReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);

    if (review) {
        await review.deleteOne();
        res.json({ message: 'Review removed' });
    } else {
        res.status(404);
        throw new Error('Review not found');
    }
});

module.exports = {
    getReviews,
    createReview,
    updateReview,
    deleteReview
};
