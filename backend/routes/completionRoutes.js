const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { initializeCompletion, updateCompletionStatus, getCompletionStatus, getPartnerCompletions, getAdminCompletions } = require('../controllers/completionController');

router.post('/:applicationId/initialize', protect, initializeCompletion);
router.put('/:applicationId/status', protect, updateCompletionStatus);
router.get('/:applicationId', protect, getCompletionStatus);
router.get('/partner/all', protect, getPartnerCompletions);
router.get('/admin/all', protect, getAdminCompletions);
module.exports = router;
