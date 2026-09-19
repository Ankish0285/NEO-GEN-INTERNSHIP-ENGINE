const mongoose = require('mongoose');

const successStorySchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // author of the story
    experience: { type: String, required: true, maxlength: 2000 },
    image: { type: String }, // Cloudinary link or base64
    name: { type: String },
    college: { type: String },
    company: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    // Rating summary (calculated from StoryRating collection)
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('SuccessStory', successStorySchema);
