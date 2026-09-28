const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyLoginOtp, resendLoginOtp, getMe, verifyOtp, sendOtp, googleLogin, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { verifyTurnstile } = require('../middleware/turnstileMiddleware');

// ── Email / password routes — Turnstile required before controller ──
router.post('/register', verifyTurnstile, registerUser);
router.post('/login',    verifyTurnstile, loginUser);

// ── OTP flows (no Turnstile — user already passed it at login/register) ──
router.post('/verify-otp',         verifyOtp);
router.post('/send-otp',           sendOtp);
router.post('/verify-login-otp',   verifyLoginOtp);
router.post('/resend-login-otp',   resendLoginOtp);

// ── Google OAuth — Turnstile NOT applied; Google handles its own verification ──
router.post('/google', googleLogin);

router.get('/me', protect, getMe);

// Password reset
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

module.exports = router;
