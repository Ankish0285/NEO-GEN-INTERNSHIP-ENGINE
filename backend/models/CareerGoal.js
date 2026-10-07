const mongoose = require('mongoose');

const careerGoalSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    targetRoles: { type: [String], default: [] },
    targetDomains: { type: [String], default: [] },
    targetCompanies: { type: [String], default: [] },
    preferredLocation: { type: String, default: '' },
    expectedSalary: { type: String, default: '' },
    targetTimeline: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CareerGoal', careerGoalSchema);
