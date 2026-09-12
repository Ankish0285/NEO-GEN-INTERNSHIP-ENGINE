const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyLoginOtp, resendLoginOtp, getMe, verifyOtp, sendOtp, googleLogin, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/send-otp', sendOtp);
router.post('/login', loginUser);
router.post('/verify-login-otp', verifyLoginOtp);
router.post('/resend-login-otp', resendLoginOtp);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);

// Password reset
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

module.exports = router;
