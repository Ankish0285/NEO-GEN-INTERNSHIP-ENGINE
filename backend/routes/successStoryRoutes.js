const express = require('express');
const router = express.Router();
const { createStory, getStories, updateStory, deleteStory } = require('../controllers/successStoryController');
const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');

router.route('/')
    .get(getStories);

router.route('/add')
    .post(optionalAuth, createStory);

router.route('/:id')
    .put(protect, admin, updateStory)
    .delete(protect, admin, deleteStory);

// To handle requests without Auth for now if public can submit
// In production, the client can use an authenticated POST or unauthenticated one
// It's handled gracefully in the controller if req.user is absent.

module.exports = router;
