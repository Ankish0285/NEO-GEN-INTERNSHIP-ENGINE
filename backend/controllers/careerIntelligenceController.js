const asyncHandler = require('express-async-handler');
const AIStudentProfile = require('../models/AIStudentProfile');
const CareerGoal = require('../models/CareerGoal');
const SkillAssessment = require('../models/SkillAssessment');
const PlacementRecord = require('../models/PlacementRecord');
const AdaptiveLearning = require('../models/AdaptiveLearning');
const Application = require('../models/Application');
const InterviewLog = require('../models/InterviewLog');
const aiClient = require('../services/aiServiceClient');
const SkillEvidence = require('../models/SkillEvidence');
const Internship = require('../models/Internship');
const { calculateConfidence } = require('./skillEvidenceController');
const { calculateQualityScore } = require('./internshipQualityController');

// ─── Existing handlers (unchanged) ────────────────────────────────────────────

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

// ─── Helper: build skill demand map from internships ──────────────────────────

const buildSkillDemandMap = (internships) => {
  const map = {};
  for (const internship of internships) {
    const skills = internship.requiredSkills && internship.requiredSkills.length
      ? internship.requiredSkills
      : (internship.skills || []);
    for (const skill of skills) {
      const key = skill.toLowerCase();
      map[key] = (map[key] || 0) + 1;
    }
  }
  return map;
};

// ─── New handlers ─────────────────────────────────────────────────────────────

// @desc    Get prioritised skill gap list for current user
// @route   GET /api/career-intelligence/skill-gap-priority
// @access  Private
const getSkillGapPriority = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [evidenceDocs, aiProfile, internships] = await Promise.all([
    SkillEvidence.find({ user: userId }),
    AIStudentProfile.findOne({ user: userId }).select('learningRoadmap'),
    Internship.find({ status: { $in: ['active', 'published'] } }).select('requiredSkills skills title'),
  ]);

  const skillDemandMap = buildSkillDemandMap(internships);

  const priorityOrder = { high: 0, medium: 1, low: 2 };

  const results = evidenceDocs.map((doc) => {
    const gapScore = Math.max(0, 100 - (doc.confidenceScore || 0));
    const demandCount = skillDemandMap[doc.skillName.toLowerCase()] || 0;

    let priority;
    if (gapScore > 60 && demandCount > 5) {
      priority = 'high';
    } else if (gapScore > 30 || demandCount > 2) {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    const estimatedImpact =
      priority === 'high'
        ? 'Unlocks many opportunities'
        : priority === 'medium'
        ? 'Moderate impact'
        : 'Minor improvement';

    const learningEffort =
      gapScore > 60 ? 'high' : gapScore > 30 ? 'medium' : 'low';

    const reason = `Your ${doc.skillName} confidence is ${doc.confidenceScore || 0}% (gap: ${gapScore}%). This skill appears in ${demandCount} active internship(s).`;

    return {
      skillName: doc.skillName,
      confidenceScore: doc.confidenceScore || 0,
      gapScore,
      demandCount,
      priority,
      estimatedImpact,
      learningEffort,
      reason,
    };
  });

  results.sort((a, b) => {
    const po = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (po !== 0) return po;
    return b.gapScore - a.gapScore;
  });

  res.json(results);
});

// @desc    Simulate the impact of improving a skill
// @route   POST /api/career-intelligence/what-if
// @access  Private
const getWhatIfSimulation = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { skill, improvementPoints } = req.body;

  if (!skill) {
    res.status(400);
    throw new Error('skill is required');
  }

  const [evidenceDoc, internships] = await Promise.all([
    SkillEvidence.findOne({ user: userId, skillName: new RegExp(`^${skill}$`, 'i') }),
    Internship.find({ status: { $in: ['active', 'published'] } }).select('requiredSkills skills'),
  ]);

  const currentConfidence = evidenceDoc ? (evidenceDoc.confidenceScore || 0) : 0;
  const simulatedConfidence = Math.min(100, currentConfidence + (improvementPoints || 20));

  let currentOpportunities = 0;
  let estimatedAfter = 0;

  for (const internship of internships) {
    const skills = internship.requiredSkills && internship.requiredSkills.length
      ? internship.requiredSkills
      : (internship.skills || []);
    const hasSkill = skills.some((s) => s.toLowerCase() === skill.toLowerCase());
    if (!hasSkill) continue;

    if (currentConfidence >= 50) currentOpportunities += 1;
    if (simulatedConfidence >= 50) estimatedAfter += 1;
  }

  const delta = estimatedAfter - currentOpportunities;

  res.json({
    skill,
    currentConfidence,
    simulatedConfidence,
    currentOpportunities,
    estimatedAfter,
    delta,
    disclaimer: 'This is an estimate, not a guarantee',
  });
});

// @desc    Show how many internships a skill unlocks
// @route   GET /api/career-intelligence/opportunity-unlock?skill=X
// @access  Private
const getOpportunityUnlock = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { skill } = req.query;

  if (!skill) {
    res.status(400);
    throw new Error('skill query param is required');
  }

  const [internships, evidenceDoc] = await Promise.all([
    Internship.find({
      status: { $in: ['active', 'published'] },
      $or: [
        { requiredSkills: { $regex: new RegExp(skill, 'i') } },
        { skills: { $regex: new RegExp(skill, 'i') } },
      ],
    }).select('requiredSkills skills category title'),
    SkillEvidence.findOne({ user: userId, skillName: new RegExp(`^${skill}$`, 'i') }),
  ]);

  const userConfidence = evidenceDoc ? (evidenceDoc.confidenceScore || 0) : 0;

  const categoriesSet = new Set();
  let estimatedUnlock = 0;

  for (const internship of internships) {
    if (internship.category) categoriesSet.add(internship.category);
    if (userConfidence < 50) estimatedUnlock += 1;
  }

  res.json({
    skill,
    internshipsRequiring: internships.length,
    categories: Array.from(categoriesSet),
    estimatedUnlock,
  });
});

// @desc    Explain why a user might hesitate to apply
// @route   GET /api/career-intelligence/why-not-apply/:internshipId
// @access  Private
const getWhyNotApply = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [internship, evidenceDocs] = await Promise.all([
    Internship.findById(req.params.internshipId),
    SkillEvidence.find({ user: userId }),
  ]);

  if (!internship) {
    res.status(404);
    throw new Error('Internship not found');
  }

  const requiredSkills = internship.requiredSkills && internship.requiredSkills.length
    ? internship.requiredSkills
    : (internship.skills || []);

  const evidenceMap = {};
  for (const doc of evidenceDocs) {
    evidenceMap[doc.skillName.toLowerCase()] = doc.confidenceScore || 0;
  }

  const concerns = [];
  for (const skill of requiredSkills) {
    const userConfidence = evidenceMap[skill.toLowerCase()] || 0;
    let severity;

    if (userConfidence < 30) {
      severity = 'high';
    } else if (userConfidence < 60) {
      severity = 'medium';
    } else if (userConfidence < 80) {
      severity = 'low';
    } else {
      continue; // no concern
    }

    concerns.push({
      skill,
      userConfidence,
      required: skill,
      severity,
      suggestion: 'Build evidence for this skill via projects or assessments',
    });
  }

  const overallRisk = concerns.some((c) => c.severity === 'high')
    ? 'high'
    : concerns.some((c) => c.severity === 'medium')
    ? 'medium'
    : 'low';

  const recommendation =
    overallRisk === 'high'
      ? 'We recommend improving key skills before applying.'
      : 'You are a reasonable candidate. Consider applying.';

  res.json({
    concerns,
    overallRisk,
    internshipTitle: internship.title,
    recommendation,
  });
});

// @desc    Counterfactual "what should I do" recommendation
// @route   POST /api/career-intelligence/counterfactual
// @access  Private
const getCounterfactualRecommendation = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { questionType } = req.body;

  const [evidenceDocs, internships] = await Promise.all([
    SkillEvidence.find({ user: userId }),
    Internship.find({ status: { $in: ['active', 'published'] } }).select('requiredSkills skills title'),
  ]);

  const skillDemandMap = buildSkillDemandMap(internships);
  const totalInternships = internships.length;

  const evidenceMap = {};
  for (const doc of evidenceDocs) {
    evidenceMap[doc.skillName.toLowerCase()] = doc;
  }

  if (questionType === 'best_skill') {
    // Find skill in internships the user has NO evidence for (or lowest confidence) AND highest demand
    const allSkills = Object.keys(skillDemandMap);
    let bestSkill = null;
    let bestScore = -1;

    for (const skill of allSkills) {
      const doc = evidenceMap[skill];
      const confidence = doc ? (doc.confidenceScore || 0) : 0;
      const demandCount = skillDemandMap[skill] || 0;
      // Score: high demand + low confidence = best candidate
      const score = demandCount * (1 - confidence / 100);
      if (score > bestScore) {
        bestScore = score;
        bestSkill = skill;
      }
    }

    if (!bestSkill) {
      return res.json({
        recommendation: 'No skill data available',
        reasoning: 'Add internships to the platform to generate recommendations.',
        estimatedImpact: 'Unknown',
        disclaimer: 'This is an estimate',
      });
    }

    const demandCount = skillDemandMap[bestSkill] || 0;
    return res.json({
      recommendation: bestSkill,
      reasoning: `Appears in ${demandCount} internship(s)`,
      estimatedImpact: `Could unlock up to ${demandCount} new opportunities`,
      disclaimer: 'This is an estimate',
    });
  }

  if (questionType === 'smallest_improvement') {
    const thresholds = [40, 60, 80];
    let bestSkill = null;
    let smallestDistance = Infinity;
    let bestUnlocks = 0;

    for (const doc of evidenceDocs) {
      const confidence = doc.confidenceScore || 0;
      const skillKey = doc.skillName.toLowerCase();
      const demandCount = skillDemandMap[skillKey] || 0;

      if (demandCount === 0) continue;

      for (const threshold of thresholds) {
        const distance = threshold - confidence;
        if (distance > 0 && demandCount > 0) {
          if (distance < smallestDistance) {
            smallestDistance = distance;
            bestSkill = doc.skillName;
            bestUnlocks = demandCount;
          }
          break; // only nearest threshold per skill
        }
      }
    }

    if (!bestSkill) {
      return res.json({
        recommendation: 'All tracked skills are at strong confidence levels',
        reasoning: 'No quick wins identified.',
        estimatedImpact: 'Maintain current skills',
        disclaimer: 'This is an estimate',
      });
    }

    return res.json({
      recommendation: bestSkill,
      reasoning: `Improving by ~${smallestDistance} points could cross the next confidence threshold`,
      estimatedImpact: `Could unlock up to ${bestUnlocks} new opportunities`,
      disclaimer: 'This is an estimate',
    });
  }

  if (questionType === 'best_project') {
    // Find top 3 in-demand skills the user lacks (no evidence or low confidence)
    const allSkills = Object.entries(skillDemandMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([skill]) => skill);

    const lacking = allSkills.filter((skill) => {
      const doc = evidenceMap[skill];
      return !doc || (doc.confidenceScore || 0) < 40;
    }).slice(0, 3);

    if (lacking.length === 0) {
      return res.json({
        recommendation: 'Your top skills look good! Keep building evidence.',
        reasoning: 'No critical gaps found in top in-demand skills.',
        estimatedImpact: 'Maintain and deepen existing skills',
        disclaimer: 'This is an estimate',
      });
    }

    const totalUnlock = lacking.reduce((sum, s) => sum + (skillDemandMap[s] || 0), 0);
    return res.json({
      recommendation: `Build a project covering: ${lacking.join(', ')}`,
      reasoning: `These skills appear across ${totalUnlock} internship(s) and you have low or no evidence for them`,
      estimatedImpact: `Could unlock up to ${totalUnlock} new opportunities`,
      disclaimer: 'This is an estimate',
    });
  }

  // Unknown questionType
  res.status(400);
  throw new Error('questionType must be one of: smallest_improvement, best_skill, best_project');
});

// @desc    Explain why an internship is (or isn't) a good fit
// @route   GET /api/career-intelligence/explain/:internshipId
// @access  Private
const getExplainableRecommendation = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [internship, evidenceDocs] = await Promise.all([
    Internship.findById(req.params.internshipId),
    SkillEvidence.find({ user: userId }),
  ]);

  if (!internship) {
    res.status(404);
    throw new Error('Internship not found');
  }

  const required = internship.requiredSkills && internship.requiredSkills.length
    ? internship.requiredSkills
    : (internship.skills || []);

  const evidenceMap = {};
  for (const doc of evidenceDocs) {
    evidenceMap[doc.skillName.toLowerCase()] = doc.confidenceScore || 0;
  }

  const matched = required.filter((s) => (evidenceMap[s.toLowerCase()] || 0) > 40);
  const missing = required.filter((s) => (evidenceMap[s.toLowerCase()] || 0) <= 40);

  const fitScore = required.length > 0
    ? Math.round((matched.length / required.length) * 100)
    : 0;

  const reasons = matched.map((s) => `You have evidence for ${s}`);
  const warnings = missing.map((s) => `No or low evidence for ${s}`);

  res.json({
    matchedSkills: matched,
    missingSkills: missing,
    fitScore,
    reasons,
    warnings,
    internshipTitle: internship.title,
  });
});

// @desc    Rank applied applications by composite opportunity-cost score
// @route   GET /api/career-intelligence/opportunity-cost
// @access  Private
const rankApplicationsByValue = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [applications, evidenceDocs] = await Promise.all([
    Application.find({ student: userId, status: 'Applied' }).populate('internship'),
    SkillEvidence.find({ user: userId }),
  ]);

  const evidenceMap = {};
  for (const doc of evidenceDocs) {
    evidenceMap[doc.skillName.toLowerCase()] = doc.confidenceScore || 0;
  }

  const now = Date.now();

  const ranked = applications
    .filter((app) => app.internship) // skip if internship was deleted
    .map((app) => {
      const internship = app.internship;
      const required = internship.requiredSkills && internship.requiredSkills.length
        ? internship.requiredSkills
        : (internship.skills || []);

      // fitScore
      const matched = required.filter((s) => (evidenceMap[s.toLowerCase()] || 0) > 40);
      const fitScore = required.length > 0
        ? Math.round((matched.length / required.length) * 100)
        : 0;

      // qualityScore
      const { qualityScore } = calculateQualityScore(internship);

      // urgency: capped at 100, based on days since applied
      const daysSinceApplied = Math.floor((now - new Date(app.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const urgency = Math.min(100, Math.round((daysSinceApplied / 30) * 100));

      // composite
      const compositeScore = fitScore * 0.4 + qualityScore * 0.4 + urgency * 0.2;

      const opportunityCostRank = compositeScore > 75 ? 'A' : compositeScore >= 50 ? 'B' : 'C';

      return {
        applicationId: app._id,
        internshipTitle: internship.title,
        organization: internship.organization,
        fitScore,
        qualityScore,
        urgency,
        compositeScore: Math.round(compositeScore),
        opportunityCostRank,
        status: app.status,
        appliedAt: app.createdAt,
      };
    });

  ranked.sort((a, b) => b.compositeScore - a.compositeScore);

  res.json(ranked);
});

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  getCareerDashboard,
  getSkillGapAnalysis,
  getAdminCareerIntelligenceOverview,
  getSkillGapPriority,
  getWhatIfSimulation,
  getOpportunityUnlock,
  getWhyNotApply,
  getCounterfactualRecommendation,
  getExplainableRecommendation,
  rankApplicationsByValue,
};
