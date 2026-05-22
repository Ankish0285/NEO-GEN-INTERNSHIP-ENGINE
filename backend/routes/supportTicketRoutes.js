const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createTicket,
  getTickets,
  getUnreadCount,
  getTicket,
  replyTicket,
  updateStatus,
  assignTicket,
  deleteTicket,
  getAssignees,
} = require('../controllers/supportTicketController');

const router = express.Router();

// Health check (no auth) — verify API is mounted
router.get('/health', (req, res) => {
  res.json({ success: true, service: 'support-tickets' });
});

router.get('/unread-count', protect, getUnreadCount);
router.get('/meta/assignees', protect, admin, getAssignees);
router.get('/', protect, getTickets);
router.post('/', protect, upload.single('file'), createTicket);
router.get('/:id', protect, getTicket);
router.post('/:id/reply', protect, upload.single('file'), replyTicket);
router.patch('/:id/status', protect, updateStatus);
router.patch('/:id/assign', protect, admin, assignTicket);
router.delete('/:id', protect, admin, deleteTicket);

module.exports = router;
