const asyncHandler = require('express-async-handler');
const InterviewLog = require('../models/InterviewLog');
const { createAndNotify } = require('../utils/notificationHelper');

// @desc    Get interview logs for current user
// @route   GET /api/interview-logs
// @access  Private
const getMyInterviewLogs = asyncHandler(async (req, res) => {
  const logs = await InterviewLog.find({ user: req.user.id })
    .populate('internship', 'title organization')
    .populate('application', 'status')
    .sort({ interviewDate: 1 });
  res.json(logs);
});

// @desc    Create an interview log
// @route   POST /api/interview-logs
// @access  Private
const createInterviewLog = asyncHandler(async (req, res) => {
  const {
    application,
    internship,
    interviewDate,
    interviewType,
    status,
    notes,
    rating,
    outcome,
  } = req.body;

  const log = await InterviewLog.create({
    user: req.user.id,
    application: application || null,
    internship: internship || null,
    interviewDate: interviewDate || null,
    interviewType,
    status,
    notes,
    rating,
    outcome,
  });

  await createAndNotify(req.app, {
    recipient: req.user.id,
    title: 'Interview Scheduled',
    message: `Your interview has been logged${interviewDate ? ` for ${new Date(interviewDate).toLocaleDateString()}` : ''}.`,
    type: 'info',
    priority: 'high',
    link: '/dashboard/interviews',
  });

  res.status(201).json(log);
});

// @desc    Update an interview log
// @route   PUT /api/interview-logs/:id
// @access  Private
const updateInterviewLog = asyncHandler(async (req, res) => {
  const log = await InterviewLog.findById(req.params.id);

  if (!log) {
    res.status(404);
    throw new Error('Interview log not found');
  }

  if (log.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to update this interview log');
  }

  const fields = ['interviewDate', 'interviewType', 'status', 'notes', 'rating', 'outcome', 'application', 'internship'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) log[f] = req.body[f];
  });

  const updated = await log.save();
  res.json(updated);
});

// @desc    Delete an interview log
// @route   DELETE /api/interview-logs/:id
// @access  Private
const deleteInterviewLog = asyncHandler(async (req, res) => {
  const log = await InterviewLog.findById(req.params.id);

  if (!log) {
    res.status(404);
    throw new Error('Interview log not found');
  }

  if (log.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to delete this interview log');
  }

  await log.deleteOne();
  res.json({ message: 'Interview log removed' });
});

// @desc    Get all interview logs (admin)
// @route   GET /api/interview-logs/admin/all
// @access  Private/Admin
const getAdminInterviewLogs = asyncHandler(async (req, res) => {
  const logs = await InterviewLog.find({})
    .populate('user', 'name email')
    .populate('internship', 'title organization')
    .sort({ createdAt: -1 });
  res.json(logs);
});

module.exports = {
  getMyInterviewLogs,
  createInterviewLog,
  updateInterviewLog,
  deleteInterviewLog,
  getAdminInterviewLogs,
};
