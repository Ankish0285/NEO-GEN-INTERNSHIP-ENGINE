const express = require('express');
const router = express.Router();
const {
  getFeedbackForms,
  getFeedbackFormById,
  createFeedbackForm,
  updateFeedbackForm,
  deleteFeedbackForm,
  submitFeedbackResponse,
  getFormResponses,
} = require('../controllers/feedbackController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/forms')
  .get(protect, getFeedbackForms)
  .post(protect, admin, createFeedbackForm);

router.route('/forms/:id')
  .get(protect, getFeedbackFormById)
  .put(protect, admin, updateFeedbackForm)
  .delete(protect, admin, deleteFeedbackForm);

router.post('/forms/:formId/respond', protect, submitFeedbackResponse);
router.get('/forms/:formId/responses', protect, admin, getFormResponses);

module.exports = router;
