const asyncHandler = require('express-async-handler');
const PlacementRecord = require('../models/PlacementRecord');
const { createAndNotify } = require('../utils/notificationHelper');

// @desc    Get placements for current user
// @route   GET /api/placements/my
// @access  Private
const getMyPlacements = asyncHandler(async (req, res) => {
  const placements = await PlacementRecord.find({ student: req.user.id })
    .populate('internship', 'title organization')
    .sort({ createdAt: -1 });
  res.json(placements);
});

// @desc    Add a placement record
// @route   POST /api/placements
// @access  Private
const addPlacement = asyncHandler(async (req, res) => {
  const { internship, company, role, stipend, startDate, endDate, certificate, notes } = req.body;

  const placement = await PlacementRecord.create({
    student: req.user.id,
    internship: internship || null,
    company,
    role,
    stipend,
    startDate: startDate || null,
    endDate: endDate || null,
    certificate,
    notes,
  });

  res.status(201).json(placement);
});

// @desc    Get all placements (admin)
// @route   GET /api/placements/admin/all
// @access  Private/Admin
const adminGetAllPlacements = asyncHandler(async (req, res) => {
  const placements = await PlacementRecord.find({})
    .populate('student', 'name email')
    .populate('internship', 'title')
    .sort({ createdAt: -1 });
  res.json(placements);
});

// @desc    Verify a placement (admin)
// @route   PUT /api/placements/admin/:id/verify
// @access  Private/Admin
const adminVerifyPlacement = asyncHandler(async (req, res) => {
  const placement = await PlacementRecord.findById(req.params.id).populate('student', 'name');
  if (!placement) {
    res.status(404);
    throw new Error('Placement record not found');
  }

  placement.isVerified = true;
  placement.verifiedBy = req.user.id;
  const updated = await placement.save();

  await createAndNotify(req.app, {
    recipient: placement.student._id,
    title: 'Placement Verified',
    message: `Your placement at ${placement.company || 'the company'} has been verified.`,
    type: 'success',
    priority: 'high',
    link: '/dashboard/placements',
  });

  res.json(updated);
});

// @desc    Update a placement (student, only if not verified)
// @route   PUT /api/placements/:id
// @access  Private
const updatePlacement = asyncHandler(async (req, res) => {
  const placement = await PlacementRecord.findById(req.params.id);
  if (!placement) {
    res.status(404);
    throw new Error('Placement record not found');
  }

  if (placement.student.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized');
  }

  if (placement.isVerified) {
    res.status(400);
    throw new Error('Cannot update a verified placement record');
  }

  const fields = ['company', 'role', 'stipend', 'startDate', 'endDate', 'certificate', 'notes', 'internship'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) placement[f] = req.body[f];
  });

  const updated = await placement.save();
  res.json(updated);
});

// @desc    Delete a placement (admin or owner)
// @route   DELETE /api/placements/:id
// @access  Private
const deletePlacement = asyncHandler(async (req, res) => {
  const placement = await PlacementRecord.findById(req.params.id);
  if (!placement) {
    res.status(404);
    throw new Error('Placement record not found');
  }

  const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
  const isOwner = placement.student.toString() === req.user.id;

  if (!isAdmin && !isOwner) {
    res.status(403);
    throw new Error('Not authorized');
  }

  await placement.deleteOne();
  res.json({ message: 'Placement record removed' });
});

module.exports = {
  getMyPlacements,
  addPlacement,
  adminGetAllPlacements,
  adminVerifyPlacement,
  updatePlacement,
  deletePlacement,
};
