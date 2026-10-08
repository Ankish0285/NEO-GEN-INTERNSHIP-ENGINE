const mongoose = require('mongoose');

const microAssessmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skillName: {
      type: String,
      required: true,
    },
    questions: [
      {
        question: { type: String },
        options: [String],
        correctIndex: { type: Number },
      },
    ],
    userAnswers: [Number],
    score: { type: Number },
    maxScore: { type: Number },
    completedAt: { type: Date, default: Date.now },
    evidenceAdded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MicroAssessment', microAssessmentSchema);
