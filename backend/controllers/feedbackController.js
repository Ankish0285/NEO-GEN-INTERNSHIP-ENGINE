const asyncHandler = require('express-async-handler');
const FeedbackForm = require('../models/FeedbackForm');
const FeedbackResponse = require('../models/FeedbackResponse');
const ActivityLog = require('../models/ActivityLog');
const { createAndNotify } = require('../utils/notificationHelper');

// @desc    Get active feedback forms for current user's role
// @route   GET /api/feedback/forms
// @access  Private
const getFeedbackForms = asyncHandler(async (req, res) => {
  const forms = await FeedbackForm.find({
    isActive: true,
    targetAudience: { $in: [req.user.role, 'all'] },
  }).sort({ createdAt: -1 });
  res.json(forms);
});

// @desc    Get a single feedback form
// @route   GET /api/feedback/forms/:id
// @access  Private
const getFeedbackFormById = asyncHandler(async (req, res) => {
  const form = await FeedbackForm.findById(req.params.id);
  if (!form) {
    res.status(404);
    throw new Error('Feedback form not found');
  }
  res.json(form);
});

// @desc    Create a feedback form (admin)
// @route   POST /api/feedback/forms
// @access  Private/Admin
const createFeedbackForm = asyncHandler(async (req, res) => {
  const { title, description, targetAudience, questions } = req.body;

  if (!title) {
    res.status(400);
    throw new Error('Title is required');
  }

  const form = await FeedbackForm.create({
    title,
    description,
    targetAudience,
    questions: questions || [],
    createdBy: req.user.id,
  });

  res.status(201).json(form);
});

// @desc    Update a feedback form (admin)
// @route   PUT /api/feedback/forms/:id
// @access  Private/Admin
const updateFeedbackForm = asyncHandler(async (req, res) => {
  const form = await FeedbackForm.findById(req.params.id);
  if (!form) {
    res.status(404);
    throw new Error('Feedback form not found');
  }

  const fields = ['title', 'description', 'targetAudience', 'questions', 'isActive'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) form[f] = req.body[f];
  });

  const updated = await form.save();
  res.json(updated);
});

// @desc    Soft-delete a feedback form (admin)
// @route   DELETE /api/feedback/forms/:id
// @access  Private/Admin
const deleteFeedbackForm = asyncHandler(async (req, res) => {
  const form = await FeedbackForm.findById(req.params.id);
  if (!form) {
    res.status(404);
    throw new Error('Feedback form not found');
  }
  form.isActive = false;
  await form.save();
  res.json({ message: 'Feedback form deactivated' });
});

// @desc    Submit a response to a feedback form
// @route   POST /api/feedback/forms/:formId/respond
// @access  Private
const submitFeedbackResponse = asyncHandler(async (req, res) => {
  const form = await FeedbackForm.findById(req.params.formId);
  if (!form || !form.isActive) {
    res.status(404);
    throw new Error('Feedback form not found or inactive');
  }

  const response = await FeedbackResponse.create({
    form: req.params.formId,
    respondent: req.user.id,
    answers: req.body.answers || [],
  });

  await ActivityLog.create({
    user: req.user.id,
    action: 'feedback_submitted',
    details: { formId: req.params.formId, formTitle: form.title },
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json(response);
});

// @desc    Get all responses for a form (admin)
// @route   GET /api/feedback/forms/:formId/responses
// @access  Private/Admin
const getFormResponses = asyncHandler(async (req, res) => {
  const responses = await FeedbackResponse.find({ form: req.params.formId })
    .populate('respondent', 'name email')
    .sort({ submittedAt: -1 });
  res.json(responses);
});

module.exports = {
  getFeedbackForms,
  getFeedbackFormById,
  createFeedbackForm,
  updateFeedbackForm,
  deleteFeedbackForm,
  submitFeedbackResponse,
  getFormResponses,
};
