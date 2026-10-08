const express = require('express');
const router = express.Router();
const {
  getCareerDashboard,
  getSkillGapAnalysis,
  getAdminCareerIntelligenceOverview,
  getSkillGapPriority,
  getWhatIfSimulation,
  getOpportunityUnlock,
  getWhyNotApply,
  getCounterfactualRecommendation,
  getExplainableRecommendation,
  rankApplicationsByValue,
} = require('../controllers/careerIntelligenceController');
const { protect, admin } = require('../middleware/authMiddleware');

// ─── Existing routes ───────────────────────────────────────────────────────────
router.get('/dashboard', protect, getCareerDashboard);
router.get('/skill-gap', protect, getSkillGapAnalysis);
router.get('/admin/overview', protect, admin, getAdminCareerIntelligenceOverview);

// ─── New routes (FEAT-002) ─────────────────────────────────────────────────────
router.get('/skill-gap-priority', protect, getSkillGapPriority);
router.post('/what-if', protect, getWhatIfSimulation);
router.get('/opportunity-unlock', protect, getOpportunityUnlock);
router.get('/why-not-apply/:internshipId', protect, getWhyNotApply);
router.post('/counterfactual', protect, getCounterfactualRecommendation);
router.get('/explain/:internshipId', protect, getExplainableRecommendation);
router.get('/opportunity-cost', protect, rankApplicationsByValue);

module.exports = router;
