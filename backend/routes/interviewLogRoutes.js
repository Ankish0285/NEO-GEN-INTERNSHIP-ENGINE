const express = require('express');
const router = express.Router();
const {
  getMyInterviewLogs,
  createInterviewLog,
  updateInterviewLog,
  deleteInterviewLog,
  getAdminInterviewLogs,
  getRejectionPatterns,
  getInterviewLearning,
} = require('../controllers/interviewLogController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getMyInterviewLogs)
  .post(protect, createInterviewLog);

router.get('/admin/all', protect, admin, getAdminInterviewLogs);
router.get('/rejection-patterns', protect, getRejectionPatterns);
router.get('/interview-learning', protect, getInterviewLearning);

router.route('/:id')
  .put(protect, updateInterviewLog)
  .delete(protect, deleteInterviewLog);

module.exports = router;
