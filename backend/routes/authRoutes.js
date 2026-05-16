const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, verifyOtp, sendOtp, googleLogin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/send-otp', sendOtp);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);

module.exports = router;
