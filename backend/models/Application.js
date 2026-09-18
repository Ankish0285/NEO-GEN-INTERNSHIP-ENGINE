const mongoose = require('mongoose');

const applicationSchema = mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Internship',
      required: true,
    },
    details: {
      fullName: { type: String },
      email: { type: String },
      phone: { type: String },
      college: { type: String },
      course: { type: String },
      year: { type: String },
      gpa: { type: String },
      skills: { type: [String], default: [] },
      experience: { type: String },
      resumePath: { type: String },
      portfolio: { type: String },
      github: { type: String },
      linkedin: { type: String },
      notes: { type: String },
    },
    status: {
      type: String,
      // Workflow: Applied → Shortlisted → Interview → Selected | Rejected
      // Legacy values (Viewed, Under Review, Accepted) kept for backward-compat
      enum: ['Applied', 'Viewed', 'Under Review', 'Shortlisted', 'Interview', 'Accepted', 'Selected', 'Rejected'],
      default: 'Applied',
    },
    resume: {
      type: String, // Link to resume file
    },
    atsScore: {
      type: Number,
      default: 0
    },
    coverLetter: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Application', applicationSchema);
