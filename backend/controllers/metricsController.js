const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const AIStudentProfile = require('../models/AIStudentProfile');
const Resume = require('../models/Resume');
const {
  pickAtsScore,
  pickAnalyzedScore,
  hasCompletedAnalysis,
} = require('../utils/studentMetrics');

// @desc    Get canonical student metrics (single source of truth)
// @route   GET /api/metrics/student
// @access  Private (authenticated student, own data only)
const getStudentMetrics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Fetch all three documents in parallel — scoped strictly to this user
  const [user, aiProfile, latestResume] = await Promise.all([
    User.findById(userId),
    AIStudentProfile.findOne({ user: userId }),
    Resume.findOne({ user: userId }).sort({ createdAt: -1 }),
  ]);

  // Prefer persisted AI pipeline scores. Schema default 0 is not a genuine result.
  const atsScore = pickAtsScore({ latestResume, user, aiProfile });
  const employabilityScore = pickAnalyzedScore(aiProfile, 'employabilityScore');
  const internshipReadinessScore = pickAnalyzedScore(aiProfile, 'internshipReadinessScore');
  const aiConfidenceScore = pickAnalyzedScore(aiProfile, 'aiConfidenceScore');

  // ─── careerDomain ────────────────────────────────────────────────────────────
  // AIStudentProfile.careerDomain can be an object { domain, label, confidence }
  // or occasionally a plain string from older documents. Handle both shapes.
  let careerDomain = null;
  if (aiProfile != null && aiProfile.careerDomain != null) {
    const raw = aiProfile.careerDomain;
    if (typeof raw === 'string') {
      careerDomain = { domain: raw, label: raw, confidence: null };
    } else {
      careerDomain = {
        domain: raw.domain ?? null,
        label: raw.label ?? null,
        confidence: raw.confidence != null ? raw.confidence : null,
      };
    }
  }

  // ─── profileCompletionPercentage ─────────────────────────────────────────────
  // Source: User.profileCompletionPercentage (calculated by pre-save hook)
  const profileCompletionPercentage =
    user != null && user.profileCompletionPercentage != null
      ? user.profileCompletionPercentage
      : null;

  // ─── skillProfile / strengths / weaknesses ───────────────────────────────────
  const skillProfile = (aiProfile != null && Array.isArray(aiProfile.skillProfile))
    ? aiProfile.skillProfile
    : [];

  const strengths = (aiProfile != null && Array.isArray(aiProfile.strengths))
    ? aiProfile.strengths
    : [];

  const weaknesses = (aiProfile != null && Array.isArray(aiProfile.weaknesses))
    ? aiProfile.weaknesses
    : [];

  // ─── lastAnalyzedAt ──────────────────────────────────────────────────────────
  // Most recent of Resume.updatedAt and AIStudentProfile.updatedAt
  let lastAnalyzedAt = null;
  const resumeUpdated = latestResume?.updatedAt ?? null;
  const profileUpdated = aiProfile?.updatedAt ?? null;

  if (resumeUpdated != null && profileUpdated != null) {
    lastAnalyzedAt = resumeUpdated > profileUpdated ? resumeUpdated : profileUpdated;
  } else if (resumeUpdated != null) {
    lastAnalyzedAt = resumeUpdated;
  } else if (profileUpdated != null) {
    lastAnalyzedAt = profileUpdated;
  }

  // ─── resumeUploaded ──────────────────────────────────────────────────────────
  // True when a Resume document with parsedText exists, OR User.resumeUploaded is true
  const resumeHasParsedText =
    latestResume != null &&
    typeof latestResume.parsedText === 'string' &&
    latestResume.parsedText.length > 0;

  const resumeUploaded = resumeHasParsedText || (user?.resumeUploaded === true);

  // ─── hasAIProfile ────────────────────────────────────────────────────────────
  const hasAIProfile = hasCompletedAnalysis(aiProfile);

  // ─── dataStatus ──────────────────────────────────────────────────────────────
  // no_resume  → no parsed resume exists
  // pending    → user.resumeUploaded is true but parsedText is absent/empty
  // partial    → resume parsed but no AI profile or employability score
  // complete   → resume parsed AND AI profile exists AND employabilityScore is not null
  let dataStatus;
  if (!resumeHasParsedText && !(user?.resumeUploaded === true)) {
    dataStatus = 'no_resume';
  } else if (!resumeHasParsedText && user?.resumeUploaded === true) {
    dataStatus = 'pending';
  } else if (!hasAIProfile || employabilityScore == null) {
    dataStatus = 'partial';
  } else {
    dataStatus = 'complete';
  }

  res.json({
    success: true,
    data: {
      atsScore,
      employabilityScore,
      internshipReadinessScore,
      aiConfidenceScore,
      careerDomain,
      profileCompletionPercentage,
      skillProfile,
      strengths,
      weaknesses,
      lastAnalyzedAt,
      resumeUploaded,
      hasAIProfile,
      dataStatus,
    },
  });
});

module.exports = { getStudentMetrics };
