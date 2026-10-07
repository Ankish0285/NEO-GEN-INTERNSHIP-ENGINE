const asyncHandler = require('express-async-handler');
const SkillAssessment = require('../models/SkillAssessment');

// @desc    Get assessments for current user
// @route   GET /api/skill-assessments
// @access  Private
const getMyAssessments = asyncHandler(async (req, res) => {
  const assessments = await SkillAssessment.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(assessments);
});

// @desc    Add a skill assessment
// @route   POST /api/skill-assessments
// @access  Private
const addAssessment = asyncHandler(async (req, res) => {
  const { skill, level, score, source } = req.body;

  if (!skill) {
    res.status(400);
    throw new Error('Skill is required');
  }

  const assessment = await SkillAssessment.create({
    user: req.user.id,
    skill,
    level,
    score,
    source,
  });

  res.status(201).json(assessment);
});

// @desc    Update a skill assessment
// @route   PUT /api/skill-assessments/:id
// @access  Private
const updateAssessment = asyncHandler(async (req, res) => {
  const assessment = await SkillAssessment.findById(req.params.id);

  if (!assessment) {
    res.status(404);
    throw new Error('Assessment not found');
  }

  if (assessment.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to update this assessment');
  }

  const { skill, level, score, source, assessedAt } = req.body;
  if (skill !== undefined) assessment.skill = skill;
  if (level !== undefined) assessment.level = level;
  if (score !== undefined) assessment.score = score;
  if (source !== undefined) assessment.source = source;
  if (assessedAt !== undefined) assessment.assessedAt = assessedAt;

  const updated = await assessment.save();
  res.json(updated);
});

// @desc    Delete a skill assessment
// @route   DELETE /api/skill-assessments/:id
// @access  Private
const deleteAssessment = asyncHandler(async (req, res) => {
  const assessment = await SkillAssessment.findById(req.params.id);

  if (!assessment) {
    res.status(404);
    throw new Error('Assessment not found');
  }

  if (assessment.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to delete this assessment');
  }

  await assessment.deleteOne();
  res.json({ message: 'Assessment removed' });
});

// @desc    Get all assessments (admin)
// @route   GET /api/skill-assessments/admin/all
// @access  Private/Admin
const getAdminAllAssessments = asyncHandler(async (req, res) => {
  const assessments = await SkillAssessment.find({})
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  res.json(assessments);
});

module.exports = {
  getMyAssessments,
  addAssessment,
  updateAssessment,
  deleteAssessment,
  getAdminAllAssessments,
};
