const fs = require('fs');
const path = require('path');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const cloudinary = require('../config/cloudinary');
const { validateProfileData, sanitizeInput } = require('../utils/validation');

function isCloudinaryConfigured() {
  return ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].every((key) => {
    const val = process.env[key];
    return val && !String(val).toLowerCase().includes('your_');
  });
}

async function deleteStoredProfilePicture(storedUrl) {
  if (!storedUrl || typeof storedUrl !== 'string') return;
  if (/res\.cloudinary\.com/i.test(storedUrl)) {
    try {
      const urlParts = storedUrl.split('/');
      const versionIndex = urlParts.findIndex((p) => p.startsWith('v'));
      if (versionIndex !== -1) {
        const publicIdWithExt = urlParts.slice(versionIndex + 1).join('/');
        const publicId = publicIdWithExt.split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (err) {
      console.log('[Profile] Could not delete Cloudinary image:', err.message);
    }
  } else if (storedUrl.startsWith('/uploads/')) {
    const diskPath = path.join(__dirname, '..', 'uploads', path.basename(storedUrl));
    try {
      fs.unlinkSync(diskPath);
    } catch (_) {}
  }
}

// @desc    Get current user profile
// @route   GET /api/profile/me
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePicture: user.profilePicture,
      university: user.university,
      course: user.course,
      skills: user.skills,
      experience: user.experience,
      projects: user.projects,
      resume: user.resume,
      profileCompletionPercentage: user.profileCompletionPercentage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/profile/update
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  // Validate input data
  const validation = validateProfileData(req.body);
  if (!validation.isValid) {
    res.status(400);
    throw new Error(validation.errors.join(', '));
  }

  const user = await User.findById(req.user.id);

  if (user) {
    // Sanitize inputs
    if (req.body.name) user.name = sanitizeInput(req.body.name);
    if (req.body.phone !== undefined) {
      // Allow empty phone number, only sanitize if provided
      user.phone = req.body.phone && req.body.phone.trim() ? sanitizeInput(req.body.phone) : '';
    }
    if (req.body.university) user.university = sanitizeInput(req.body.university);
    if (req.body.course) user.course = sanitizeInput(req.body.course);
    if (req.body.preferredLocation) user.preferredLocation = sanitizeInput(req.body.preferredLocation);
    
    if (req.body.skills) {
      user.skills = Array.isArray(req.body.skills) 
        ? req.body.skills.map(skill => sanitizeInput(skill))
        : user.skills;
    }
    
    if (req.body.experience) user.experience = req.body.experience;
    if (req.body.projects) user.projects = req.body.projects;
    if (req.body.resume) user.resume = req.body.resume;

    const updatedUser = await user.save();

    // Log activity
    await ActivityLog.create({
      user: user._id,
      action: 'Updated Profile',
      details: { updatedFields: Object.keys(req.body) },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      profilePicture: updatedUser.profilePicture,
      university: updatedUser.university,
      course: updatedUser.course,
      preferredLocation: updatedUser.preferredLocation,
      skills: updatedUser.skills,
      experience: updatedUser.experience,
      projects: updatedUser.projects,
      resume: updatedUser.resume,
      profileCompletionPercentage: updatedUser.profileCompletionPercentage,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Upload profile picture
// @route   POST /api/profile/upload-picture
// @access  Private
const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const cloudReady = isCloudinaryConfigured();
  let resultUrl;

  if (cloudReady) {
    let uploadResult;
    try {
      uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: 'neo-gen/profile-pictures',
      });
    } catch (err) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_) {}
      res.status(500);
      throw new Error(`Failed to upload profile picture: ${err.message}`);
    }
    try {
      fs.unlinkSync(req.file.path);
    } catch (_) {}
    resultUrl = uploadResult.secure_url;
    console.log('[Profile] Uploaded to Cloudinary:', resultUrl);
  } else {
    resultUrl = `/uploads/${req.file.filename}`;
    console.log('[Profile] Stored locally:', resultUrl);
  }

  const previous = user.profilePicture;
  if (previous) {
    await deleteStoredProfilePicture(previous);
  }

  user.profilePicture = resultUrl;
  await user.save();

  await ActivityLog.create({
    user: user._id,
    action: 'Updated Profile Picture',
    details: { imageUrl: resultUrl },
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.json({
    success: true,
    message: 'Profile picture uploaded successfully',
    profilePicture: resultUrl,
    profileCompletionPercentage: user.profileCompletionPercentage,
  });
});

// @desc    Delete profile picture
// @route   DELETE /api/profile/delete-picture
// @access  Private
const deleteProfilePicture = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!user.profilePicture) {
    res.status(400);
    throw new Error('No profile picture to delete');
  }

  await deleteStoredProfilePicture(user.profilePicture);

  user.profilePicture = undefined;
  await user.save();

  // Log activity
  await ActivityLog.create({
    user: user._id,
    action: 'Deleted Profile Picture',
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: 'Profile picture deleted successfully',
    profileCompletionPercentage: user.profileCompletionPercentage
  });
});

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
};
