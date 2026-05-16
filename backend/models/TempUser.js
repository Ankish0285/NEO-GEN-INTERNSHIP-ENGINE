const mongoose = require('mongoose');

const tempUserSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: false, default: '' },
    otp: { type: String, required: true },
    otpExpires: { type: Date, required: true },
    otpAttempts: { type: Number, default: 0 }, // Track failed OTP attempts
    createdAt: { 
        type: Date, 
        default: Date.now, 
        expires: 600 // Auto delete after 10 mins
    }
});

// Index to automatically remove old records
tempUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

module.exports = mongoose.model('TempUser', tempUserSchema);
