const mongoose = require('mongoose');

const internshipSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
    },
    organization: {
      type: String,
      required: [true, 'Please add an organization name'],
    },
    department: {
      type: String,
      required: [true, 'Please add a department'],
    },
    duration: {
      type: String,
      required: [true, 'Please add duration'],
    },
    stipend: {
      type: String,
      required: [true, 'Please add stipend details'],
    },
    location: {
      type: String,
      required: [true, 'Please add location'],
    },
    eligibility: {
      type: String,
      required: [true, 'Please add eligibility criteria'],
    },
    deadline: {
      type: Date,
      required: [true, 'Please add application deadline'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    skills: {
      type: [String],
      required: [true, 'Please add at least one skill'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    applyLink: {
      type: String,
      required: false, // Optional for internal application
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'active', 'published', 'closed', 'expired'],
      default: 'pending',
    },
    stats: {
      views: { type: Number, default: 0 },
      applied: { type: Number, default: 0 },
      hired: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Internship', internshipSchema);

