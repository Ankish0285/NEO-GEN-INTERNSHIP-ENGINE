const asyncHandler = require('express-async-handler');
const AdaptiveLearning = require('../models/AdaptiveLearning');
const Guide = require('../models/Guide');
const AIStudentProfile = require('../models/AIStudentProfile');
const SkillEvidence = require('../models/SkillEvidence');
const MicroAssessment = require('../models/MicroAssessment');
const { calculateConfidence } = require('./skillEvidenceController');
const { createAndNotify } = require('../utils/notificationHelper');

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

// @desc    Complete adaptive learning guide and update skill evidence
// @route   PUT /api/adaptive-learning/:guideId/complete-learning
// @access  Private
const completeLearning = asyncHandler(async (req, res) => {
  const { assessmentScore, skillsTargeted } = req.body;

  if (!skillsTargeted || !Array.isArray(skillsTargeted)) {
    res.status(400);
    throw new Error('skillsTargeted array is required');
  }

  const updated = [];

  for (const skillName of skillsTargeted) {
    if (!skillName) continue;

    let evidenceDoc = await SkillEvidence.findOne({ user: req.user.id, skillName });

    if (!evidenceDoc) {
      evidenceDoc = new SkillEvidence({
        user: req.user.id,
        skillName,
        proficiency: 'beginner',
        evidenceSources: [],
      });
    }

    const score = Number(assessmentScore) || 0;
    const strength = score > 80 ? 'strong' : score > 60 ? 'moderate' : 'weak';

    evidenceDoc.evidenceSources.push({
      type: 'learning',
      description: 'Completed adaptive learning guide',
      strength,
      verifiedAt: new Date(),
    });

    evidenceDoc.confidenceScore = calculateConfidence(evidenceDoc.evidenceSources, evidenceDoc.isVerified);
    await evidenceDoc.save();
    updated.push(skillName);
  }

  await createAndNotify(req.app, {
    recipient: req.user.id,
    title: 'Learning Completed!',
    message: 'Great work! Your skill evidence has been updated.',
    type: 'success',
    priority: 'medium',
    link: '/dashboard/career',
  });

  res.json({
    updated,
    disclaimer: 'Confidence scores updated based on assessment',
  });
});

// @desc    Submit a micro-assessment and update skill evidence
// @route   POST /api/adaptive-learning/assessment
// @access  Private
const submitAssessment = asyncHandler(async (req, res) => {
  const { skillName, questions, userAnswers } = req.body;

  if (!skillName) {
    res.status(400);
    throw new Error('skillName is required');
  }

  const qs = questions || [];
  const answers = userAnswers || [];

  // Calculate score
  let score = 0;
  for (let i = 0; i < qs.length; i++) {
    if (answers[i] !== undefined && answers[i] === qs[i].correctIndex) {
      score++;
    }
  }
  const maxScore = qs.length;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  // Save MicroAssessment
  const microAssessment = await MicroAssessment.create({
    user: req.user.id,
    skillName,
    questions: qs,
    userAnswers: answers,
    score,
    maxScore,
  });

  // Find or create SkillEvidence
  let evidenceDoc = await SkillEvidence.findOne({ user: req.user.id, skillName });

  if (!evidenceDoc) {
    evidenceDoc = new SkillEvidence({
      user: req.user.id,
      skillName,
      proficiency: 'beginner',
      evidenceSources: [],
    });
  }

  const strength = percentage > 80 ? 'strong' : percentage > 60 ? 'moderate' : 'weak';

  evidenceDoc.evidenceSources.push({
    type: 'assessment',
    description: `Micro-assessment: ${score}/${maxScore} (${percentage}%)`,
    strength,
    verifiedAt: new Date(),
  });

  const newConfidenceScore = calculateConfidence(evidenceDoc.evidenceSources, evidenceDoc.isVerified);
  evidenceDoc.confidenceScore = newConfidenceScore;
  await evidenceDoc.save();

  // Mark evidence as added on MicroAssessment
  microAssessment.evidenceAdded = true;
  await microAssessment.save();

  res.json({
    score,
    maxScore,
    percentage,
    skillConfidenceUpdated: true,
    newConfidenceScore,
  });
});

module.exports = {
  getMyAdaptivePlan,
  refreshAdaptivePlan,
  markGuideCompleted,
  adminGetAllAdaptivePlans,
  getAdaptiveLearningRecommendations,
  completeLearning,
  submitAssessment,
};
