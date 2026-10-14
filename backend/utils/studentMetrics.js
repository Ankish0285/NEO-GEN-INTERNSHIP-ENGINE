/** Canonical student metric selection from persisted AI analysis. No fabricated fallbacks. */

const isPresentNumber = (value) => typeof value === 'number' && !Number.isNaN(value);

const hasCompletedAnalysis = (aiProfile) =>
  aiProfile != null && (aiProfile.lastAnalyzedAt != null || aiProfile.rawAnalysis != null);

/**
 * Schema defaults of 0 are not genuine scores. A numeric 0 is only returned when
 * analysis has actually completed (or resume/ATS scoring wrote a real value).
 */
const pickAnalyzedScore = (aiProfile, field) => {
  if (!hasCompletedAnalysis(aiProfile)) return null;
  const value = aiProfile[field];
  return isPresentNumber(value) ? value : null;
};

const pickAtsScore = ({ latestResume, user, aiProfile }) => {
  if (hasCompletedAnalysis(aiProfile) && isPresentNumber(aiProfile.latestAtsScore)) {
    return aiProfile.latestAtsScore;
  }
  if (latestResume != null && isPresentNumber(latestResume.atsScore)) {
    if (latestResume.aiAnalysis != null || hasCompletedAnalysis(aiProfile)) {
      return latestResume.atsScore;
    }
    // Upload-time JS/AI ATS is a real pipeline result when parsed text exists
    // and the document was scored (not a leftover schema default on an empty resume).
    if (
      typeof latestResume.parsedText === 'string' &&
      latestResume.parsedText.length > 0 &&
      (latestResume.keywordsMatched?.length > 0 ||
        latestResume.suggestions?.length > 0 ||
        latestResume.wordCount > 0)
    ) {
      return latestResume.atsScore;
    }
  }
  if (user != null && isPresentNumber(user.atsScore) && user.resumeUploaded === true) {
    if (hasCompletedAnalysis(aiProfile) || (latestResume && latestResume.parsedText)) {
      return user.atsScore;
    }
  }
  return null;
};

const mapAtsBreakdown = (breakdown) => {
  if (!breakdown || typeof breakdown !== 'object') return null;
  return {
    technical: breakdown.technical ?? 0,
    softSkills: breakdown.softSkills ?? breakdown.soft_skills ?? 0,
    experience: breakdown.experience ?? 0,
    education: breakdown.education ?? 0,
    completeness: breakdown.completeness ?? 0,
    formatting: breakdown.formatting ?? 0,
    contact: breakdown.contact ?? 0,
  };
};

const buildAIProfileSet = (pipeline, user, existing) => {
  const profile = pipeline.profile;
  const $set = {
    lastAnalyzedAt: new Date(),
    rawAnalysis: pipeline,
  };

  if (Array.isArray(profile.skill_profile)) $set.skillProfile = profile.skill_profile;
  if (Array.isArray(profile.soft_skills)) $set.softSkills = profile.soft_skills;
  if (profile.career_domain != null) $set.careerDomain = profile.career_domain;
  if (Array.isArray(profile.strengths)) $set.strengths = profile.strengths;
  if (Array.isArray(profile.weaknesses)) $set.weaknesses = profile.weaknesses;
  if (typeof profile.profile_summary === 'string') $set.profileSummary = profile.profile_summary;
  if (profile.growth_analysis && typeof profile.growth_analysis === 'object') {
    $set.growthAnalysis = profile.growth_analysis;
  }
  if (Array.isArray(profile.future_technologies)) $set.futureTechnologies = profile.future_technologies;
  if (Array.isArray(profile.recommended_career_path)) {
    $set.recommendedCareerPath = profile.recommended_career_path;
  }
  if (Array.isArray(profile.learning_roadmap)) $set.learningRoadmap = profile.learning_roadmap;

  if (isPresentNumber(profile.employability_score)) {
    $set.employabilityScore = profile.employability_score;
  }
  if (isPresentNumber(profile.internship_readiness_score)) {
    $set.internshipReadinessScore = profile.internship_readiness_score;
  }

  const atsScore = pipeline.ats?.ats_score;
  if (isPresentNumber(atsScore)) $set.latestAtsScore = atsScore;
  if (isPresentNumber(pipeline.ats?.match_percentage)) {
    $set.latestMatchPercentage = pipeline.ats.match_percentage;
  }
  if (isPresentNumber(pipeline.ats?.ai_confidence_score)) {
    $set.aiConfidenceScore = pipeline.ats.ai_confidence_score;
  }

  const interests = user?.interests || existing?.interests;
  if (Array.isArray(interests)) $set.interests = interests;

  const atsHistory = [...(existing?.atsHistory || [])];
  if (isPresentNumber(atsScore) && atsScore > 0) {
    atsHistory.push({ score: atsScore, at: new Date() });
    if (atsHistory.length > 20) atsHistory.shift();
    $set.atsHistory = atsHistory;
  }

  const recHistory = [...(existing?.recommendationHistory || [])];
  (pipeline.recommendations || []).slice(0, 5).forEach((r) => {
    recHistory.push({
      internshipId: r.internship_id,
      title: r.title,
      matchPercentage: r.match_percentage,
      at: new Date(),
    });
  });
  if (recHistory.length > 30) recHistory.splice(0, recHistory.length - 30);
  if (pipeline.recommendations) $set.recommendationHistory = recHistory;

  return $set;
};

const buildResumeSyncSet = (pipeline) => {
  const ats = pipeline?.ats;
  if (!ats || typeof ats !== 'object') return {};
  const $set = {};
  if (isPresentNumber(ats.ats_score)) $set.atsScore = ats.ats_score;
  if (isPresentNumber(ats.match_percentage)) $set.matchPercentage = ats.match_percentage;
  if (isPresentNumber(ats.ai_confidence_score)) $set.aiConfidenceScore = ats.ai_confidence_score;
  const breakdown = mapAtsBreakdown(ats.breakdown);
  if (breakdown) $set.breakdown = breakdown;
  if (Array.isArray(ats.matched_skills)) $set.keywordsMatched = ats.matched_skills.slice(0, 20);
  if (Array.isArray(ats.missing_skills)) $set.missingKeywords = ats.missing_skills;
  if (Array.isArray(ats.improvement_tips)) $set.suggestions = ats.improvement_tips;
  $set.aiAnalysis = ats;
  return $set;
};

const buildCoachIntelligence = (profile, resume, user) => {
  const raw = profile?.rawAnalysis && typeof profile.rawAnalysis === 'object'
    ? profile.rawAnalysis
    : {};
  const ats = { ...(raw.ats || {}) };
  const studentProfile = { ...(raw.profile || {}) };

  if (isPresentNumber(profile?.latestAtsScore) && ats.ats_score == null) {
    ats.ats_score = profile.latestAtsScore;
  }
  if (isPresentNumber(resume?.atsScore) && ats.ats_score == null) {
    ats.ats_score = resume.atsScore;
  }
  if (isPresentNumber(user?.atsScore) && ats.ats_score == null && hasCompletedAnalysis(profile)) {
    ats.ats_score = user.atsScore;
  }
  if (isPresentNumber(profile?.aiConfidenceScore) && ats.ai_confidence_score == null) {
    ats.ai_confidence_score = profile.aiConfidenceScore;
  }

  if (isPresentNumber(profile?.employabilityScore) && studentProfile.employability_score == null) {
    studentProfile.employability_score = profile.employabilityScore;
  }
  if (
    isPresentNumber(profile?.internshipReadinessScore) &&
    studentProfile.internship_readiness_score == null
  ) {
    studentProfile.internship_readiness_score = profile.internshipReadinessScore;
  }
  if (profile?.careerDomain && !studentProfile.career_domain) {
    studentProfile.career_domain = profile.careerDomain;
  }
  if (Array.isArray(profile?.skillProfile) && !studentProfile.skill_profile?.length) {
    studentProfile.skill_profile = profile.skillProfile;
  }
  if (Array.isArray(profile?.learningRoadmap) && !studentProfile.learning_roadmap?.length) {
    studentProfile.learning_roadmap = profile.learningRoadmap;
  }

  return {
    ...raw,
    ats,
    profile: studentProfile,
    recommendations: raw.recommendations || [],
    recommendation_groups: raw.recommendation_groups || {},
  };
};

module.exports = {
  isPresentNumber,
  hasCompletedAnalysis,
  pickAnalyzedScore,
  pickAtsScore,
  mapAtsBreakdown,
  buildAIProfileSet,
  buildResumeSyncSet,
  buildCoachIntelligence,
};
