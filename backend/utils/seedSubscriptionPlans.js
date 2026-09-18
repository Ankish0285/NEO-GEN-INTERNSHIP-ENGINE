/**
 * seedSubscriptionPlans.js
 * Ensures the two default plans exist on first boot.
 * Idempotent — safe to call every startup.
 */
const SubscriptionPlan = require('../models/SubscriptionPlan');

const DEFAULT_PLANS = [
  {
    name:         'Monthly Pro',
    description:  'Full access to ATS Score, AI Resume Analysis, AI Report and Premium Recommendations for 30 days.',
    price:        99,
    currency:     'INR',
    durationDays: 30,
    isActive:     true,
    displayOrder: 1,
    features: {
      atsAnalysis:            true,
      aiResumeAnalysis:       true,
      aiReport:               true,
      premiumRecommendations: true,
      maxAnalysesPerMonth:    0,   // unlimited
    },
  },
  {
    name:         'Yearly Pro',
    description:  'Best value — full premium access for 365 days at a heavily discounted rate.',
    price:        799,
    currency:     'INR',
    durationDays: 365,
    isActive:     true,
    displayOrder: 2,
    features: {
      atsAnalysis:            true,
      aiResumeAnalysis:       true,
      aiReport:               true,
      premiumRecommendations: true,
      maxAnalysesPerMonth:    0,
    },
  },
];

async function seedSubscriptionPlans() {
  try {
    for (const planData of DEFAULT_PLANS) {
      const exists = await SubscriptionPlan.findOne({ name: planData.name });
      if (!exists) {
        await SubscriptionPlan.create(planData);
        console.log(`[Seed] Created default plan: ${planData.name}`);
      }
    }
  } catch (err) {
    console.warn('[Seed] seedSubscriptionPlans error (non-fatal):', err.message);
  }
}

module.exports = seedSubscriptionPlans;
