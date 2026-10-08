const express = require('express');
const router = express.Router();
const {
  getMyAdaptivePlan,
  refreshAdaptivePlan,
  markGuideCompleted,
  adminGetAllAdaptivePlans,
  getAdaptiveLearningRecommendations,
  completeLearning,
  submitAssessment,
} = require('../controllers/adaptiveLearningController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, getMyAdaptivePlan);
router.post('/refresh', protect, refreshAdaptivePlan);
router.put('/:guideId/complete', protect, markGuideCompleted);
router.get('/admin/all', protect, admin, adminGetAllAdaptivePlans);
router.get('/recommendations', protect, getAdaptiveLearningRecommendations);
router.put('/:guideId/complete-learning', protect, completeLearning);
router.post('/assessment', protect, submitAssessment);

module.exports = router;
