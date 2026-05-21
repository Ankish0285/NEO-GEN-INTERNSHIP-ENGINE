const express = require('express');
const router = express.Router();
const { 
    getDashboardSummary, 
    getRecentActivity,
    getAdminDashboardSummary,
    getPartnerDashboardSummary,
    getPublicStats,
} = require('../controllers/dashboardController');
const { protect, admin, partner } = require('../middleware/authMiddleware');

router.get('/public-stats', getPublicStats);
router.get('/summary', protect, getDashboardSummary);
router.get('/activity', protect, getRecentActivity);
router.get('/admin-summary', protect, admin, getAdminDashboardSummary);
router.get('/partner-summary', protect, partner, getPartnerDashboardSummary);

module.exports = router;
