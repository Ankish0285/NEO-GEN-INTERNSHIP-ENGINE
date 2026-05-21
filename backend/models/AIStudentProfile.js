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
    internshipReadinessScore: { type: Number, default: 0 },
    profileSummary: String,
    growthAnalysis: { type: mongoose.Schema.Types.Mixed },
    futureTechnologies: [String],
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
    interests: [String],
    atsHistory: [{ score: Number, at: { type: Date, default: Date.now } }],
    recommendationHistory: [
      {
        internshipId: String,
        title: String,
        matchPercentage: Number,
        at: { type: Date, default: Date.now },
      },
    ],
    chatHistory: [
      {
        role: String,
        message: String,
        at: { type: Date, default: Date.now },
      },
    ],
    preferences: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AIStudentProfile', aiStudentProfileSchema);
