const asyncHandler = require('express-async-handler');
const PlacementRecord = require('../models/PlacementRecord');
const Application = require('../models/Application');
const { createAndNotify } = require('../utils/notificationHelper');

const VALID_TRANSITIONS = {
  'applied': ['selected'],
  'selected': ['started'],
  'started': ['in_progress'],
  'in_progress': ['completed', 'terminated'],
  'completed': [],
  'terminated': [],
};

const initializeCompletion = asyncHandler(async (req, res) => {
  if (req.user.role !== 'partner') { res.status(403); throw new Error('Partner only'); }
  const { applicationId } = req.params;
  const application = await Application.findById(applicationId).populate('internship user');
  if (!application) { res.status(404); throw new Error('Application not found'); }
  if (application.internship.createdBy.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized for this internship');
  }
  let record = await PlacementRecord.findOne({ applicationId });
  if (!record) {
    record = await PlacementRecord.create({
      applicationId, studentId: application.user._id,
      internshipId: application.internship._id, partnerId: req.user._id,
      completionStatus: 'selected', selectedAt: new Date(),
    });
  }
  await createAndNotify(req.app, {
    recipient: application.user._id,
    title: '🎉 You have been Selected!',
    message: `Congratulations! You have been selected for ${application.internship.title}.`,
    type: 'success', priority: 'high', link: '/dashboard/applications',
  });
  res.status(201).json({ success: true, data: record });
});

const updateCompletionStatus = asyncHandler(async (req, res) => {
  if (req.user.role !== 'partner') { res.status(403); throw new Error('Partner only'); }
  const { newStatus, performanceRating } = req.body;
  const record = await PlacementRecord.findOne({ applicationId: req.params.applicationId });
  if (!record) { res.status(404); throw new Error('Completion record not found'); }
  const allowed = VALID_TRANSITIONS[record.completionStatus] || [];
  if (!allowed.includes(newStatus)) {
    res.status(400); throw new Error(`Cannot transition from ${record.completionStatus} to ${newStatus}`);
  }
  const update = { completionStatus: newStatus };
  if (newStatus === 'started') update.startedAt = new Date();
  if (newStatus === 'completed') { update.completedAt = new Date(); update.markedCompletedBy = req.user._id; }
  if (newStatus === 'terminated') update.terminatedAt = new Date();
  if (performanceRating) update.performanceRating = performanceRating;
  const updated = await PlacementRecord.findOneAndUpdate(
    { applicationId: req.params.applicationId }, update, { new: true }
  );
  await Application.findByIdAndUpdate(req.params.applicationId, { completionStatus: newStatus });
  const statusMessages = {
    started: '🚀 Your internship has started!',
    in_progress: '📈 Internship status updated to In Progress.',
    completed: '🎓 Congratulations! Your internship is marked as Completed.',
    terminated: '📋 Your internship status has been updated.',
  };
  await createAndNotify(req.app, {
    recipient: updated.studentId,
    title: statusMessages[newStatus] || 'Internship Status Updated',
    message: `Your internship completion status has been updated to: ${newStatus}`,
    type: newStatus === 'completed' ? 'success' : 'new',
    priority: 'medium', link: '/dashboard/applications',
  });
  res.json({ success: true, data: updated });
});

const getCompletionStatus = asyncHandler(async (req, res) => {
  const record = await PlacementRecord.findOne({ applicationId: req.params.applicationId });
  if (!record) return res.json({ success: true, data: null });
  res.json({ success: true, data: record });
});

const getPartnerCompletions = asyncHandler(async (req, res) => {
  const records = await PlacementRecord.find({ partnerId: req.user._id })
    .populate('studentId', 'name email')
    .populate('internshipId', 'title')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: records });
});

const getAdminCompletions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const total = await PlacementRecord.countDocuments();
  const records = await PlacementRecord.find()
    .populate('studentId', 'name email')
    .populate('internshipId', 'title')
    .populate('partnerId', 'name')
    .sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit);
  res.json({ success: true, data: records, total, page, pages: Math.ceil(total/limit) });
});

module.exports = { initializeCompletion, updateCompletionStatus, getCompletionStatus, getPartnerCompletions, getAdminCompletions };
