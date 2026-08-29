const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Application = require('../models/Application');
const { createAndNotify } = require('../utils/notificationHelper');
const bcrypt = require('bcryptjs');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
    res.status(200).json(users);
});

// @desc    Get partners (admin only)
// @route   GET /api/users/partners
// @access  Private/Admin
const getPartners = asyncHandler(async (req, res) => {
    const partners = await User.find({ role: 'partner' }).select('-password');
    res.status(200).json(partners);
});

// @desc    Create partner account (admin)
// @route   POST /api/users/partner
// @access  Private/Admin
const createPartner = asyncHandler(async (req, res) => {
    const { email, password, organization, contactName, contactPhone, name } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Email is required');
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
        res.status(400);
        throw new Error('Email already exists');
    }

    const pwd = password || Math.random().toString(36).slice(-10) + 'A1!';
    const hashed = await bcrypt.hash(pwd, 10);

    const user = await User.create({
        name: name || organization || 'Partner',
        email: email.toLowerCase(),
        password: hashed,
        role: 'partner',
        partnerStatus: 'approved',
        isVerified: true,
        partnerInfo: {
            organization: organization || '',
            contactName: contactName || '',
            contactPhone: contactPhone || '',
        },
    });

    res.status(201).json({
        _id: user._id,
        email: user.email,
        role: user.role,
        partnerInfo: user.partnerInfo,
        generatedPassword: password ? undefined : pwd,
    });
});

// @desc    Block user (admin only)
// @route   PUT /api/users/:id/block
// @access  Private/Admin
const blockUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user || user.role === 'admin' || user.role === 'super_admin') {
        res.status(404);
        throw new Error('User not found');
    }

    const desiredBlockedState = typeof req.body?.isBlocked === 'boolean' ? req.body.isBlocked : true;
    user.isBlocked = desiredBlockedState;
    await user.save();

    // Notify user about block/unblock status
    await createAndNotify(req.app, {
        recipient: user._id,
        title: user.isBlocked ? 'Account Blocked' : 'Account Unblocked',
        message: user.isBlocked 
            ? 'Your account has been blocked by an admin. Please contact support if you believe this is a mistake.'
            : 'Your account has been unblocked. You can now access all features.',
        type: 'personal',
        priority: 'high'
    });

    res.status(200).json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}`, user });
});

// @desc    Block/Unblock user
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const toggleUserStatus = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Toggle status
    user.active = !user.active;
    await user.save();

    res.status(200).json({ message: `User ${user.active ? 'activated' : 'deactivated'}`, user });
});

// @desc    Delete user and related applications (admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user || user.role === 'admin' || user.role === 'super_admin') {
        res.status(404);
        throw new Error('User not found');
    }

    const applicationsDeleted = await Application.deleteMany({ student: user._id });
    await User.deleteOne({ _id: user._id });

    res.status(200).json({
        message: 'User deleted successfully',
        deletedUserId: user._id,
        deletedApplications: applicationsDeleted.deletedCount || 0
    });
});

// @desc    Delete my account
// @route   DELETE /api/users/delete-account
// @access  Private
const deleteMyAccount = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Delete related data
    const applicationsDeleted = await Application.deleteMany({ student: user._id });

    // TODO: Delete resume from Cloudinary if public_id is available or parsable
    // currently we only store the URL string.

    await User.deleteOne({ _id: user._id });

    res.status(200).json({
        message: 'Account deleted successfully',
        deletedUserId: user._id,
        deletedApplications: applicationsDeleted.deletedCount || 0
    });
});

module.exports = {
    getUsers,
    toggleUserStatus,
    blockUser,
    deleteUser,
    deleteMyAccount,
    createPartner,
    getPartners
};
