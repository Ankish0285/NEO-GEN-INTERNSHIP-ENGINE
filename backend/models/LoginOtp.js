const mongoose = require('mongoose');

const loginOtpSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true, unique: true },
    otp: { type: String, required: true },
    otpExpires: { type: Date, required: true },
    otpAttempts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, expires: 600 }
});

loginOtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

module.exports = mongoose.model('LoginOtp', loginOtpSchema);