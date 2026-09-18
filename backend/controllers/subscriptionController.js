/**
 * subscriptionController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles all subscription + plan management.
 *
 * Student endpoints:
 *   GET  /api/subscriptions/plans           — list active plans
 *   GET  /api/subscriptions/me              — my current subscription + usage
 *   POST /api/subscriptions/create          — initiate a subscription (PENDING)
 *   POST /api/subscriptions/verify          — verify payment & activate (gateway hook)
 *   POST /api/subscriptions/promo/validate  — validate promo code before payment
 *
 * Admin endpoints (super_admin only):
 *   GET    /api/subscriptions/admin/plans               — all plans
 *   POST   /api/subscriptions/admin/plans               — create plan
 *   PUT    /api/subscriptions/admin/plans/:id           — update plan
 *   DELETE /api/subscriptions/admin/plans/:id           — delete plan
 *   GET    /api/subscriptions/admin/subscriptions       — all subscriptions
 *   PUT    /api/subscriptions/admin/subscriptions/:id/activate  — manually activate
 *   PUT    /api/subscriptions/admin/subscriptions/:id/cancel    — cancel
 *   GET    /api/subscriptions/admin/analytics           — usage analytics
 *   GET    /api/subscriptions/admin/settings            — get subscription settings
 *   PUT    /api/subscriptions/admin/settings            — update settings
 *   GET    /api/subscriptions/admin/promos              — list all promo codes
 *   POST   /api/subscriptions/admin/promos              — create promo code
 *   PUT    /api/subscriptions/admin/promos/:id          — update promo code
 *   DELETE /api/subscriptions/admin/promos/:id          — delete promo code
 */

const asyncHandler   = require('express-async-handler');
const SubscriptionPlan  = require('../models/SubscriptionPlan');
const Subscription      = require('../models/Subscription');
const ResumeUsage       = require('../models/ResumeUsage');
const PromoCode         = require('../models/PromoCode');
const PromoRedemption   = require('../models/PromoRedemption');
const Payment           = require('../models/Payment');
const User              = require('../models/User');
const subscriptionSettings = require('../utils/subscriptionSettings');
const { getActiveSubscription, getOrCreateUsage } = require('../middleware/subscriptionMiddleware');
const razorpayUtil      = require('../utils/razorpay');

// ─── Shared promo helper ──────────────────────────────────────────────────────
/**
 * Validate a promo code for a given plan and return the discounted amount.
 * userId is required to check per-user usage limits.
 * Returns { promo, discountedAmount, discountAmount, discountLabel } or throws.
 */
async function applyPromoCode(codeStr, plan, userId) {
  if (!codeStr) return null;

  const now   = new Date();
  const promo = await PromoCode.findOne({ code: codeStr.toUpperCase().trim(), isActive: true });

  if (!promo)
    throw Object.assign(new Error('Promo code not found or inactive.'), { statusCode: 404 });
  if (promo.expiresAt && now > promo.expiresAt)
    throw Object.assign(new Error('Promo code has expired.'), { statusCode: 400 });
  if (promo.activatesAt && now < promo.activatesAt)
    throw Object.assign(new Error('Promo code is not yet active.'), { statusCode: 400 });
  if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit)
    throw Object.assign(new Error('Promo code usage limit has been reached.'), { statusCode: 400 });
  if (promo.minOrderAmount > 0 && plan.price < promo.minOrderAmount)
    throw Object.assign(new Error(`Minimum order amount of ₹${promo.minOrderAmount} required.`), { statusCode: 400 });
  if (promo.applicablePlanIds?.length > 0) {
    const applicable = promo.applicablePlanIds.map((id) => id.toString());
    if (!applicable.includes(plan._id.toString()))
      throw Object.assign(new Error('This promo code is not valid for the selected plan.'), { statusCode: 400 });
  }
  // Per-user limit check
  if (promo.perUserLimit > 0 && userId) {
    const userUses = await PromoRedemption.countDocuments({ promoCodeId: promo._id, userId });
    if (userUses >= promo.perUserLimit)
      throw Object.assign(new Error('You have already used this promo code the maximum number of times.'), { statusCode: 400 });
  }

  let discountAmount;
  let discountLabel;
  if (promo.discountType === 'percent') {
    discountAmount = Math.round((plan.price * promo.discountValue) / 100);
    // Apply max discount cap if set
    if (promo.maxDiscountAmount > 0) discountAmount = Math.min(discountAmount, promo.maxDiscountAmount);
    discountLabel  = `${promo.discountValue}% off`;
  } else {
    discountAmount = Math.min(promo.discountValue, plan.price);
    discountLabel  = `₹${promo.discountValue} off`;
  }

  const discountedAmount = Math.max(0, plan.price - discountAmount);
  return { promo, discountedAmount, discountAmount, discountLabel };
}

// ═══════════════════════════════════════════════════════════════════
// STUDENT — Public plan listing
// ═══════════════════════════════════════════════════════════════════

// GET /api/subscriptions/plans
const getPlans = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find({ isActive: true })
    .sort({ displayOrder: 1, price: 1 })
    .select('-__v');
  res.json({ success: true, plans });
});

// ═══════════════════════════════════════════════════════════════════
// STUDENT — My subscription + usage
// ═══════════════════════════════════════════════════════════════════

// GET /api/subscriptions/me
const getMySubscription = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const [activeSub, usage, settings] = await Promise.all([
    getActiveSubscription(userId),
    getOrCreateUsage(userId),
    subscriptionSettings.getSettings(),
  ]);

  res.json({
    success: true,
    usage: {
      freeUsed:    usage.freeUsed,
      freeLimit:   usage.freeLimit,
      premiumUsed: usage.premiumUsed,
      lastAnalysisAt: usage.lastAnalysisAt,
    },
    isSubscribed: !!activeSub,
    subscription: activeSub
      ? {
          _id:       activeSub._id,
          planName:  activeSub.planSnapshot?.name || activeSub.planId?.name,
          status:    activeSub.status,
          startedAt: activeSub.startedAt,
          expiresAt: activeSub.expiresAt,
          features:  activeSub.planId?.features || activeSub.planSnapshot?.features || {},
        }
      : null,
    settings: {
      freeResumeLimit:         settings.freeResumeLimit,
      atsRequiresSubscription: settings.atsRequiresSubscription,
      aiRequiresSubscription:  settings.aiRequiresSubscription,
    },
  });
});

// ═══════════════════════════════════════════════════════════════════
// STUDENT — Initiate subscription (creates PENDING record)
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// STUDENT — Create Razorpay order  (replaces old createSubscription)
// ═══════════════════════════════════════════════════════════════════

// POST /api/subscriptions/create-order
const createOrder = asyncHandler(async (req, res) => {
  const userId = (req.user._id || req.user.id).toString();
  const { planId, promoCode } = req.body;

  if (!planId) { res.status(400); throw new Error('planId is required'); }

  const plan = await SubscriptionPlan.findOne({ _id: planId, isActive: true });
  if (!plan) { res.status(404); throw new Error('Plan not found or inactive'); }

  // Validate promo (if provided)
  let finalAmount    = plan.price;
  let promoResult    = null;
  let appliedPromoId = null;

  if (promoCode) {
    try {
      promoResult    = await applyPromoCode(promoCode, plan, userId);
      finalAmount    = promoResult.discountedAmount;
      appliedPromoId = promoResult.promo._id;
    } catch (err) {
      res.status(err.statusCode || 400);
      throw err;
    }
  }

  // Create PENDING Subscription record first
  const sub = await Subscription.create({
    userId,
    planId: plan._id,
    planSnapshot: {
      name: plan.name, price: plan.price,
      currency: plan.currency, durationDays: plan.durationDays, features: plan.features,
    },
    amount:         finalAmount,
    originalAmount: plan.price,
    currency:       plan.currency,
    promoCodeId:    appliedPromoId,
    promoCodeStr:   promoCode ? promoCode.toUpperCase().trim() : undefined,
    discountAmount: promoResult ? promoResult.discountAmount : 0,
    status:         'PENDING',
  });

  // Create Razorpay order
  let rzOrder;
  try {
    rzOrder = await razorpayUtil.createOrder({
      amountInPaise: Math.round(finalAmount * 100),  // Razorpay takes paise
      currency:      plan.currency || 'INR',
      receipt:       `sub_${sub._id}`,
      notes: {
        subscriptionId: sub._id.toString(),
        planName:       plan.name,
        userId,
      },
    });
  } catch (err) {
    // If Razorpay is not configured, return a helpful error
    res.status(503);
    throw new Error(`Payment gateway error: ${err.message}`);
  }

  // Create Payment record
  await Payment.create({
    userId,
    subscriptionId:  sub._id,
    planId:          plan._id,
    razorpayOrderId: rzOrder.id,
    amount:          finalAmount,
    originalAmount:  plan.price,
    discountAmount:  promoResult?.discountAmount || 0,
    currency:        plan.currency || 'INR',
    promoCodeStr:    promoCode ? promoCode.toUpperCase().trim() : null,
    promoCodeId:     appliedPromoId,
    status:          'CREATED',
    gatewayResponse: rzOrder,
  });

  res.status(201).json({
    success:         true,
    subscriptionId:  sub._id,
    orderId:         rzOrder.id,       // returned to frontend for checkout
    keyId:           process.env.RAZORPAY_KEY_ID,
    amount:          finalAmount,
    amountInPaise:   Math.round(finalAmount * 100),
    originalAmount:  plan.price,
    discountAmount:  promoResult?.discountAmount || 0,
    discountLabel:   promoResult?.discountLabel  || null,
    currency:        plan.currency || 'INR',
    planName:        plan.name,
    promoApplied:    !!promoResult,
  });
});

// ═══════════════════════════════════════════════════════════════════
// STUDENT — Verify payment & activate subscription
// ═══════════════════════════════════════════════════════════════════

// POST /api/subscriptions/verify-payment
const verifyPayment = asyncHandler(async (req, res) => {
  const userId = (req.user._id || req.user.id).toString();
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    subscriptionId,
  } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !subscriptionId) {
    res.status(400);
    throw new Error('razorpayOrderId, razorpayPaymentId, razorpaySignature and subscriptionId are required');
  }

  // Verify signature FIRST — never trust client-reported success
  const isValid = razorpayUtil.verifySignature({
    orderId:   razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!isValid) {
    // Mark payment as failed
    await Payment.findOneAndUpdate(
      { razorpayOrderId, userId },
      { status: 'FAILED', razorpayPaymentId, razorpaySignature }
    );
    res.status(400);
    throw new Error('Payment signature verification failed. Payment not activated.');
  }

  // Find payment record — must belong to this user
  const payment = await Payment.findOne({ razorpayOrderId, userId });
  if (!payment) { res.status(404); throw new Error('Payment record not found'); }

  // Find subscription — must belong to this user
  const sub = await Subscription.findOne({ _id: subscriptionId, userId, status: 'PENDING' })
    .populate('planId', 'durationDays name');
  if (!sub) {
    res.status(404);
    throw new Error('Pending subscription not found. It may have already been activated.');
  }

  // Activate subscription
  const now          = new Date();
  const durationDays = sub.planId?.durationDays || sub.planSnapshot?.durationDays || 30;
  const expiresAt    = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  sub.status          = 'ACTIVE';
  sub.paymentProvider = 'razorpay';
  sub.transactionId   = razorpayPaymentId;
  sub.paymentPayload  = { razorpayOrderId, razorpayPaymentId, razorpaySignature };
  sub.startedAt       = now;
  sub.expiresAt       = expiresAt;
  await sub.save();

  // Mark payment as successful
  payment.status            = 'SUCCESS';
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  await payment.save();

  // Record promo redemption if applicable
  if (sub.promoCodeId) {
    await PromoCode.findByIdAndUpdate(sub.promoCodeId, { $inc: { usedCount: 1 } });
    await PromoRedemption.create({
      promoCodeId:    sub.promoCodeId,
      userId,
      subscriptionId: sub._id,
      paymentId:      payment._id,
      discountAmount: sub.discountAmount || 0,
    });
  }

  res.json({
    success:  true,
    message:  'Payment verified. Subscription activated.',
    subscription: {
      _id:       sub._id,
      planName:  sub.planId?.name || sub.planSnapshot?.name,
      status:    sub.status,
      startedAt: sub.startedAt,
      expiresAt: sub.expiresAt,
    },
  });
});

// ═══════════════════════════════════════════════════════════════════
// WEBHOOK — Razorpay payment events (server-to-server)
// ═══════════════════════════════════════════════════════════════════

// POST /api/subscriptions/webhook
const handleWebhook = async (req, res) => {
  try {
    const sig  = req.headers['x-razorpay-signature'];
    const body = req.rawBody || JSON.stringify(req.body); // need raw body for HMAC

    if (!razorpayUtil.verifyWebhookSignature(body, sig)) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body;
    const eventType = event.event;

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const payment = event.payload?.payment?.entity || event.payload?.order?.entity;
      const orderId = payment?.order_id || event.payload?.order?.entity?.id;

      if (orderId) {
        // Idempotent: only process if not already SUCCESS
        const paymentRecord = await Payment.findOne({ razorpayOrderId: orderId });
        if (paymentRecord && paymentRecord.status !== 'SUCCESS') {
          paymentRecord.status            = 'SUCCESS';
          paymentRecord.razorpayPaymentId = payment?.id;
          paymentRecord.gatewayResponse   = event.payload;
          await paymentRecord.save();

          const sub = await Subscription.findOne({
            _id: paymentRecord.subscriptionId,
            status: 'PENDING',
          }).populate('planId', 'durationDays');

          if (sub) {
            const now          = new Date();
            const durationDays = sub.planId?.durationDays || sub.planSnapshot?.durationDays || 30;
            sub.status          = 'ACTIVE';
            sub.paymentProvider = 'razorpay';
            sub.transactionId   = payment?.id;
            sub.startedAt       = now;
            sub.expiresAt       = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
            await sub.save();

            if (sub.promoCodeId) {
              await PromoCode.findByIdAndUpdate(sub.promoCodeId, { $inc: { usedCount: 1 } });
              const alreadyRedeemed = await PromoRedemption.findOne({
                promoCodeId: sub.promoCodeId, subscriptionId: sub._id,
              });
              if (!alreadyRedeemed) {
                await PromoRedemption.create({
                  promoCodeId: sub.promoCodeId,
                  userId:      sub.userId,
                  subscriptionId: sub._id,
                  paymentId:   paymentRecord._id,
                  discountAmount: sub.discountAmount || 0,
                });
              }
            }
          }
        }
      }
    }

    if (eventType === 'payment.failed') {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id) {
        await Payment.findOneAndUpdate(
          { razorpayOrderId: payment.order_id, status: 'CREATED' },
          { status: 'FAILED', gatewayResponse: event.payload }
        );
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Webhook] Error:', err.message);
    return res.status(500).json({ success: false });
  }
};

// Keep backward compat alias
const createSubscription = createOrder;
const verifySubscription = verifyPayment;

// ═══════════════════════════════════════════════════════════════════
// ADMIN — Plan CRUD
// ═══════════════════════════════════════════════════════════════════

// GET /api/subscriptions/admin/plans
const adminGetPlans = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find().sort({ displayOrder: 1, createdAt: -1 });
  res.json({ success: true, plans });
});

// POST /api/subscriptions/admin/plans
const adminCreatePlan = asyncHandler(async (req, res) => {
  const {
    name, description, price, currency, durationDays,
    isActive, features, displayOrder,
  } = req.body;

  if (!name || price == null || !durationDays) {
    res.status(400);
    throw new Error('name, price, and durationDays are required');
  }

  const plan = await SubscriptionPlan.create({
    name, description, price, currency, durationDays,
    isActive: isActive !== false,
    features: features || {},
    displayOrder: displayOrder || 0,
  });

  res.status(201).json({ success: true, plan });
});

// PUT /api/subscriptions/admin/plans/:id
const adminUpdatePlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findById(req.params.id);
  if (!plan) { res.status(404); throw new Error('Plan not found'); }

  const allowed = [
    'name','description','price','currency','durationDays',
    'isActive','features','displayOrder',
  ];
  allowed.forEach((k) => { if (req.body[k] !== undefined) plan[k] = req.body[k]; });
  await plan.save();

  res.json({ success: true, plan });
});

// DELETE /api/subscriptions/admin/plans/:id
const adminDeletePlan = asyncHandler(async (req, res) => {
  const activeCount = await Subscription.countDocuments({
    planId: req.params.id,
    status: 'ACTIVE',
  });
  if (activeCount > 0) {
    res.status(400);
    throw new Error(`Cannot delete: ${activeCount} active subscription(s) use this plan. Deactivate it instead.`);
  }
  await SubscriptionPlan.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Plan deleted' });
});

// ═══════════════════════════════════════════════════════════════════
// ADMIN — Subscription management
// ═══════════════════════════════════════════════════════════════════

// GET /api/subscriptions/admin/subscriptions
const adminGetSubscriptions = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const query = status ? { status } : {};
  const skip  = (parseInt(page) - 1) * parseInt(limit);

  const [subs, total] = await Promise.all([
    Subscription.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .populate('planId', 'name price currency')
      .lean(),
    Subscription.countDocuments(query),
  ]);

  // Attach usage data
  const userIds   = subs.map((s) => s.userId?._id || s.userId);
  const usageList = await ResumeUsage.find({ userId: { $in: userIds } }).lean();
  const usageMap  = {};
  usageList.forEach((u) => { usageMap[u.userId.toString()] = u; });

  const enriched = subs.map((s) => {
    const uid   = (s.userId?._id || s.userId)?.toString();
    const usage = usageMap[uid] || { freeUsed: 0, freeLimit: 2, premiumUsed: 0 };
    return { ...s, usage };
  });

  res.json({ success: true, total, page: parseInt(page), subscriptions: enriched });
});

// PUT /api/subscriptions/admin/subscriptions/:id/activate  (manual activation)
const adminActivateSubscription = asyncHandler(async (req, res) => {
  const sub = await Subscription.findById(req.params.id).populate('planId', 'durationDays name');
  if (!sub) { res.status(404); throw new Error('Subscription not found'); }

  if (sub.status === 'ACTIVE') {
    res.status(400);
    throw new Error('Subscription is already active');
  }

  const now = new Date();
  const durationDays = sub.planId?.durationDays || sub.planSnapshot?.durationDays || 30;
  sub.status     = 'ACTIVE';
  sub.startedAt  = now;
  sub.expiresAt  = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
  sub.activatedBy = req.user._id || req.user.id;
  sub.notes      = req.body.notes || 'Manually activated by admin';
  await sub.save();

  res.json({ success: true, message: 'Subscription activated', subscription: sub });
});

// PUT /api/subscriptions/admin/subscriptions/:id/cancel
const adminCancelSubscription = asyncHandler(async (req, res) => {
  const sub = await Subscription.findById(req.params.id);
  if (!sub) { res.status(404); throw new Error('Subscription not found'); }

  sub.status      = 'CANCELLED';
  sub.cancelledAt = new Date();
  sub.notes       = req.body.reason || 'Cancelled by admin';
  await sub.save();

  res.json({ success: true, message: 'Subscription cancelled', subscription: sub });
});

// ═══════════════════════════════════════════════════════════════════
// ADMIN — Analytics
// ═══════════════════════════════════════════════════════════════════

// GET /api/subscriptions/admin/analytics
const adminGetAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();

  const [
    totalStudents,
    activeCount,
    expiredCount,
    cancelledCount,
    pendingCount,
    usageAgg,
    planBreakdown,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Subscription.countDocuments({ status: 'ACTIVE', expiresAt: { $gt: now } }),
    Subscription.countDocuments({ status: 'EXPIRED' }),
    Subscription.countDocuments({ status: 'CANCELLED' }),
    Subscription.countDocuments({ status: 'PENDING' }),
    ResumeUsage.aggregate([
      { $group: {
        _id: null,
        totalFreeUsed:    { $sum: '$freeUsed' },
        totalPremiumUsed: { $sum: '$premiumUsed' },
        studentsWithUsage: { $sum: 1 },
      }},
    ]),
    Subscription.aggregate([
      { $match: { status: 'ACTIVE', expiresAt: { $gt: now } } },
      { $group: { _id: '$planId', count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
      { $lookup: { from: 'subscriptionplans', localField: '_id', foreignField: '_id', as: 'plan' } },
      { $unwind: { path: '$plan', preserveNullAndEmpty: true } },
      { $project: { planName: '$plan.name', count: 1, revenue: 1 } },
    ]),
  ]);

  const usage = usageAgg[0] || { totalFreeUsed: 0, totalPremiumUsed: 0, studentsWithUsage: 0 };

  res.json({
    success: true,
    analytics: {
      totalStudents,
      subscriptions: { active: activeCount, expired: expiredCount, cancelled: cancelledCount, pending: pendingCount },
      usage: {
        totalFreeChecks:    usage.totalFreeUsed,
        totalPremiumChecks: usage.totalPremiumUsed,
        studentsWithUsage:  usage.studentsWithUsage,
      },
      planBreakdown,
    },
  });
});

// ═══════════════════════════════════════════════════════════════════
// ADMIN — Settings
// ═══════════════════════════════════════════════════════════════════

// GET /api/subscriptions/admin/settings
const adminGetSettings = asyncHandler(async (req, res) => {
  const settings = await subscriptionSettings.getSettings();
  res.json({ success: true, settings });
});

// PUT /api/subscriptions/admin/settings
const adminUpdateSettings = asyncHandler(async (req, res) => {
  const { freeResumeLimit, atsRequiresSubscription, aiRequiresSubscription } = req.body;
  const update = {};

  if (freeResumeLimit != null) {
    const n = parseInt(freeResumeLimit, 10);
    if (isNaN(n) || n < 0) { res.status(400); throw new Error('freeResumeLimit must be a non-negative integer'); }
    update.freeResumeLimit = n;
  }
  if (atsRequiresSubscription != null) update.atsRequiresSubscription = !!atsRequiresSubscription;
  if (aiRequiresSubscription  != null) update.aiRequiresSubscription  = !!aiRequiresSubscription;

  const settings = await subscriptionSettings.updateSettings(update);
  res.json({ success: true, settings });
});

// ═══════════════════════════════════════════════════════════════════
// STUDENT — Validate promo code (no side effects, safe to call)
// ═══════════════════════════════════════════════════════════════════

// POST /api/subscriptions/promo/validate
const validatePromoCodeEndpoint = asyncHandler(async (req, res) => {
  const { code, planId } = req.body;
  if (!code || !planId) { res.status(400); throw new Error('code and planId are required'); }

  const plan = await SubscriptionPlan.findOne({ _id: planId, isActive: true });
  if (!plan) { res.status(404); throw new Error('Plan not found'); }

  const userId = (req.user?._id || req.user?.id)?.toString() || null;

  try {
    const result = await applyPromoCode(code, plan, userId);
    res.json({
      success:          true,
      valid:            true,
      discountedAmount: result.discountedAmount,
      discountAmount:   result.discountAmount,
      discountLabel:    result.discountLabel,
      originalAmount:   plan.price,
      currency:         plan.currency,
    });
  } catch (err) {
    res.json({ success: true, valid: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// ADMIN — Payments list
// ═══════════════════════════════════════════════════════════════════

// GET /api/subscriptions/admin/payments
const adminGetPayments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const query = status ? { status } : {};
  const skip  = (parseInt(page) - 1) * parseInt(limit);

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .populate('planId', 'name')
      .lean(),
    Payment.countDocuments(query),
  ]);

  res.json({ success: true, total, page: parseInt(page), payments });
});

// GET /api/subscriptions/admin/promos
const adminGetPromos = asyncHandler(async (req, res) => {
  const promos = await PromoCode.find()
    .sort({ createdAt: -1 })
    .populate('applicablePlanIds', 'name')
    .lean();
  res.json({ success: true, promos });
});

// POST /api/subscriptions/admin/promos
const adminCreatePromo = asyncHandler(async (req, res) => {
  const {
    code, description, discountType, discountValue,
    applicablePlanIds, isActive, usageLimit, expiresAt,
  } = req.body;

  if (!code || !discountType || discountValue == null) {
    res.status(400);
    throw new Error('code, discountType, and discountValue are required');
  }
  if (!['percent', 'flat'].includes(discountType)) {
    res.status(400);
    throw new Error('discountType must be "percent" or "flat"');
  }
  if (discountType === 'percent' && (discountValue < 0 || discountValue > 100)) {
    res.status(400);
    throw new Error('Percentage discount must be between 0 and 100');
  }

  const existing = await PromoCode.findOne({ code: code.toUpperCase().trim() });
  if (existing) { res.status(400); throw new Error('A promo code with this code already exists'); }

  const promo = await PromoCode.create({
    code,
    description,
    discountType,
    discountValue,
    applicablePlanIds: applicablePlanIds || [],
    isActive: isActive !== false,
    usageLimit: usageLimit || 0,
    expiresAt:  expiresAt  || null,
    createdBy:  req.user._id || req.user.id,
  });

  res.status(201).json({ success: true, promo });
});

// PUT /api/subscriptions/admin/promos/:id
const adminUpdatePromo = asyncHandler(async (req, res) => {
  const promo = await PromoCode.findById(req.params.id);
  if (!promo) { res.status(404); throw new Error('Promo code not found'); }

  const allowed = [
    'description','discountType','discountValue',
    'applicablePlanIds','isActive','usageLimit','expiresAt',
  ];
  allowed.forEach((k) => { if (req.body[k] !== undefined) promo[k] = req.body[k]; });
  // Allow updating the code itself (admin may want to rename)
  if (req.body.code) promo.code = req.body.code.toUpperCase().trim();
  await promo.save();

  res.json({ success: true, promo });
});

// DELETE /api/subscriptions/admin/promos/:id
const adminDeletePromo = asyncHandler(async (req, res) => {
  await PromoCode.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Promo code deleted' });
});

module.exports = {
  // Student
  getPlans,
  getMySubscription,
  createOrder,
  createSubscription,   // alias for backward compat
  verifyPayment,
  verifySubscription,   // alias for backward compat
  validatePromoCodeEndpoint,
  handleWebhook,
  // Admin
  adminGetPlans,
  adminCreatePlan,
  adminUpdatePlan,
  adminDeletePlan,
  adminGetSubscriptions,
  adminActivateSubscription,
  adminCancelSubscription,
  adminGetPayments,
  adminGetAnalytics,
  adminGetSettings,
  adminUpdateSettings,
  adminGetPromos,
  adminCreatePromo,
  adminUpdatePromo,
  adminDeletePromo,
};
