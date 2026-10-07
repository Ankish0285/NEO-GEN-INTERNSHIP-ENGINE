const express = require('express');
const router = express.Router();
const {
  getMyInterviewLogs,
  createInterviewLog,
  updateInterviewLog,
  deleteInterviewLog,
  getAdminInterviewLogs,
} = require('../controllers/interviewLogController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getMyInterviewLogs)
  .post(protect, createInterviewLog);

router.get('/admin/all', protect, admin, getAdminInterviewLogs);

router.route('/:id')
  .put(protect, updateInterviewLog)
  .delete(protect, deleteInterviewLog);

module.exports = router;
