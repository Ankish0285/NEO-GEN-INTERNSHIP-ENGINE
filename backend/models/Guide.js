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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Guide', guideSchema);
