const mongoose = require('mongoose');

const evidenceSourceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['resume', 'project', 'internship', 'certificate', 'assessment', 'learning', 'interview', 'feedback'],
      required: true,
    },
    description: { type: String },
    strength: {
      type: String,
      enum: ['weak', 'moderate', 'strong'],
      default: 'moderate',
    },
    verifiedAt: { type: Date },
    sourceId: { type: String },
    notes: { type: String },
  },
  { _id: false }
);

const skillEvidenceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skillName: { type: String, required: true },
    proficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner',
    },
    confidenceScore: { type: Number, min: 0, max: 100, default: 0 },
    evidenceSources: [evidenceSourceSchema],
    relatedProjects: [{ type: String }],
    relatedInternships: [{ type: mongoose.Schema.Types.ObjectId }],
    lastVerified: { type: Date },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound unique index: one document per user+skill
skillEvidenceSchema.index({ user: 1, skillName: 1 }, { unique: true });

module.exports = mongoose.model('SkillEvidence', skillEvidenceSchema);
