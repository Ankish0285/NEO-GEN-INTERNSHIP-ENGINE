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

// @desc    Get rejection patterns for current user
// @route   GET /api/interview-logs/rejection-patterns
// @access  Private
const getRejectionPatterns = asyncHandler(async (req, res) => {
  // 'failed' outcome is the rejection equivalent in the InterviewLog model
  const rejectedLogs = await InterviewLog.find({
    user: req.user._id,
    $or: [
      { outcome: 'failed' },
      { result: 'rejected' }, // support future field
    ],
  });

  // Group by rejectionReason (if field exists) or fall back to interviewType as a proxy
  const reasonCounts = {};
  rejectedLogs.forEach((log) => {
    const reason = log.rejectionReason || log.notes?.split('\n')[0]?.trim() || 'unspecified';
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  });

  const total = rejectedLogs.length;

  const patterns = Object.entries(reasonCounts)
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const topReason = patterns.length > 0 ? patterns[0].reason : null;

  const suggestionMap = {
    'skill mismatch': 'Build one project in the missing skill area',
    experience: 'Take on freelance or open source projects to build experience',
    communication: 'Practice mock interviews and improve verbal communication skills',
  };

  const suggestions = topReason
    ? [suggestionMap[topReason.toLowerCase()] || 'Review your interview performance and identify areas for improvement']
    : [];

  res.json({ patterns, topReason, suggestions });
});

// @desc    Get interview learning insights for current user
// @route   GET /api/interview-logs/interview-learning
// @access  Private
const getInterviewLearning = asyncHandler(async (req, res) => {
  const logs = await InterviewLog.find({ user: req.user._id });

  // Aggregate difficultTopics across entries (field may not exist on all documents)
  const topicCounts = {};
  logs.forEach((log) => {
    const topics = log.difficultTopics || [];
    topics.forEach((topic) => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
  });

  const weakTopics = Object.entries(topicCounts)
    .map(([topic, occurrences]) => ({ topic, occurrences }))
    .sort((a, b) => b.occurrences - a.occurrences);

  const topicActionMap = {
    DBMS: { action: 'Study DBMS fundamentals and practice SQL queries', resourceType: 'course' },
    DSA: { action: 'Practice LeetCode medium problems daily', resourceType: 'practice' },
    'System Design': { action: 'Study system design fundamentals and practice case studies', resourceType: 'course' },
  };

  const recommendations = weakTopics.map(({ topic }) => ({
    topic,
    action: topicActionMap[topic]?.action || `Review ${topic} fundamentals and practice related problems`,
    resourceType: topicActionMap[topic]?.resourceType || 'study',
  }));

  res.json({ weakTopics, recommendations });
});

module.exports = {
  getMyInterviewLogs,
  createInterviewLog,
  updateInterviewLog,
  deleteInterviewLog,
  getAdminInterviewLogs,
  getRejectionPatterns,
  getInterviewLearning,
};
