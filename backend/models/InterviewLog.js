const mongoose = require('mongoose');

const interviewLogSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      default: null,
    },
    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Internship',
      default: null,
    },
    interviewDate: { type: Date, default: null },
    interviewType: {
      type: String,
      enum: ['phone', 'video', 'onsite', 'technical', 'hr'],
      default: 'video',
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
      default: 'scheduled',
    },
    notes: { type: String, default: '' },
    rating: { type: Number, default: 0 },
    outcome: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'waitlisted'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('InterviewLog', interviewLogSchema);
