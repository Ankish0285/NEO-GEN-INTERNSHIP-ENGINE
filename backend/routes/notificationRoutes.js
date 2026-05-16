const express = require('express');
const router = express.Router();
const {
    getNotifications,
    createNotification,
    updateNotification,
    deleteNotification
} = require('../controllers/notificationController');
const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');

router.route('/')
    .get(optionalAuth, getNotifications)
    .post(protect, admin, createNotification);

router.route('/:id')
    .put(protect, admin, updateNotification)
    .delete(protect, admin, deleteNotification);

module.exports = router;