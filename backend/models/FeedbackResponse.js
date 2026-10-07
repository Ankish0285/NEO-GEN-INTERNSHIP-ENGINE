const mongoose = require('mongoose');

const feedbackResponseSchema = mongoose.Schema(
  {
    form: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeedbackForm',
      required: true,
    },
    respondent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    answers: [
      {
        question: { type: String },
        answer: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FeedbackResponse', feedbackResponseSchema);
