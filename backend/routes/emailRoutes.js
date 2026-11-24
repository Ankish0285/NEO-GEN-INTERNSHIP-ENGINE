const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getEmailLogs,
  retryEmailLog,
  getEmailStats,
  sendAnnouncement,
  getEmailSettings,
  updateEmailSettings,
} = require('../controllers/emailController');

const router = express.Router();

// All email-admin routes require an authenticated admin (admin or super_admin).
router.use(protect, admin);

router.get('/email-logs', getEmailLogs);
router.post('/email-logs/:id/retry', retryEmailLog);
router.get('/email-stats', getEmailStats);
router.post('/announcements', sendAnnouncement);
router.get('/email-settings', getEmailSettings);
router.put('/email-settings', updateEmailSettings);

module.exports = router;
