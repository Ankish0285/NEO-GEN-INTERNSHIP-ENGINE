const mongoose = require('mongoose');

const storyRatingSchema = new mongoose.Schema({
    storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'SuccessStory', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
}, { timestamps: true });

// Unique index: one user can have only one rating per story
storyRatingSchema.index({ storyId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('StoryRating', storyRatingSchema);
