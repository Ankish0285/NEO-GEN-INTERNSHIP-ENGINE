const asyncHandler = require('express-async-handler');
const AdaptiveLearning = require('../models/AdaptiveLearning');
const Guide = require('../models/Guide');
const AIStudentProfile = require('../models/AIStudentProfile');

// @desc    Get the adaptive learning plan for the current user
// @route   GET /api/adaptive-learning
// @access  Private
const getMyAdaptivePlan = asyncHandler(async (req, res) => {
  const plan = await AdaptiveLearning.findOne({ user: req.user.id })
    .populate('recommendedGuides.guide', 'title category slug')
    .populate('completedGuides', 'title category slug');

  if (!plan) {
    return res.json({
      user: req.user.id,
      recommendedGuides: [],
      completedGuides: [],
      currentSkillGaps: [],
      learningPath: [],
      lastUpdated: null,
    });
  }

  res.json(plan);
});

// @desc    Refresh adaptive learning plan based on AI profile
// @route   POST /api/adaptive-learning/refresh
// @access  Private
const refreshAdaptivePlan = asyncHandler(async (req, res) => {
  const aiProfile = await AIStudentProfile.findOne({ user: req.user.id });

  const skillGaps = [];
  const learningPath = [];
  const recommendedGuides = [];

  if (aiProfile) {
    // Extract skill gaps from learningRoadmap
    if (aiProfile.learningRoadmap && aiProfile.learningRoadmap.length > 0) {
      aiProfile.learningRoadmap.forEach((item, index) => {
        if (item.skill) skillGaps.push(item.skill);
        learningPath.push({
          skill: item.skill || '',
          course: item.course || '',
          priority: index + 1,
          estimatedWeeks: 3,
        });
      });
    }

    // Find matching published guides for each skill gap
    for (let i = 0; i < Math.min(skillGaps.length, 5); i++) {
      const gap = skillGaps[i];
      const guide = await Guide.findOne({
        status: 'published',
        title: { $regex: gap, $options: 'i' },
      }).select('_id title category');

      if (guide) {
        recommendedGuides.push({
          guide: guide._id,
          reason: `Matches your skill gap: ${gap}`,
          priority: i + 1,
        });
      }
    }
  }

  const plan = await AdaptiveLearning.findOneAndUpdate(
    { user: req.user.id },
    {
      user: req.user.id,
      recommendedGuides,
      currentSkillGaps: skillGaps,
      learningPath,
      lastUpdated: new Date(),
    },
    { new: true, upsert: true, runValidators: true }
  )
    .populate('recommendedGuides.guide', 'title category slug')
    .populate('completedGuides', 'title category slug');

  res.json(plan);
});

// @desc    Mark a guide as completed
// @route   PUT /api/adaptive-learning/:guideId/complete
// @access  Private
const markGuideCompleted = asyncHandler(async (req, res) => {
  const { guideId } = req.params;

  const plan = await AdaptiveLearning.findOneAndUpdate(
    { user: req.user.id },
    {
      $addToSet: { completedGuides: guideId },
      $pull: { recommendedGuides: { guide: guideId } },
      lastUpdated: new Date(),
    },
    { new: true, upsert: true }
  )
    .populate('recommendedGuides.guide', 'title category slug')
    .populate('completedGuides', 'title category slug');

  res.json(plan);
});

// @desc    Get all adaptive learning plans (admin)
// @route   GET /api/adaptive-learning/admin/all
// @access  Private/Admin
const adminGetAllAdaptivePlans = asyncHandler(async (req, res) => {
  const plans = await AdaptiveLearning.find({})
    .populate('user', 'name email')
    .sort({ lastUpdated: -1 });
  res.json(plans);
});

// @desc    Get adaptive learning recommendations based on AI profile skill gaps
// @route   GET /api/adaptive-learning/recommendations
// @access  Private
const getAdaptiveLearningRecommendations = asyncHandler(async (req, res) => {
  // Try to load AIStudentProfile
  let AIStudentProfileModel;
  try { AIStudentProfileModel = require('../models/AIStudentProfile'); } catch(e) {
    return res.json({ success: true, data: { recommendations: [], message: 'Profile model not available' } });
  }
  let GuideModel;
  try { GuideModel = require('../models/Guide'); } catch(e) { GuideModel = null; }

  const profile = await AIStudentProfileModel.findOne({ userId: req.user._id });
  if (!profile) {
    return res.json({ success: true, data: { recommendations: [], message: 'No AI profile found yet. Complete your profile to get personalized recommendations.' } });
  }

  const roadmap = profile.learningRoadmap || profile.skillGaps || [];
  const topGaps = roadmap.slice(0, 5);
  const recommendations = [];

  for (const gap of topGaps) {
    const skillName = typeof gap === 'string' ? gap : (gap.skill || gap.name || gap.skillName || '');
    if (!skillName) continue;
    let guides = [];
    if (GuideModel) {
      try {
        guides = await GuideModel.find({
          $or: [
            { title: { $regex: skillName, $options: 'i' } },
            { tags: { $regex: skillName, $options: 'i' } },
            { category: { $regex: skillName, $options: 'i' } },
          ]
        }).limit(3).select('_id title category link description');
      } catch(e) { guides = []; }
    }
    recommendations.push({ skillName, gap: typeof gap === 'object' ? gap : { skill: skillName }, guides });
  }

  res.json({ success: true, data: { recommendations } });
});

module.exports = {
  getMyAdaptivePlan,
  refreshAdaptivePlan,
  markGuideCompleted,
  adminGetAllAdaptivePlans,
  getAdaptiveLearningRecommendations,
};
