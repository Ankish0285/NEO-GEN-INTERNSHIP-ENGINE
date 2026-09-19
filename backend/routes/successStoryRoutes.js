const express = require('express');
const router = express.Router();
const {
    createStory,
    getUserStories,
    getPublicStories,
    updateStory,
    deleteStory,
    updateUserStory,
    deleteUserStory,
    rateStory,
    getUserRating
} = require('../controllers/successStoryController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public endpoints
router.get('/', getPublicStories);  // Get all approved/public stories

// User stories (authenticated)
router.post('/add', protect, createStory);  // Create story
router.get('/me', protect, getUserStories);  // Get current user's stories
router.put('/user/:id', protect, updateUserStory);  // Update own story
router.delete('/user/:id', protect, deleteUserStory);  // Delete own story

// Rating endpoints (authenticated)
router.post('/:id/rate', protect, rateStory);  // Submit or update rating
router.get('/:id/my-rating', protect, getUserRating);  // Get user's rating

// Admin endpoints
router.put('/:id', protect, admin, updateStory);  // Update story (admin)
router.delete('/:id', protect, admin, deleteStory);  // Delete story (admin)

module.exports = router;
