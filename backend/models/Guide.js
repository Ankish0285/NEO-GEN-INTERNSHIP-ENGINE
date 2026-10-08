const mongoose = require('mongoose');

const guideSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    sections: [
      {
        title: { type: String, required: true },
        content: { type: String, required: true },
        duration: String,
        difficulty: String
      }
    ],
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'published'
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    estimatedTime: {
        type: String,
        required: [true, 'Please add estimated time'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    youtubeUrl: {
      type: String,
      default: null,
    },
    youtubeVideoId: {
      type: String,
      default: null,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      enum: ['Interview Prep', 'Resume & CV', 'Career Development', 'Industry Insights', 'Soft Skills', 'Technical Skills', 'Other'],
      default: 'Other',
    },
    tags: [{ type: String }],
    targetAudience: {
      type: String,
      enum: ['students', 'partners', 'both', 'public'],
      default: 'students',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Guide', guideSchema);
