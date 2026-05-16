const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const { createAndNotify } = require('../utils/notificationHelper');

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Public/Private
const getNotifications = asyncHandler(async (req, res) => {
    let query = { active: true, recipient: null }; // Start with global notifications

    // If user is logged in, also get their personal notifications
    if (req.user) {
        query = { 
            active: true, 
            $or: [
                { recipient: null },
                { recipient: req.user._id }
            ]
        };
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    res.json(notifications);
});

// @desc    Create a notification
// @route   POST /api/notifications
// @access  Private/Admin
const createNotification = asyncHandler(async (req, res) => {
    const createdNotification = await createAndNotify(req.app, req.body);
    
    if (createdNotification) {
        res.status(201).json(createdNotification);
    } else {
        res.status(400);
        throw new Error('Invalid notification data');
    }
});

// @desc    Update a notification
// @route   PUT /api/notifications/:id
// @access  Private/Admin
const updateNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (notification) {
        notification.title = req.body.title || notification.title;
        notification.message = req.body.message || notification.message;
        notification.type = req.body.type || notification.type;
        notification.priority = req.body.priority || notification.priority;
        notification.link = req.body.link || notification.link;
        notification.active = req.body.active !== undefined ? req.body.active : notification.active;

        const updatedNotification = await notification.save();
        res.json(updatedNotification);
    } else {
        res.status(404);
        throw new Error('Notification not found');
    }
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private/Admin
const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (notification) {
        await notification.deleteOne();
        res.json({ message: 'Notification removed' });
    } else {
        res.status(404);
        throw new Error('Notification not found');
    }
});

module.exports = {
    getNotifications,
    createNotification,
    updateNotification,
    deleteNotification
};
