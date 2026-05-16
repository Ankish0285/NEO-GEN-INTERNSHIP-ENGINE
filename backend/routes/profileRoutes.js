const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, uploadProfilePicture, deleteProfilePicture } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/me', protect, getProfile);
router.put('/update', protect, updateProfile);
router.post('/upload-picture', protect, upload.single('profilePicture'), uploadProfilePicture);
router.delete('/delete-picture', protect, deleteProfilePicture);

module.exports = router;
