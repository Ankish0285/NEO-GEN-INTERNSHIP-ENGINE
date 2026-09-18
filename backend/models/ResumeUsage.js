const mongoose = require('mongoose');

/**
 * ResumeUsage — server-side source of truth for how many ATS/AI analyses
 * a student has consumed.  One document per user, upserted on each analysis.
 *
 * freeLimit is copied from the global system setting at the time of first
 * creation and can be overridden per-user by admin if needed.
 */
const resumeUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    freeLimit:    { type: Number, default: 2 },  // configurable by admin
    freeUsed:     { type: Number, default: 0 },
    premiumUsed:  { type: Number, default: 0 },
    lastAnalysisAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ResumeUsage', resumeUsageSchema);
