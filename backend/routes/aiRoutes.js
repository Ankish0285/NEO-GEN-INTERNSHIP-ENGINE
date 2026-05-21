const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
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

router.get('/status', getAIStatus);
router.get('/profile', protect, getAIProfile);
router.get('/intelligence', protect, getAIIntelligence);
router.post('/analyze', protect, analyzeResumeAI);
router.get('/recommendations', protect, getAIRecommendations);
router.post('/match/:internshipId', protect, matchSingleInternship);
router.post('/chat', protect, aiChat);
router.get('/admin/insights', protect, getAdminAIInsights);

module.exports = router;
