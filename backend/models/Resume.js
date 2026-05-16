const mongoose = require('mongoose');

const resumeSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    parsedText: {
      type: String, // Store parsed text for ATS matching
    },
    atsScore: {
      type: Number,
      default: 0,
    },
    keywordsMatched: [String],
    missingKeywords: [String],
    // Detailed ATS breakdown
    breakdown: {
      technical: { type: Number, default: 0 },
      softSkills: { type: Number, default: 0 },
      experience: { type: Number, default: 0 },
      education: { type: Number, default: 0 },
      completeness: { type: Number, default: 0 },
      formatting: { type: Number, default: 0 }
    },
    // Resume sections presence
    sections: {
      hasSummary: { type: Boolean, default: false },
      hasExperience: { type: Boolean, default: false },
      hasEducation: { type: Boolean, default: false },
      hasSkills: { type: Boolean, default: false },
      hasProjects: { type: Boolean, default: false },
      hasContact: { type: Boolean, default: false }
    },
    // Improvement suggestions
    suggestions: [String],
    // Extracted information for matching
    extractedSkills: [String],
    wordCount: { type: Number, default: 0 }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Resume', resumeSchema);
