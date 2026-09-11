const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const TempUser = require('../models/TempUser');
const ActivityLog = require('../models/ActivityLog');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const normalizeOrigin = (value) => String(value || '').trim().replace(/\/$/, '');

const getFrontendOrigin = (req) => {
    const configuredOrigin = normalizeOrigin(process.env.PUBLIC_FRONTEND_URL);
    if (configuredOrigin) return configuredOrigin;

    const requestOrigin = normalizeOrigin(req.get('origin'));
    if (requestOrigin) return requestOrigin;

    const apiOrigin = normalizeOrigin(process.env.PUBLIC_API_URL || process.env.VITE_API_ORIGIN);
    if (apiOrigin) {
        return apiOrigin
            .replace(/:5000$/i, ':3000')
            .replace(/\/api$/i, '');
    }

    return 'http://localhost:3000';
};

// @desc    Register new user (Step 1: Save temp & Send OTP)
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;

        console.log(`[Auth] Registration attempt for email: ${email}`);
        console.log(`[Auth] Phone provided: ${phone ? 'Yes' : 'No (optional)'}`);

        // Validate required fields
        if (!name || !email || !password) {
            console.error('[Auth] Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Please add all required fields: name, email, password'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.error('[Auth] Invalid email format');
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            console.error('[Auth] User already exists');
            return res.status(400).json({
                success: false,
                message: 'Email already registered. Please login or use a different email.'
            });
        }

        // Generate 6-digit OTP
        const otpLength = parseInt(process.env.OTP_LENGTH) || 6;
        const otp = Math.floor(Math.pow(10, otpLength - 1) + Math.random() * (Math.pow(10, otpLength) - Math.pow(10, otpLength - 1))).toString();
        
        // OTP expires in 5 minutes (or configured time)
        const otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
        const otpExpires = Date.now() + otpExpiryMinutes * 60 * 1000;

        console.log(`[Auth] Generated OTP for ${email}: ${otp} (expires in ${otpExpiryMinutes} min)`);

        // Create or Update TempUser
        let tempUser = await TempUser.findOne({ email: email.toLowerCase() });
        if (tempUser) {
            tempUser.name = name;
            tempUser.password = password;
            tempUser.phone = phone || ''; // Phone is optional
            tempUser.otp = otp;
            tempUser.otpExpires = otpExpires;
            tempUser.otpAttempts = 0; // Reset attempts
            await tempUser.save();
            console.log(`[Auth] ✅ Updated existing TempUser for ${email}`);
        } else {
            tempUser = await TempUser.create({
                name,
                email: email.toLowerCase(),
                password,
                phone: phone || '', // Phone is optional
                otp,
                otpExpires,
                otpAttempts: 0
            });
            console.log(`[Auth] ✅ Created new TempUser for ${email}`);
        }

        // Send OTP Email
        const message = `
Dear ${name},

Your OTP for NEO GEN registration is: ${otp}

This code will expire in ${otpExpiryMinutes} minutes.

If you didn't request this, please ignore this email.

Best regards,
NEO GEN Team
`;

        // Console fallback for OTP (for development/debugging)
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🔐 OTP GENERATED FOR REGISTRATION`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📧 Email:    ${tempUser.email}`);
        console.log(`👤 Name:     ${name}`);
        console.log(`🔑 OTP:      ${otp}`);
        console.log(`⏱️  Expires:  ${otpExpiryMinutes} minutes`);
        console.log(`📱 Phone:    ${phone || 'Not provided (optional)'}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

        // Attempt to send email
        try {
            await sendEmail({
                email: tempUser.email,
                subject: 'NEO GEN - Registration OTP Verification',
                message,
                html: `
                    <div style="font-family: Arial, sans-serif;">
                        <h2>Welcome to NEO GEN!</h2>
                        <p>Dear <strong>${name}</strong>,</p>
                        <p>Your OTP for registration is:</p>
                        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
                            <h1 style="color: #2c3e50; letter-spacing: 5px; margin: 0;">${otp}</h1>
                        </div>
                        <p><strong>This code expires in ${otpExpiryMinutes} minutes.</strong></p>
                        <p>If you didn't request this code, please ignore this email.</p>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        <p style="font-size: 12px; color: #999;">NEO GEN - Internship Engine © 2026</p>
                    </div>
                `
            });

            console.log(`[Auth] ✅ OTP email sent successfully to ${tempUser.email}`);
            return res.status(200).json({ 
                success: true,
                message: `OTP sent to ${email}. Check your email and spam folder.`,
                email: tempUser.email 
            });

        } catch (emailError) {
            console.error(`[Auth] ❌ Email sending failed:`, emailError.message);
            
            // Don't delete temp user - keep OTP for manual verification
            // This allows development to continue even if email fails
            console.log(`[Auth] ⚠️  TempUser preserved for manual OTP verification`);
            console.log(`[Auth] ⚠️  Use the OTP from console logs above`);
            
            return res.status(200).json({ 
                success: true,
                message: `Registration successful! Use OTP from server logs (Email service temporarily unavailable).`,
                email: tempUser.email,
                warning: 'Email delivery failed - check server console for OTP'
            });
        }

    } catch (error) {
        console.error(`[Auth] ❌ Registration error:`, error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Registration failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// @desc    Verify OTP and Create Account (Step 2)
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        res.status(400);
        throw new Error('Email and OTP are required');
    }

    const tempUser = await TempUser.findOne({ email: email.toLowerCase() });

    if (!tempUser) {
        res.status(400);
        throw new Error('No registration found for this email. Please register again.');
    }

    // Check OTP expiry FIRST
    if (Date.now() > tempUser.otpExpires) {
        // Clean up expired record
        await TempUser.deleteOne({ email: email.toLowerCase() });
        res.status(400);
        throw new Error('OTP has expired. Please register again to get a new OTP.');
    }

    // Check OTP validity
    if (tempUser.otp !== otp.toString()) {
        tempUser.otpAttempts = (tempUser.otpAttempts || 0) + 1;
        
        // Lock after 3 failed attempts
        if (tempUser.otpAttempts >= 3) {
            await TempUser.deleteOne({ email: email.toLowerCase() });
            res.status(400);
            throw new Error('Too many failed OTP attempts. Please register again.');
        }
        
        await tempUser.save();
        res.status(400);
        throw new Error(`Invalid OTP. ${3 - tempUser.otpAttempts} attempts remaining.`);
    }

    try {
        // Create Real User
        const user = await User.create({
            name: tempUser.name,
            email: tempUser.email,
            password: tempUser.password, // User model will hash this
            phone: tempUser.phone,
            role: 'student',
            active: true
        });

        // Delete TempUser after successful verification
        await TempUser.deleteOne({ email: email.toLowerCase() });

        // Log Activity
        try {
            await ActivityLog.create({
                user: user._id,
                action: 'Registered & Email Verified',
                details: { role: user.role, email: user.email },
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
        } catch (err) {
            console.error('[Auth] Activity log error:', err);
        }

        console.log(`[Auth] User ${user.email} successfully registered and verified`);

        res.status(201).json({
            success: true,
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            message: 'Registration successful! You are now logged in.',
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('[Auth] User creation error:', error);
        res.status(500);
        throw new Error('Failed to create account. Please try again.');
    }
});

// @desc    Send/Resend OTP
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Email is required');
    }

    const tempUser = await TempUser.findOne({ email: email.toLowerCase() });
    if (!tempUser) {
        res.status(404);
        throw new Error('No pending registration found. Please register first.');
    }

    try {
        // Check if OTP is still valid (resend only if close to expiry or user requests)
        const timeRemaining = tempUser.otpExpires - Date.now();
        const minutesRemaining = Math.floor(timeRemaining / 60000);

        // Allow resend if less than 1 minute remaining
        if (minutesRemaining > 1) {
            return res.status(200).json({ 
                success: true,
                message: `OTP is still valid for ${minutesRemaining} more minutes. Check your email.`,
                expiresIn: minutesRemaining
            });
        }

        // Generate new OTP
        const otpLength = parseInt(process.env.OTP_LENGTH) || 6;
        const newOtp = Math.floor(Math.pow(10, otpLength - 1) + Math.random() * (Math.pow(10, otpLength) - Math.pow(10, otpLength - 1))).toString();
        
        const otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
        const newOtpExpires = Date.now() + otpExpiryMinutes * 60 * 1000;

        tempUser.otp = newOtp;
        tempUser.otpExpires = newOtpExpires;
        tempUser.otpAttempts = 0; // Reset attempts
        await tempUser.save();

        console.log(`[Auth] Resending OTP for ${email}: ${newOtp}`);

        // Fallback: Log OTP to console for debugging (REMOVE IN PRODUCTION)
        console.log(`\n[Auth - OTP Fallback] ════════════════════════════════════════`);
        console.log(`[Auth - OTP Fallback] 📧 Email: ${tempUser.email}`);
        console.log(`[Auth - OTP Fallback] 🔐 NEW OTP Code: ${newOtp}`);
        console.log(`[Auth - OTP Fallback] ⏱️  Expires in: ${otpExpiryMinutes} minutes`);
        console.log(`[Auth - OTP Fallback] ════════════════════════════════════════\n`);

        // Send Email
        const message = `
Your new OTP for NEO GEN registration is: ${newOtp}

This code will expire in ${otpExpiryMinutes} minutes.

If you didn't request this, please ignore this email.
`;

        await sendEmail({
            email: tempUser.email,
            subject: 'NEO GEN - New Registration OTP',
            message,
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2>NEO GEN - New OTP</h2>
                    <p>Your new OTP for registration is:</p>
                    <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #2c3e50; letter-spacing: 5px; margin: 0;">${newOtp}</h1>
                    </div>
                    <p><strong>This code expires in ${otpExpiryMinutes} minutes.</strong></p>
                    <p>If you didn't request this code, please ignore this email.</p>
                </div>
            `
        });

        console.log(`[Auth] OTP resent successfully to ${tempUser.email}`);

        res.status(200).json({ 
            success: true,
            message: 'New OTP sent to your email',
            expiresIn: otpExpiryMinutes
        });

    } catch (error) {
        console.error(`[Auth] Resend OTP error for ${email}:`, error.message);
        res.status(500);
        throw new Error(`Failed to resend OTP: ${error.message}`);
    }
});


// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    console.log(`[Auth] Login attempt for: ${email}`);

    // Validate input
    if (!email || !password) {
        console.log('[Auth] Missing email or password');
        return res.status(400).json({
            success: false,
            message: 'Please provide email and password'
        });
    }

    // Check for user email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
        console.log(`[Auth] User not found: ${email}`);
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    const isMatch = await user.matchPassword(password);
    console.log(`[Auth] Comparison for ${email}: match=${isMatch}, passwordLength=${password.length}`);
    console.log(`[Auth] Hashed password in DB (start): ${user.password.substring(0, 10)}...`);
    if (!isMatch) {
        console.log(`[Auth] Password mismatch for: ${email}`);
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    if (user.isBlocked) {
        return res.status(403).json({
            success: false,
            message: 'Your account has been blocked. Please contact support.'
        });
    }

    if (user.role === 'partner') {
        if (user.partnerStatus === 'pending') {
            return res.status(403).json({
                success: false,
                message: 'Your partner account is pending approval. Please contact the Super Admin.'
            });
        }
        if (user.partnerStatus === 'rejected') {
            return res.status(403).json({
                success: false,
                message: 'Your partner application was rejected. Please contact support.'
            });
        }
    }

    const activityByRole = {
        admin: 'Super Admin Logged In',
        partner: 'Partner Logged In',
        student: 'Logged In',
    };

    try {
        await ActivityLog.create({
            user: user._id,
            action: activityByRole[user.role] || 'Logged In',
            details: user.role === 'partner'
                ? { email: user.email, organization: user.partnerInfo?.organization }
                : { email: user.email },
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    } catch (err) {
        console.error('Activity log error:', err);
    }

    console.log(`[Auth] User ${email} (${user.role}) logged in successfully`);

    const payload = {
        success: true,
        token: generateToken(user._id),
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        profilePicture: user.profilePicture || '',
        university: user.university || '',
        course: user.course || '',
        profileCompletionPercentage: user.profileCompletionPercentage ?? 0,
        message: 'Login successful',
    };

    if (user.role === 'partner') {
        payload.partnerStatus = user.partnerStatus;
        payload.partnerInfo = user.partnerInfo;
    }

    res.status(200).json(payload);
});

// @desc    Authenticate super admin only
// @route   POST /api/admin/login
// @access  Public
const loginSuperAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Please provide email and password');
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[Auth] Super Admin login attempt: ${normalizedEmail}`);

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
        res.status(401);
        throw new Error('Invalid email or password');
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
        res.status(403);
        throw new Error('Access denied. Super Admin credentials required.');
    }

    if (user.isBlocked) {
        res.status(403);
        throw new Error('Your account has been blocked. Please contact support.');
    }

    try {
        await ActivityLog.create({
            user: user._id,
            action: 'Super Admin Logged In',
            details: { email: user.email },
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    } catch (err) {
        console.error('[Auth] Activity log error:', err);
    }

    const token = generateToken(user._id);
    console.log(`[Auth] Super Admin ${normalizedEmail} logged in successfully`);

    res.status(200).json({
        success: true,
        token,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        message: 'Super Admin login successful'
    });
});

// @desc    Authenticate partner only
// @route   POST /api/partner/login
// @access  Public
const loginPartner = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Please provide email and password');
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[Auth] Partner login attempt: ${normalizedEmail}`);

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
        res.status(401);
        throw new Error('Invalid email or password');
    }

    if (user.role !== 'partner') {
        res.status(403);
        throw new Error('Access denied. Partner credentials required.');
    }

    if (user.isBlocked) {
        res.status(403);
        throw new Error('Your account has been blocked. Please contact support.');
    }

    if (user.partnerStatus === 'pending') {
        res.status(403);
        throw new Error('Your partner account is pending approval. Please contact the Super Admin.');
    }

    if (user.partnerStatus === 'rejected') {
        res.status(403);
        throw new Error('Your partner application was rejected. Please contact support.');
    }

    try {
        await ActivityLog.create({
            user: user._id,
            action: 'Partner Logged In',
            details: { email: user.email, organization: user.partnerInfo?.organization },
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    } catch (err) {
        console.error('[Auth] Activity log error:', err);
    }

    const token = generateToken(user._id);
    console.log(`[Auth] Partner ${normalizedEmail} logged in successfully`);

    res.status(200).json({
        success: true,
        token,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        partnerStatus: user.partnerStatus,
        partnerInfo: user.partnerInfo,
        message: 'Partner login successful'
    });
});

// ==============================================================
// @desc    Request Password Reset (send email with secure link)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Email is required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[Auth] Forgot password request for: ${normalizedEmail}`);

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        // Don't leak information about whether an account exists.
        // Return the same generic success response for security.
        console.log(`[Auth] Forgot password: email not registered, but returning generic success`);
        return res.status(200).json({
            success: true,
            message: 'If that email is registered, we have sent password reset instructions to it. Please also check your spam folder.'
        });
    }

    // Generate cryptographically-secure random reset token (raw version - sent only in email)
    const resetTokenRaw = crypto.randomBytes(32).toString('hex');

    // Store HASHED (one-way) version of the token in DB
    user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetTokenRaw)
        .digest('hex');

    // Expire in 15 minutes
    const EXPIRE_MINUTES = 15;
    user.resetPasswordExpire = new Date(Date.now() + EXPIRE_MINUTES * 60 * 1000);

    await user.save({ validateBeforeSave: false });

    // Determine public reset URL from env (local dev OR AWS production)
    const resetUrl = `${getFrontendOrigin(req)}/reset-password/${resetTokenRaw}`;

    const message = `
Dear ${user.name || 'User'},

We received a request to reset your password on NEO GEN Internship Engine.

Please click the link below to set a new password:

${resetUrl}

This link will expire in ${EXPIRE_MINUTES} minutes and can be used only ONCE.

If you did not request a password reset, please ignore this email — your password will remain unchanged.

Best regards,
NEO GEN Team
`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 24px; border-radius: 8px;">
          <h2 style="color: #1f2937; margin-bottom: 12px;">NEO GEN - Password Reset</h2>
          <p style="color: #374151; line-height: 1.6;">
            Hi <strong>${user.name || 'there'}</strong>,
          </p>
          <p style="color: #374151; line-height: 1.6;">
            You recently requested to reset your password. Click the button below to continue:
          </p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${resetUrl}"
               style="background-color: #134252; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
              Reset Your Password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">
            Or copy and paste this URL into your browser:
            <br>
            <a href="${resetUrl}" style="word-break: break-all; color: #134252;">${resetUrl}</a>
          </p>
          <p style="color: #ef4444; font-size: 13px;">
            ⚠️ This link expires in <strong>${EXPIRE_MINUTES} minutes</strong> and is valid for <strong>one use only</strong>.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            If you didn't request this, you can safely ignore this email — your password will not be changed.
          </p>
        </div>
      </div>
    `;

    // Console fallback for development (in case SMTP fails user can copy)
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔑 PASSWORD RESET TOKEN (DEV FALLBACK)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📧 Email:       ${normalizedEmail}`);
    console.log(`👤 Role:        ${user.role}`);
    console.log(`⏱️  Expires:     ${EXPIRE_MINUTES} minutes from now`);
    console.log(`🔗 Reset URL:   ${resetUrl}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    try {
        await sendEmail({
            email: normalizedEmail,
            subject: 'NEO GEN - Password Reset Request',
            message,
            html: htmlBody,
        });

        return res.status(200).json({
            success: true,
            message: 'If that email is registered, we have sent password reset instructions to it. Please also check your spam folder.'
        });
    } catch (emailErr) {
        // If email fails, clear the reset token so it's not dangling
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        console.error('[Auth] Forgot password email failed:', emailErr.message);
        res.status(500);
        throw new Error(
            process.env.NODE_ENV === 'development'
                ? `Email could not be sent. Dev reset URL is in server console. Error: ${emailErr.message}`
                : 'Sorry, we could not send the password reset email right now. Please try again in a few minutes or contact support.'
        );
    }
});

// @desc    Reset password using secure token from email link
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!token) {
        res.status(400);
        throw new Error('Reset token is missing');
    }
    if (!newPassword || !confirmPassword) {
        res.status(400);
        throw new Error('New password and confirm password are both required');
    }
    if (newPassword !== confirmPassword) {
        res.status(400);
        throw new Error('New password and confirm password do not match');
    }
    if (newPassword.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters long');
    }

    // Hash incoming token (DB stores only hashed version - one-way)
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
    }).select('+resetPasswordToken +resetPasswordExpire +password');

    if (!user) {
        res.status(400);
        throw new Error('Password reset token is invalid or has already been used');
    }

    if (!user.resetPasswordExpire || Date.now() > user.resetPasswordExpire.getTime()) {
        // Clear expired token
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        res.status(400);
        throw new Error('Password reset token has expired. Please request a new one.');
    }

    // Update password (pre-save hook will bcrypt hash)
    user.password = newPassword;

    // SINGLE-USE: Invalidate token after successful password change
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    try {
        await ActivityLog.create({
            user: user._id,
            action: 'Password Reset Successful',
            details: { method: 'forgot-password-link', role: user.role },
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
    } catch (err) {
        console.warn('[Auth] Reset password activity log error:', err);
    }

    console.log(`[Auth] Password reset successful for: ${user.email} (${user.role})`);

    res.status(200).json({
        success: true,
        message: 'Password updated successfully! You can now log in with your new password.',
        token: generateToken(user._id),
    });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    res.status(200).json(req.user);
});

// @desc    Google Login
// @route   POST /api/auth/google
// @access  Public
const googleLogin = asyncHandler(async (req, res) => {
    const { token } = req.body; // ID Token from frontend

    if (!token) {
        res.status(400);
        throw new Error('Google token is required');
    }

    const expectedAud = (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '').trim();
    if (!expectedAud) {
        res.status(503);
        throw new Error('Google login is not configured on the server. Set GOOGLE_CLIENT_ID before using Google authentication.');
    }

    try {
        // Verify token with Google (using public tokeninfo endpoint)
        // NOTE: For production with google-auth-library this can be swapped for OAuth2Client.verifyIdToken for offline verification and AUDIENCE (CLIENT_ID check)
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        
        if (!response.ok) {
             throw new Error('Invalid Google Token');
        }

        const payload = await response.json();
        const { email, name, sub: googleId, picture } = payload;

        if (!email) {
            res.status(400);
            throw new Error('Google account does not have an email');
        }

        if (!payload.aud || (payload.aud !== expectedAud && !(Array.isArray(payload.aud) && payload.aud.includes(expectedAud)))) {
            res.status(401);
            throw new Error('Google token audience mismatch. Please use the correct Google client configuration.');
        }

        // Check if user exists
        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            // ----- EXISTING USER - LOGIN, PRESERVE EXISTING ROLE =====
            // Link googleId if not yet linked
            if (!user.googleId) {
                user.googleId = googleId;
                try { await user.save({ validateBeforeSave: false }); } catch (_) {}
            }
            if (!user.isVerified) {
                user.isVerified = true;
                try { await user.save({ validateBeforeSave: false }); } catch (_) {}
            }
            if (user.isBlocked) {
                res.status(403);
                throw new Error('Your account has been blocked. Please contact support.');
            }
            if (user.role === 'partner') {
                if (user.partnerStatus === 'pending') {
                    res.status(403);
                    throw new Error('Your partner account is pending approval. Please contact the Super Admin.');
                }
                if (user.partnerStatus === 'rejected') {
                    res.status(403);
                    throw new Error('Your partner application was rejected. Please contact support.');
                }
            }
        } else {
            // ===== NEW USER - REGISTER VIA GOOGLE (default role: student) =====
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            
            user = await User.create({
                name: name || email.split('@')[0],
                email: email.toLowerCase(),
                password: randomPassword,
                role: 'student',
                active: true,
                googleId: googleId,
                isVerified: true,
                profilePicture: picture || '',
                resume: '',
                profileCompletionPercentage: 25,
            });
            
             await ActivityLog.create({
                user: user._id,
                action: 'Registered via Google',
                details: { role: user.role },
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
        }

        // Log Activity - login
        try {
            const activityAction =
                user.role === 'super_admin' || user.role === 'admin' ? 'Super Admin Logged In via Google'
                : user.role === 'partner' ? 'Partner Logged In via Google'
                : 'Logged In via Google';
            await ActivityLog.create({
                user: user._id,
                action: activityAction,
                details: user.role === 'partner'
                    ? { email: user.email, organization: user.partnerInfo?.organization }
                    : { email: user.email },
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
        } catch (err) {
            console.warn('[Auth Google] Activity log error:', err);
        }

        // Build response payload (match loginUser format)
        const payloadOut = {
            success: true,
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone || '',
            profilePicture: user.profilePicture || picture || '',
            university: user.university || '',
            course: user.course || '',
            profileCompletionPercentage: user.profileCompletionPercentage ?? 0,
            isVerified: user.isVerified,
            message: user.role === 'student' ? 'Login successful' : `${user.role} login successful`,
            token: generateToken(user._id),
        };

        if (user.role === 'partner') {
            payloadOut.partnerStatus = user.partnerStatus;
            payloadOut.partnerInfo = user.partnerInfo;
        }

        res.json(payloadOut);

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(error.statusCode || 401);
        throw new Error(error.message || 'Google authentication failed');
    }
});

module.exports = {
    registerUser,
    loginUser,
    loginSuperAdmin,
    loginPartner,
    googleLogin,
    forgotPassword,
    resetPassword,
    getMe,
    verifyOtp,
    sendOtp
};
