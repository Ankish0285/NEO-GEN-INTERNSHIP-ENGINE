const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  checkResumeAccess,
  FEATURE_AI_ANALYSIS,
  FEATURE_AI_REPORT,
  FEATURE_RECOMMENDATIONS,
  FEATURE_AI_CHAT,
  FEATURE_AI_MATCH,
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
  rankStudentsForInternship,
} = require('../controllers/aiController');

// ── Public / read-only ────────────────────────────────────────────────────────
router.get('/status', getAIStatus);

// ── Admin only (no usage gate — internal analytics) ───────────────────────────
router.get('/admin/insights', protect, getAdminAIInsights);
router.get('/admin/rank/:internshipId', protect, rankStudentsForInternship);

// ── Authenticated, no usage gate (profile read is always free) ───────────────
router.get('/profile', protect, getAIProfile);

// ── Premium AI analysis endpoints ────────────────────────────────────────────
router.get('/intelligence', protect, checkResumeAccess(FEATURE_AI_REPORT),    getAIIntelligence);
router.post('/analyze',     protect, checkResumeAccess(FEATURE_AI_ANALYSIS),  analyzeResumeAI);

// ── Recommendations ───────────────────────────────────────────────────────────
router.get('/recommendations', protect, checkResumeAccess(FEATURE_RECOMMENDATIONS), getAIRecommendations);

// ── AI Chat — gated (premium feature) ────────────────────────────────────────
router.post('/chat', protect, checkResumeAccess(FEATURE_AI_CHAT), aiChat);

// ── Single-internship semantic match — gated (premium feature) ───────────────
router.post('/match/:internshipId', protect, checkResumeAccess(FEATURE_AI_MATCH), matchSingleInternship);

module.exports = router;
