const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getPlans,
  getMySubscription,
  createOrder,
  createSubscription,
  verifyPayment,
  validatePromoCodeEndpoint,
  handleWebhook,
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
} = require('../controllers/subscriptionController');

// ── Student routes ────────────────────────────────────────────────────────────
router.get('/plans',              getPlans);                                  // public
router.get('/me',                 protect, getMySubscription);
router.post('/create-order',      protect, createOrder);                      // Razorpay order
router.post('/create',            protect, createOrder);                      // alias (backward compat)
router.post('/verify-payment',    protect, verifyPayment);                    // signature verification
router.post('/promo/validate',    protect, validatePromoCodeEndpoint);

// ── Webhook — raw body required for HMAC verification ─────────────────────────
// Must be registered BEFORE any JSON body-parser; raw body captured in server.js
router.post('/webhook', handleWebhook);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/admin/plans',                   protect, admin, adminGetPlans);
router.post('/admin/plans',                  protect, admin, adminCreatePlan);
router.put('/admin/plans/:id',               protect, admin, adminUpdatePlan);
router.delete('/admin/plans/:id',            protect, admin, adminDeletePlan);

router.get('/admin/subscriptions',           protect, admin, adminGetSubscriptions);
router.put('/admin/subscriptions/:id/activate', protect, admin, adminActivateSubscription);
router.put('/admin/subscriptions/:id/cancel',   protect, admin, adminCancelSubscription);

router.get('/admin/payments',    protect, admin, adminGetPayments);
router.get('/admin/analytics',   protect, admin, adminGetAnalytics);
router.get('/admin/settings',    protect, admin, adminGetSettings);
router.put('/admin/settings',    protect, admin, adminUpdateSettings);

router.get('/admin/promos',          protect, admin, adminGetPromos);
router.post('/admin/promos',         protect, admin, adminCreatePromo);
router.put('/admin/promos/:id',      protect, admin, adminUpdatePromo);
router.delete('/admin/promos/:id',   protect, admin, adminDeletePromo);

module.exports = router;
