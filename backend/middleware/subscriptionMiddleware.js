/**
 * subscriptionMiddleware.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable middleware for subscription + resume-ownership enforcement.
 *
 * Exported functions:
 *
 *  checkResumeAccess(feature)
 *    → verifies the authenticated student may run an ATS/AI analysis:
 *       1. Auto-expire stale ACTIVE subscriptions.
 *       2. If student has an ACTIVE subscription with the requested feature → allow.
 *       3. Otherwise check free usage against the configurable freeLimit.
 *       4. Attach req.resumeAccess = { isSubscribed, freeUsed, freeLimit, usage }
 *          so controllers can increment after a successful analysis.
 *
 *  requireActiveSubscription(feature)
 *    → hard-block unless ACTIVE subscription with feature (no free tier).
 *
 * Features (string constants exported below):
 *   FEATURE_ATS           — ATS score analysis
 *   FEATURE_AI_ANALYSIS   — AI resume analysis / intelligence
 *   FEATURE_AI_REPORT     — full AI report
 *   FEATURE_RECOMMENDATIONS — premium AI recommendations
 */

const ResumeUsage    = require('../models/ResumeUsage');
const Subscription   = require('../models/Subscription');
const SubscriptionSettings = require('../utils/subscriptionSettings');

// ─── Feature constants ────────────────────────────────────────────────────────
const FEATURE_ATS             = 'atsAnalysis';
const FEATURE_AI_ANALYSIS     = 'aiResumeAnalysis';
const FEATURE_AI_REPORT       = 'aiReport';
const FEATURE_RECOMMENDATIONS = 'premiumRecommendations';

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Auto-expire any ACTIVE subscriptions whose expiresAt has passed.
 * Returns the first still-active subscription (or null).
 */
async function getActiveSubscription(userId) {
  const now = new Date();

  // Expire any subscriptions that have passed their end date
  await Subscription.updateMany(
    { userId, status: 'ACTIVE', expiresAt: { $lte: now } },
    { $set: { status: 'EXPIRED' } }
  );

  // Return the best active subscription (most recently started)
  return Subscription.findOne({
    userId,
    status: 'ACTIVE',
    expiresAt: { $gt: now },
  })
    .sort({ startedAt: -1 })
    .populate('planId', 'features name')
    .lean();
}

/**
 * Get-or-create a ResumeUsage record for the student.
 * Initialises freeLimit from the global setting the first time.
 */
async function getOrCreateUsage(userId) {
  const globalLimit = await SubscriptionSettings.getFreeLimit();

  let usage = await ResumeUsage.findOne({ userId });
  if (!usage) {
    usage = await ResumeUsage.create({
      userId,
      freeLimit: globalLimit,
      freeUsed:  0,
      premiumUsed: 0,
    });
  }
  return usage;
}

// ─── Main middleware factory ───────────────────────────────────────────────────

/**
 * checkResumeAccess(feature)
 *
 * Usage:
 *   router.post('/upload', protect, checkResumeAccess(FEATURE_ATS), uploadResume);
 *
 * On success: calls next() and attaches req.resumeAccess for the controller.
 * On failure: returns 403 with structured JSON the frontend can parse.
 */
const checkResumeAccess = (feature = FEATURE_ATS) => async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    // ── 1. Check active subscription ─────────────────────────────────────────
    const activeSub = await getActiveSubscription(userId);

    if (activeSub) {
      const planFeatures = activeSub.planId?.features || activeSub.planSnapshot?.features || {};
      const hasFeature   = planFeatures[feature] !== false; // default true if not explicitly false

      if (hasFeature) {
        // Subscribed + feature allowed
        const usage = await getOrCreateUsage(userId);
        req.resumeAccess = {
          isSubscribed: true,
          subscription: activeSub,
          freeUsed:  usage.freeUsed,
          freeLimit: usage.freeLimit,
          usage,
        };
        return next();
      }
      // Subscribed but feature not in this plan — fall through to free-tier check
    }

    // ── 2. Free tier check ────────────────────────────────────────────────────
    const usage = await getOrCreateUsage(userId);

    if (usage.freeUsed < usage.freeLimit) {
      // Free checks remaining
      req.resumeAccess = {
        isSubscribed: false,
        subscription: null,
        freeUsed:  usage.freeUsed,
        freeLimit: usage.freeLimit,
        usage,
      };
      return next();
    }

    // ── 3. No access ──────────────────────────────────────────────────────────
    return res.status(403).json({
      success: false,
      code: 'SUBSCRIPTION_REQUIRED',
      message:
        `You have used all ${usage.freeLimit} free resume analyses. ` +
        `Upgrade your plan to continue using ATS Score and AI Resume Features.`,
      freeUsed:  usage.freeUsed,
      freeLimit: usage.freeLimit,
      requiresSubscription: true,
    });

  } catch (err) {
    console.error('[subscriptionMiddleware] checkResumeAccess error:', err.message);
    // On unexpected error — deny access (security-first)
    return res.status(500).json({
      success: false,
      message: 'Access check failed. Please try again.',
    });
  }
};

// ─── Hard-require active subscription (no free tier) ─────────────────────────

/**
 * requireActiveSubscription(feature)
 * For future endpoints that are subscription-only with no free tier.
 */
const requireActiveSubscription = (feature = FEATURE_ATS) => async (req, res, next) => {
  try {
    const userId   = req.user._id || req.user.id;
    const activeSub = await getActiveSubscription(userId);

    if (!activeSub) {
      return res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'An active subscription is required to access this feature.',
        requiresSubscription: true,
      });
    }

    const planFeatures = activeSub.planId?.features || activeSub.planSnapshot?.features || {};
    if (planFeatures[feature] === false) {
      return res.status(403).json({
        success: false,
        code: 'FEATURE_NOT_IN_PLAN',
        message: 'Your current plan does not include this feature. Please upgrade.',
        requiresSubscription: true,
      });
    }

    req.resumeAccess = { isSubscribed: true, subscription: activeSub };
    return next();

  } catch (err) {
    console.error('[subscriptionMiddleware] requireActiveSubscription error:', err.message);
    return res.status(500).json({ success: false, message: 'Access check failed.' });
  }
};

// ─── Increment usage helper (called by controllers after successful analysis) ──

/**
 * incrementUsage(userId, isSubscribed)
 * Call this AFTER a successful analysis is saved to DB.
 * Never call before — prevents counting failed analyses.
 */
async function incrementUsage(userId, isSubscribed) {
  try {
    if (isSubscribed) {
      await ResumeUsage.findOneAndUpdate(
        { userId },
        { $inc: { premiumUsed: 1 }, lastAnalysisAt: new Date() },
        { upsert: true, new: true }
      );
    } else {
      await ResumeUsage.findOneAndUpdate(
        { userId },
        { $inc: { freeUsed: 1 }, lastAnalysisAt: new Date() },
        { upsert: true, new: true }
      );
    }
  } catch (err) {
    // Log but never fail the request — the analysis already succeeded
    console.error('[subscriptionMiddleware] incrementUsage error:', err.message);
  }
}

module.exports = {
  checkResumeAccess,
  requireActiveSubscription,
  incrementUsage,
  getActiveSubscription,
  getOrCreateUsage,
  FEATURE_ATS,
  FEATURE_AI_ANALYSIS,
  FEATURE_AI_REPORT,
  FEATURE_RECOMMENDATIONS,
};
