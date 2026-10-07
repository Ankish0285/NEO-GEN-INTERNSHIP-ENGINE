const mongoose = require('mongoose');

const feedbackFormSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    targetAudience: {
      type: String,
      enum: ['student', 'partner', 'all'],
      default: 'student',
    },
    questions: [
      {
        question: { type: String, required: true },
        type: {
          type: String,
          enum: ['text', 'rating', 'mcq', 'boolean'],
          default: 'text',
        },
        options: { type: [String], default: [] },
        required: { type: Boolean, default: false },
      },
    ],
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FeedbackForm', feedbackFormSchema);
