const mongoose = require('mongoose');

/**
 * PromoRedemption — tracks each successful use of a promo code per user.
 * Used to enforce per-user usage limits.
 */
const promoRedemptionSchema = new mongoose.Schema(
  {
    promoCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PromoCode',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    discountAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

promoRedemptionSchema.index({ promoCodeId: 1, userId: 1 });

module.exports = mongoose.model('PromoRedemption', promoRedemptionSchema);
