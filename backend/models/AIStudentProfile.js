const mongoose = require('mongoose');

const aiStudentProfileSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    skillProfile: [String],
    softSkills: [String],
    careerDomain: {
      domain: String,
      label: String,
      confidence: Number,
    },
    strengths: [String],
    weaknesses: [String],
    employabilityScore: { type: Number, default: 0 },
    recommendedCareerPath: [String],
    learningRoadmap: [
      {
        skill: String,
        priority: String,
        course: String,
      },
    ],
    latestAtsScore: { type: Number, default: 0 },
    latestMatchPercentage: { type: Number, default: 0 },
    aiConfidenceScore: { type: Number, default: 0 },
    lastAnalyzedAt: Date,
    rawAnalysis: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AIStudentProfile', aiStudentProfileSchema);
