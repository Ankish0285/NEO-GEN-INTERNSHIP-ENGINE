const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getStudentMetrics } = require('../controllers/metricsController');

router.get('/student', protect, getStudentMetrics);

module.exports = router;
