const asyncHandler = require('express-async-handler');
const FeedbackForm = require('../models/FeedbackForm');
const FeedbackResponse = require('../models/FeedbackResponse');
const ActivityLog = require('../models/ActivityLog');
const SkillAssessment = require('../models/SkillAssessment');
const { createAndNotify } = require('../utils/notificationHelper');

// Dimension → skill name mapping for company feedback
const DIMENSION_SKILL_MAP = {
  technicalSkills: 'technical',
  communication: 'communication',
  problemSolving: 'problem-solving',
  teamwork: 'teamwork',
  professionalism: 'professionalism',
  learningAbility: 'learning-ability',
};

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

  const answers = req.body.answers || [];

  const response = await FeedbackResponse.create({
    form: req.params.formId,
    respondent: req.user.id,
    answers,
  });

  await ActivityLog.create({
    user: req.user.id,
    action: 'feedback_submitted',
    details: { formId: req.params.formId, formTitle: form.title },
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // --- Feature #24-25: Update SkillAssessment for company feedback dimensions ---
  // Determine the student being assessed: prefer req.body.studentId (company submitting on behalf of student),
  // otherwise fall back to the submitting user.
  const studentId = req.body.studentId || req.user.id;

  // Collect dimension ratings from answers (question matches a dimension key or skill name)
  const dimensionRatings = {};

  // Also support a top-level `ratings` object in the request body for direct company feedback
  const directRatings = req.body.ratings || {};

  // Merge direct ratings and answer-based ratings
  Object.keys(DIMENSION_SKILL_MAP).forEach((dim) => {
    if (directRatings[dim] !== undefined) {
      dimensionRatings[dim] = Number(directRatings[dim]);
    }
  });

  // Parse structured answers: { question: 'technicalSkills', answer: 4 }
  answers.forEach(({ question, answer }) => {
    if (question && DIMENSION_SKILL_MAP[question] !== undefined) {
      dimensionRatings[question] = Number(answer);
    }
  });

  const highRatedDimensions = Object.entries(dimensionRatings).filter(
    ([, rating]) => !isNaN(rating) && rating >= 4
  );

  if (highRatedDimensions.length > 0) {
    await Promise.all(
      highRatedDimensions.map(async ([dim, rating]) => {
        const skillName = DIMENSION_SKILL_MAP[dim];

        // Find or create a SkillAssessment for this student + skill
        let skillDoc = await SkillAssessment.findOne({ user: studentId, skill: skillName });

        if (!skillDoc) {
          skillDoc = await SkillAssessment.create({
            user: studentId,
            skill: skillName,
            level: rating >= 5 ? 'advanced' : 'intermediate',
            score: rating,
            source: 'company_feedback',
          });
        } else {
          // Update score toward the new rating (simple average nudge) and bump level if warranted
          skillDoc.score = Math.min(5, Math.max(skillDoc.score, rating));
          if (skillDoc.score >= 4 && skillDoc.level === 'beginner') {
            skillDoc.level = 'intermediate';
          }
          if (skillDoc.score >= 5 && skillDoc.level !== 'advanced') {
            skillDoc.level = 'advanced';
          }
          skillDoc.source = 'company_feedback';
          skillDoc.assessedAt = new Date();
          await skillDoc.save();
        }
      })
    );

    // Notify the student that their skill profile was updated
    await createAndNotify(req.app, {
      recipient: studentId,
      title: '📊 Company Feedback Received',
      message: 'Your company feedback is available! Your skill profile has been updated.',
      type: 'success',
      priority: 'medium',
      link: '/dashboard/career',
    });
  }
  // --- End Feature #24-25 ---

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
