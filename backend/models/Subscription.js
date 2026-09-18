const mongoose = require('mongoose');

/**
 * Subscription — one record per student per payment.
 * Payment gateway fields are nullable until a real gateway is connected.
 */
const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    // Snapshot of plan at purchase time (so plan edits don't corrupt history)
    planSnapshot: {
      name:         { type: String },
      price:        { type: Number },
      currency:     { type: String },
      durationDays: { type: Number },
      features:     { type: mongoose.Schema.Types.Mixed },
    },
    amount:   { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    // Promo code fields
    promoCodeId:    { type: mongoose.Schema.Types.ObjectId, ref: 'PromoCode', default: null },
    promoCodeStr:   { type: String, default: null },
    originalAmount: { type: Number, default: null },  // price before discount
    discountAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    // Payment gateway fields — nullable until gateway integrated
    paymentProvider: { type: String, default: null },   // 'razorpay' | 'stripe' | 'manual' etc.
    transactionId:   { type: String, default: null },
    paymentPayload:  { type: mongoose.Schema.Types.Mixed, default: null }, // raw gateway response
    startedAt:  { type: Date, default: null },
    expiresAt:  { type: Date, default: null, index: true },
    // Admin activation (used when no gateway — admin manually activates)
    activatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelledAt: { type: Date, default: null },
    notes:       { type: String, default: '' },
  },
  { timestamps: true }
);

// Compound index for fast "is this user subscribed?" lookup
subscriptionSchema.index({ userId: 1, status: 1, expiresAt: 1 });

/**
 * Instance helper — true if this subscription is currently active.
 * ALWAYS call this server-side; never trust frontend.
 */
subscriptionSchema.methods.isCurrentlyActive = function () {
  if (this.status !== 'ACTIVE') return false;
  if (!this.expiresAt) return false;
  return new Date() < new Date(this.expiresAt);
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
