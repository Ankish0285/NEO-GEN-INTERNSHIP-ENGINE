const mongoose = require('mongoose');

/**
 * PromoCode — discount codes for subscription purchases.
 *
 * discountType: 'percent'  → discountValue % off  (e.g. 20 → 20% off)
 *               'flat'     → ₹discountValue off    (e.g. 50 → ₹50 off)
 *
 * usageLimit: 0 means unlimited.
 * usedCount:  incremented atomically on each successful use.
 * applicablePlanIds: empty array = valid for ALL plans.
 */
const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type:     String,
      required: true,
      unique:   true,
      uppercase: true,
      trim:     true,
      index:    true,
    },
    description: { type: String, default: '' },
    discountType: {
      type: String,
      enum: ['percent', 'flat'],
      required: true,
    },
    discountValue: {
      type:    Number,
      required: true,
      min:     0,
    },
    // Optional: restrict to specific plans. Empty = all plans.
    applicablePlanIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' }],
    isActive:   { type: Boolean, default: true },
    usageLimit:    { type: Number, default: 0 },   // 0 = unlimited (global)
    perUserLimit:  { type: Number, default: 0 },   // 0 = unlimited per user
    usedCount:     { type: Number, default: 0 },
    minOrderAmount: { type: Number, default: 0 },   // minimum plan price to apply
    maxDiscountAmount: { type: Number, default: 0 }, // 0 = no cap (for percent discounts)
    expiresAt:  { type: Date, default: null },
    activatesAt: { type: Date, default: null },     // null = active immediately
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PromoCode', promoCodeSchema);
