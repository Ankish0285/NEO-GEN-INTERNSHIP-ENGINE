const express = require('express');
const router = express.Router();
const {
  getMyAdaptivePlan,
  refreshAdaptivePlan,
  markGuideCompleted,
  adminGetAllAdaptivePlans,
  getAdaptiveLearningRecommendations,
} = require('../controllers/adaptiveLearningController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, getMyAdaptivePlan);
router.post('/refresh', protect, refreshAdaptivePlan);
router.put('/:guideId/complete', protect, markGuideCompleted);
router.get('/admin/all', protect, admin, adminGetAllAdaptivePlans);
router.get('/recommendations', protect, getAdaptiveLearningRecommendations);

module.exports = router;
