const asyncHandler = require('express-async-handler');
const AIStudentProfile = require('../models/AIStudentProfile');
const CareerGoal = require('../models/CareerGoal');
const SkillAssessment = require('../models/SkillAssessment');
const PlacementRecord = require('../models/PlacementRecord');
const AdaptiveLearning = require('../models/AdaptiveLearning');
const Application = require('../models/Application');
const InterviewLog = require('../models/InterviewLog');
const aiClient = require('../services/aiServiceClient');

// @desc    Get aggregated career intelligence dashboard for current user
// @route   GET /api/career-intelligence/dashboard
// @access  Private
const getCareerDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [
    aiProfile,
    careerGoal,
    assessments,
    placements,
    interviews,
    adaptivePlan,
  ] = await Promise.all([
    AIStudentProfile.findOne({ user: userId }).select(
      'skillProfile careerDomain employabilityScore learningRoadmap profileSummary'
    ),
    CareerGoal.findOne({ user: userId }),
    SkillAssessment.find({ user: userId }).sort({ score: -1 }).limit(5),
    PlacementRecord.find({ student: userId })
      .populate('internship', 'title organization')
      .sort({ createdAt: -1 })
      .limit(3),
    InterviewLog.find({ user: userId, status: 'scheduled' })
      .populate('internship', 'title organization')
      .sort({ interviewDate: 1 })
      .limit(5),
    AdaptiveLearning.findOne({ user: userId })
      .populate('recommendedGuides.guide', 'title category')
      .select('currentSkillGaps learningPath recommendedGuides lastUpdated'),
  ]);

  res.json({
    aiProfile: aiProfile || null,
    careerGoal: careerGoal || null,
    topAssessments: assessments,
    recentPlacements: placements,
    upcomingInterviews: interviews,
    adaptivePlan: adaptivePlan || null,
  });
});

// @desc    Get skill gap analysis for current user
// @route   GET /api/career-intelligence/skill-gap
// @access  Private
const getSkillGapAnalysis = asyncHandler(async (req, res) => {
  const aiProfile = await AIStudentProfile.findOne({ user: req.user.id });

  if (!aiProfile) {
    return res.json({ skillGaps: [], learningRoadmap: [], message: 'No AI profile found. Run AI analysis first.' });
  }

  // Try the AI service; fall back to the stored learningRoadmap
  try {
    const available = await aiClient.isAvailable();
    if (available) {
      const result = await aiClient.careerIntelligenceSkillGap({
        skill_profile: aiProfile.skillProfile || [],
        learning_roadmap: aiProfile.learningRoadmap || [],
        career_domain: aiProfile.careerDomain || {},
      });
      return res.json(result);
    }
  } catch (_err) {
    // fall through to local fallback
  }

  res.json({
    skillGaps: (aiProfile.learningRoadmap || []).map((r) => r.skill).filter(Boolean),
    learningRoadmap: aiProfile.learningRoadmap || [],
    source: 'fallback',
  });
});

// @desc    Admin overview of career intelligence metrics
// @route   GET /api/career-intelligence/admin/overview
// @access  Private/Admin
const getAdminCareerIntelligenceOverview = asyncHandler(async (req, res) => {
  const [
    totalPlacements,
    verifiedPlacements,
    totalCareerGoals,
    profileAggs,
    domainAgg,
  ] = await Promise.all([
    PlacementRecord.countDocuments({}),
    PlacementRecord.countDocuments({ isVerified: true }),
    CareerGoal.countDocuments({}),
    AIStudentProfile.aggregate([
      { $group: { _id: null, avgEmployability: { $avg: '$employabilityScore' } } },
    ]),
    AIStudentProfile.aggregate([
      { $group: { _id: '$careerDomain.domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const avgEmployability =
    profileAggs.length > 0 ? Math.round(profileAggs[0].avgEmployability || 0) : 0;

  res.json({
    totalPlacements,
    verifiedPlacements,
    totalCareerGoals,
    avgEmployabilityScore: avgEmployability,
    domainDistribution: domainAgg,
  });
});

module.exports = {
  getCareerDashboard,
  getSkillGapAnalysis,
  getAdminCareerIntelligenceOverview,
};
