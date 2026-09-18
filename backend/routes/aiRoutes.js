const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  checkResumeAccess,
  FEATURE_AI_ANALYSIS,
  FEATURE_AI_REPORT,
  FEATURE_RECOMMENDATIONS,
} = require('../middleware/subscriptionMiddleware');
const {
  getAIStatus,
  getAIProfile,
  getAIIntelligence,
  analyzeResumeAI,
  getAIRecommendations,
  matchSingleInternship,
  aiChat,
  getAdminAIInsights,
} = require('../controllers/aiController');

// ── Public / read-only ────────────────────────────────────────────────────────
router.get('/status', getAIStatus);

// ── Authenticated, no usage gate ─────────────────────────────────────────────
router.get('/profile',              protect, getAIProfile);
router.post('/match/:internshipId', protect, matchSingleInternship);
router.post('/chat',                protect, aiChat);
router.get('/admin/insights',       protect, getAdminAIInsights);

// ── Recommendations: gated (uses same ATS feature flag) ──────────────────────
router.get('/recommendations', protect, checkResumeAccess(FEATURE_RECOMMENDATIONS), getAIRecommendations);

// ── Premium AI analysis endpoints ────────────────────────────────────────────
router.get('/intelligence', protect, checkResumeAccess(FEATURE_AI_REPORT),    getAIIntelligence);
router.post('/analyze',     protect, checkResumeAccess(FEATURE_AI_ANALYSIS),  analyzeResumeAI);

module.exports = router;
