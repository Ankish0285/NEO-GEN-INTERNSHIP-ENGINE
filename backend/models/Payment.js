const mongoose = require('mongoose');

/**
 * Payment — one record per payment attempt.
 * Stores the Razorpay order and payment details.
 * Never stores card/CVV/sensitive payment credentials.
 */
const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
    },
    // Razorpay fields
    razorpayOrderId:   { type: String, index: true },  // order_id from Razorpay
    razorpayPaymentId: { type: String, index: true },  // payment_id after success
    razorpaySignature: { type: String },                // for verification

    amount:         { type: Number, required: true },   // final payable (after discount)
    originalAmount: { type: Number, default: null },
    discountAmount: { type: Number, default: 0 },
    currency:       { type: String, default: 'INR' },

    promoCodeStr:   { type: String, default: null },
    promoCodeId:    { type: mongoose.Schema.Types.ObjectId, ref: 'PromoCode', default: null },

    gateway: { type: String, default: 'razorpay' },

    status: {
      type: String,
      enum: ['CREATED', 'SUCCESS', 'FAILED', 'CANCELLED'],
      default: 'CREATED',
      index: true,
    },

    // Raw gateway response stored for audit — never expose to frontend
    gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: null },

    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Prevent duplicate payment records for same Razorpay order (idempotency)
paymentSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Payment', paymentSchema);
