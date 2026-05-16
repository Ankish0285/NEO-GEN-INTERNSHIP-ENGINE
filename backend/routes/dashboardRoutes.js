const express = require('express');
const router = express.Router();
const { 
    getDashboardSummary, 
    getRecentActivity,
    getAdminDashboardSummary
} = require('../controllers/dashboardController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/summary', protect, getDashboardSummary);
router.get('/activity', protect, getRecentActivity);
router.get('/admin-summary', protect, admin, getAdminDashboardSummary);

module.exports = router;
