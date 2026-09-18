const mongoose = require('mongoose');

/**
 * SubscriptionPlan — configurable by Super Admin.
 * All values editable at runtime; nothing is hardcoded in app logic.
 */
const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    durationDays: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true },
    // Feature flags — admin can toggle per plan
    features: {
      atsAnalysis:             { type: Boolean, default: true },
      aiResumeAnalysis:        { type: Boolean, default: true },
      aiReport:                { type: Boolean, default: true },
      premiumRecommendations:  { type: Boolean, default: true },
      maxAnalysesPerMonth:     { type: Number,  default: 0 },  // 0 = unlimited
    },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

subscriptionPlanSchema.index({ isActive: 1 });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
