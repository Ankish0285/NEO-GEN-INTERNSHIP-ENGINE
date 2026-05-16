const mongoose = require('mongoose');

const successStorySchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // keep optional for now in case of public submissions
    experience: { type: String, required: true, maxlength: 2000 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    image: { type: String }, // Cloudinary link or base64
    name: { type: String },
    college: { type: String },
    company: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('SuccessStory', successStorySchema);
