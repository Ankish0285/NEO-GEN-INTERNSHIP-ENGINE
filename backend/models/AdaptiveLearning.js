const mongoose = require('mongoose');

const adaptiveLearningSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    recommendedGuides: [
      {
        guide: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide' },
        reason: { type: String },
        priority: { type: Number },
      },
    ],
    completedGuides: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Guide' }],
    currentSkillGaps: { type: [String], default: [] },
    learningPath: [
      {
        skill: { type: String },
        course: { type: String },
        priority: { type: Number },
        estimatedWeeks: { type: Number },
      },
    ],
    lastUpdated: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AdaptiveLearning', adaptiveLearningSchema);
