const Notification = require('../models/Notification');

/**
 * Creates a notification and broadcasts it via Socket.io
 * @param {Object} app - Express app instance to get io
 * @param {Object} notificationData - Data for the notification
 */
const createAndNotify = async (app, { recipient = null, title, message, type = 'new', priority = 'medium', link = '' }) => {
    try {
        const notification = new Notification({
            recipient,
            title,
            message,
            type,
            priority,
            link,
            active: true
        });

        const savedNotification = await notification.save();

        // Broadcast via socket.io
        const io = app.get('io');
        if (io) {
            if (recipient) {
                // Personal notification
                io.emit(`newNotification:${recipient}`, savedNotification);
            } else {
                // Global notification
                io.emit('newNotification', savedNotification);
            }
            console.log(`[Notification] Broadcasted: ${title} to ${recipient || 'all'}`);
        }

        return savedNotification;
    } catch (error) {
        console.error('[Notification Helper] Error:', error);
        return null;
    }
};

module.exports = { createAndNotify };
