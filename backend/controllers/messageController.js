const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');

// @desc    Create new message
// @route   POST /api/messages
// @access  Public
const createMessage = asyncHandler(async (req, res) => {
    const message = await Message.create(req.body);
    res.status(201).json(message);
});

// @desc    Get all messages
// @route   GET /api/messages
// @access  Private/Admin
const getMessages = asyncHandler(async (req, res) => {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
});

// @desc    Update message status
// @route   PUT /api/messages/:id
// @access  Private/Admin
const updateMessageStatus = asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);

    if (!message) {
        res.status(404);
        throw new Error('Message not found');
    }

    message.status = req.body.status || message.status;
    await message.save();

    res.status(200).json(message);
});

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private/Admin
const deleteMessage = asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);

    if (!message) {
        res.status(404);
        throw new Error('Message not found');
    }

    await message.deleteOne();
    res.status(200).json({ id: req.params.id });
});

module.exports = {
    createMessage,
    getMessages,
    updateMessageStatus,
    deleteMessage
};
