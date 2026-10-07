const express = require('express');
const router = express.Router();
const {
  getCareerDashboard,
  getSkillGapAnalysis,
  getAdminCareerIntelligenceOverview,
} = require('../controllers/careerIntelligenceController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getCareerDashboard);
router.get('/skill-gap', protect, getSkillGapAnalysis);
router.get('/admin/overview', protect, admin, getAdminCareerIntelligenceOverview);

module.exports = router;
