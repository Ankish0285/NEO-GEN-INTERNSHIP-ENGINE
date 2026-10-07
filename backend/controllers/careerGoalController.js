const asyncHandler = require('express-async-handler');
const CareerGoal = require('../models/CareerGoal');

// @desc    Get current user's career goal
// @route   GET /api/career-goals
// @access  Private
const getMyCareerGoal = asyncHandler(async (req, res) => {
  const goal = await CareerGoal.findOne({ user: req.user.id });
  res.json(goal || {});
});

// @desc    Create or update current user's career goal
// @route   POST / PUT /api/career-goals
// @access  Private
const upsertCareerGoal = asyncHandler(async (req, res) => {
  const {
    targetRoles,
    targetDomains,
    targetCompanies,
    preferredLocation,
    expectedSalary,
    targetTimeline,
    notes,
  } = req.body;

  const goal = await CareerGoal.findOneAndUpdate(
    { user: req.user.id },
    {
      user: req.user.id,
      ...(targetRoles !== undefined && { targetRoles }),
      ...(targetDomains !== undefined && { targetDomains }),
      ...(targetCompanies !== undefined && { targetCompanies }),
      ...(preferredLocation !== undefined && { preferredLocation }),
      ...(expectedSalary !== undefined && { expectedSalary }),
      ...(targetTimeline !== undefined && { targetTimeline }),
      ...(notes !== undefined && { notes }),
    },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json(goal);
});

// @desc    Delete current user's career goal
// @route   DELETE /api/career-goals
// @access  Private
const deleteCareerGoal = asyncHandler(async (req, res) => {
  const result = await CareerGoal.deleteOne({ user: req.user.id });
  if (result.deletedCount === 0) {
    res.status(404);
    throw new Error('Career goal not found');
  }
  res.json({ message: 'Career goal removed' });
});

module.exports = { getMyCareerGoal, upsertCareerGoal, deleteCareerGoal };
