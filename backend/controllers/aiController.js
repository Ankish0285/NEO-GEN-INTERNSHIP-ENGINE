const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Resume = require('../models/Resume');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const AIStudentProfile = require('../models/AIStudentProfile');
const aiClient = require('../services/aiServiceClient');
const { calculateATSScore, generateSuggestions, extractResumeInfo } = require('../utils/atsScoring');
const { emitAIUpdate } = require('../utils/aiSocket');

const mapInternshipForAI = (doc) => ({
  _id: doc._id,
  id: doc._id,
  title: doc.title,
  organization: doc.organization,
  company: doc.organization,
  department: doc.department,
  location: doc.location,
  stipend: doc.stipend,
  duration: doc.duration,
  description: doc.description,
  eligibility: doc.eligibility,
  skills: doc.skills || [],
  deadline: doc.deadline,
});

const getApplicationsContext = async (userId) => {
  const apps = await Application.find({ student: userId })
    .populate('internship', 'title organization')
    .lean();
  return apps.map((a) => ({
    internshipId: a.internship?._id?.toString(),
    status: a.status,
    title: a.internship?.title,
  }));
};

const buildMemoryFromProfile = (profile, user) => ({
  interests: profile?.interests?.length ? profile.interests : user?.interests || [],
  past_ats_scores: (profile?.atsHistory || []).map((h) => h.score),
  preferences: profile?.preferences || {},
  past_recommendations: (profile?.recommendationHistory || []).slice(-10).map((r) => r.internshipId),
});

const persistAIProfile = async (userId, pipeline, user) => {
  if (!pipeline?.profile) return null;
  const existing = await AIStudentProfile.findOne({ user: userId });
  const atsScore = pipeline.ats?.ats_score || 0;
  const atsHistory = [...(existing?.atsHistory || [])];
  if (atsScore > 0) {
    atsHistory.push({ score: atsScore, at: new Date() });
    if (atsHistory.length > 20) atsHistory.shift();
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

  return AIStudentProfile.findOneAndUpdate(
    { user: userId },
    {
      user: userId,
      skillProfile: pipeline.profile.skill_profile || [],
      softSkills: pipeline.profile.soft_skills || [],
      careerDomain: pipeline.profile.career_domain,
      strengths: pipeline.profile.strengths || [],
      weaknesses: pipeline.profile.weaknesses || [],
      employabilityScore: pipeline.profile.employability_score || 0,
      internshipReadinessScore: pipeline.profile.internship_readiness_score || 0,
      profileSummary: pipeline.profile.profile_summary || '',
      growthAnalysis: pipeline.profile.growth_analysis || {},
      futureTechnologies: pipeline.profile.future_technologies || [],
      recommendedCareerPath: pipeline.profile.recommended_career_path || [],
      learningRoadmap: pipeline.profile.learning_roadmap || [],
      latestAtsScore: atsScore,
      latestMatchPercentage: pipeline.ats?.match_percentage || 0,
      aiConfidenceScore: pipeline.ats?.ai_confidence_score || 0,
      interests: user?.interests || existing?.interests || [],
      atsHistory,
      recommendationHistory: recHistory,
      lastAnalyzedAt: new Date(),
      rawAnalysis: pipeline,
    },
    { upsert: true, new: true }
  );
};

const runAIPipelineForUser = async (userId, resumeText, req = null) => {
  const user = await User.findById(userId).lean();
  const existingProfile = await AIStudentProfile.findOne({ user: userId }).lean();
  const applications = await getApplicationsContext(userId);
  const internships = await Internship.find({
    status: { $in: ['active', 'published'] },
  }).lean();

  let pipeline = null;
  const aiUp = await aiClient.isAvailable();

  if (aiUp && resumeText?.length >= 20) {
    pipeline = await aiClient.fullPipeline({
      resumeText,
      internships: internships.map(mapInternshipForAI),
      userData: {
        skills: user?.skills || [],
        course: user?.course,
        university: user?.university,
        preferredLocation: user?.preferredLocation,
        atsScore: user?.atsScore,
        interests: user?.interests || [],
        ats_history: buildMemoryFromProfile(existingProfile, user).past_ats_scores,
      },
      applications,
      memory: buildMemoryFromProfile(existingProfile, user),
      topK: 15,
    });
  }

  await persistAIProfile(userId, pipeline, user);

  if (req) {
    emitAIUpdate(req, userId, 'ai:analysis:complete', {
      atsScore: pipeline?.ats?.ats_score,
      sectionScores: pipeline?.ats?.section_detail,
      recommendationsCount: pipeline?.recommendations?.length || 0,
      profile: pipeline?.profile,
    });
    emitAIUpdate(req, userId, 'ai:recommendations:updated', {
      recommendations: pipeline?.recommendations || [],
      groups: pipeline?.recommendation_groups,
    });
  }

  return pipeline;
};

// @route GET /api/ai/status
const getAIStatus = asyncHandler(async (req, res) => {
  res.json({ success: true, aiServiceOnline: await aiClient.isAvailable() });
});

// @route GET /api/ai/profile
const getAIProfile = asyncHandler(async (req, res) => {
  const profile = await AIStudentProfile.findOne({ user: req.user.id });
  const resume = await Resume.findOne({ user: req.user.id }).sort({ createdAt: -1 });
  res.json({
    success: true,
    profile,
    hasResume: !!resume,
    latestResumeId: resume?._id,
    rawAnalysis: profile?.rawAnalysis,
  });
});

// @route GET /api/ai/intelligence
const getAIIntelligence = asyncHandler(async (req, res) => {
  const authenticatedUserId = (req.user._id || req.user.id).toString();
  const user = await User.findById(authenticatedUserId).lean();
  const profile = await AIStudentProfile.findOne({ user: authenticatedUserId }).lean();
  // Ownership: always query by authenticated user only
  const resume = await Resume.findOne({ user: authenticatedUserId }).sort({ createdAt: -1 });
  const applications = await getApplicationsContext(authenticatedUserId);
  const internships = await Internship.find({
    status: { $in: ['active', 'published'] },
  }).lean();

  if (!(await aiClient.isAvailable())) {
    res.status(503);
    throw new Error('AI service offline — start backend with npm start');
  }
  if (!resume?.parsedText) {
    res.status(400);
    throw new Error('Upload a resume first');
  }

  const data = await aiClient.getIntelligence({
    resumeText: resume.parsedText,
    internships: internships.map(mapInternshipForAI),
    userData: {
      skills: user?.skills || [],
      course: user?.course,
      interests: user?.interests || [],
      ats_history: buildMemoryFromProfile(profile, user).past_ats_scores,
    },
    applications,
    memory: buildMemoryFromProfile(profile, user),
    topK: 15,
  });

  await persistAIProfile(authenticatedUserId, data, user);

  // Increment usage AFTER successful analysis (mirrors analyzeResumeAI)
  const { incrementUsage } = require('../middleware/subscriptionMiddleware');
  const isSubscribed = req.resumeAccess?.isSubscribed ?? false;
  await incrementUsage(authenticatedUserId, isSubscribed);

  res.json({
    success: true,
    data: {
      ats: data.ats,
      profile: data.profile,
      recommendations: data.recommendations,
      groups: data.recommendation_groups,
      vectorIndex: data.vector_index,
    },
  });
});

// @route POST /api/ai/analyze
const analyzeResumeAI = asyncHandler(async (req, res) => {
  const { jobDescription } = req.body;
  const authenticatedUserId = (req.user._id || req.user.id).toString();

  // Ownership: always look up resume by the authenticated user only
  const resume = await Resume.findOne({ user: authenticatedUserId }).sort({ createdAt: -1 });
  if (!resume?.parsedText) {
    res.status(400);
    throw new Error('Upload a resume first');
  }

  // Belt-and-suspenders ownership check
  if (resume.user.toString() !== authenticatedUserId) {
    res.status(403);
    throw new Error('You can only analyze your own resume.');
  }

  let analysis;
  if (await aiClient.isAvailable()) {
    analysis = await aiClient.analyzeATS(resume.parsedText, jobDescription || '');
    const pipeline = await runAIPipelineForUser(authenticatedUserId, resume.parsedText, req);
    analysis.recommendations = pipeline?.recommendations;
    analysis.recommendation_groups = pipeline?.recommendation_groups;
    analysis.student_profile = pipeline?.profile;
    analysis.section_wise_scores = pipeline?.ats?.section_wise_scores;
    analysis.why_score_is_low = pipeline?.ats?.why_score_is_low;
  } else {
    const scoreData = calculateATSScore(resume.parsedText);
    analysis = {
      ats_score: scoreData.score,
      match_percentage: scoreData.score,
      breakdown: scoreData.breakdown,
      matched_skills: scoreData.matched,
      missing_skills: scoreData.missing,
      improvement_tips: generateSuggestions(scoreData),
      ai_confidence_score: 60,
    };
  }

  resume.aiAnalysis = analysis;
  resume.atsScore = analysis.ats_score || resume.atsScore;
  await resume.save();

  // Increment usage after successful analysis
  const { incrementUsage } = require('../middleware/subscriptionMiddleware');
  const isSubscribed = req.resumeAccess?.isSubscribed ?? false;
  await incrementUsage(authenticatedUserId, isSubscribed);

  res.json({ success: true, data: analysis });
});

// @route GET /api/ai/recommendations
const getAIRecommendations = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ user: req.user.id }).sort({ createdAt: -1 });
  const user = await User.findById(req.user.id).lean();
  const applications = await getApplicationsContext(req.user.id);
  const internships = await Internship.find({
    status: { $in: ['active', 'published'] },
  }).lean();

  let result;
  if (await aiClient.isAvailable() && resume?.parsedText) {
    result = await aiClient.getRecommendations({
      resumeText: resume.parsedText,
      internships: internships.map(mapInternshipForAI),
      userData: {
        skills: user.skills,
        course: user.course,
        preferredLocation: user.preferredLocation,
        atsScore: user.atsScore,
      },
      applications,
      topK: parseInt(req.query.limit || '12', 10),
    });
  } else {
    const fallbackSkills = resume?.extractedSkills?.length
      ? resume.extractedSkills
      : user.skills || [];
    const recs = internships
      .map((job) => {
        const jobSkills = job.skills || [];
        const matched = jobSkills.filter((s) =>
          fallbackSkills.some((us) => us.toLowerCase().includes(s.toLowerCase()))
        );
        const pct = jobSkills.length ? (matched.length / jobSkills.length) * 100 : 50;
        return {
          internship_id: job._id,
          title: job.title,
          company: job.organization,
          location: job.location,
          match_percentage: Math.round(pct),
          matched_skills: matched,
          missing_skills: jobSkills.filter((s) => !matched.includes(s)),
          ai_explanation: 'Skill-based match (AI service offline)',
        };
      })
      .sort((a, b) => b.match_percentage - a.match_percentage)
      .slice(0, 12);
    result = { recommendations: recs, count: recs.length };
  }

  const formatted = (result.recommendations || []).map((r) => ({
    id: r.internship_id,
    title: r.title,
    company: r.company || r.organization,
    location: r.location,
    stipend: r.stipend,
    duration: r.duration,
    description: r.description,
    matchScore: r.match_percentage,
    aiCompatibilityScore: r.ai_compatibility_score,
    selectionProbability: r.selection_probability,
    interviewProbability: r.interview_probability,
    hiringConfidence: r.hiring_confidence,
    selectionTier: r.selection_tier,
    matchedSkills: r.matched_skills,
    missingSkills: r.missing_skills,
    atsScore: r.ats_score,
    aiExplanation: r.ai_explanation,
    recommendedImprovements: r.recommended_improvements,
    skillGapCourses: r.skill_gap_courses,
    categoryTags: r.category_tags,
    type: 'Internship',
    postedAt: 'Recently',
  }));

  const mapGroup = (items) =>
    (items || []).map((r) => ({
      id: r.internship_id,
      title: r.title,
      company: r.company,
      matchScore: r.match_percentage,
      selectionProbability: r.selection_probability,
    }));

  res.json({
    success: true,
    count: formatted.length,
    recommendations: formatted,
    groups: {
      bestMatch: mapGroup(result.groups?.best_match),
      highestMatch: mapGroup(result.groups?.highest_match),
      easiestSelection: mapGroup(result.groups?.easiest_selection),
      skillBased: mapGroup(result.groups?.skill_based),
    },
    studentProfile: result.student_profile,
  });
});

// @route POST /api/ai/match/:internshipId
const matchSingleInternship = asyncHandler(async (req, res) => {
  const internship = await Internship.findById(req.params.internshipId);
  if (!internship) {
    res.status(404);
    throw new Error('Internship not found');
  }
  const resume = await Resume.findOne({ user: req.user.id }).sort({ createdAt: -1 });
  if (!resume?.parsedText) {
    res.status(400);
    throw new Error('Upload resume first');
  }

  let data;
  if (await aiClient.isAvailable()) {
    data = await aiClient.matchInternship(
      resume.parsedText,
      mapInternshipForAI(internship.toObject())
    );
  } else {
    const scoreData = calculateATSScore(
      resume.parsedText,
      (internship.skills || []).join(' ')
    );
    data = {
      ats_score: scoreData.score,
      matched_skills: scoreData.matched,
      missing_skills: scoreData.missing,
      breakdown: scoreData.breakdown,
    };
  }

  res.json({ success: true, data, internship: { id: internship._id, title: internship.title } });
});

// @route POST /api/ai/chat
const aiChat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const user = await User.findById(req.user.id);
  const profile = await AIStudentProfile.findOne({ user: req.user.id });
  const resume = await Resume.findOne({ user: req.user.id }).sort({ createdAt: -1 });

  let data;
  if (await aiClient.isAvailable()) {
    const intelligence = profile?.rawAnalysis;
    if (intelligence?.ats && resume?.parsedText) {
      data = await aiClient.chatWithIntelligence(message, intelligence);
    } else if (resume?.parsedText) {
      const pipeline = await runAIPipelineForUser(req.user.id, resume.parsedText);
      data = await aiClient.chatWithIntelligence(message, pipeline || {});
    } else {
      data = await aiClient.chat(message, {
        ats_score: profile?.latestAtsScore || user?.atsScore || 0,
        skills: profile?.skillProfile || user?.skills || [],
        career_domain: profile?.careerDomain?.label || 'technology',
      });
    }
  } else {
    data = {
      reply: 'AI assistant is starting up. Upload your resume and check Recommendations.',
      suggestions: ['Improve my ATS score', 'Find internships'],
    };
  }

  if (profile && message) {
    profile.chatHistory = [
      ...(profile.chatHistory || []).slice(-18),
      { role: 'user', message, at: new Date() },
      { role: 'assistant', message: data.reply, at: new Date() },
    ];
    await profile.save();
  }

  res.json({ success: true, data });
});

// @route GET /api/ai/admin/insights
const getAdminAIInsights = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    res.status(403);
    throw new Error('Admin only');
  }

  const [profiles, resumes, internships, applications] = await Promise.all([
    AIStudentProfile.find().lean(),
    Resume.find().sort({ createdAt: -1 }).limit(200).lean(),
    Internship.find().lean(),
    Application.find().lean(),
  ]);

  const skillFreq = {};
  profiles.forEach((p) => {
    (p.skillProfile || []).forEach((s) => {
      skillFreq[s] = (skillFreq[s] || 0) + 1;
    });
  });
  const topSkills = Object.entries(skillFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([skill, count]) => ({ skill, count }));

  const avgAts =
    resumes.length > 0
      ? Math.round(resumes.reduce((s, r) => s + (r.atsScore || 0), 0) / resumes.length)
      : 0;

  const domainFreq = {};
  profiles.forEach((p) => {
    const d = p.careerDomain?.domain || 'unknown';
    domainFreq[d] = (domainFreq[d] || 0) + 1;
  });

  const techDemand = {};
  internships.forEach((job) => {
    (job.skills || []).forEach((s) => {
      techDemand[s] = (techDemand[s] || 0) + 1;
    });
  });
  const topTechnologies = Object.entries(techDemand)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([tech, count]) => ({ tech, count }));

  const avgReadiness =
    profiles.length > 0
      ? Math.round(
          profiles.reduce((s, p) => s + (p.internshipReadinessScore || 0), 0) / profiles.length
        )
      : 0;

  const recCount = profiles.reduce(
    (s, p) => s + (p.recommendationHistory?.length || 0),
    0
  );

  res.json({
    success: true,
    insights: {
      totalAIProfiles: profiles.length,
      averageAtsScore: avgAts,
      averageReadinessScore: avgReadiness,
      topDemandedSkills: topSkills,
      topDemandedTechnologies: topTechnologies,
      careerDomainDistribution: domainFreq,
      totalInternships: internships.length,
      totalApplications: applications.length,
      aiRecommendationEvents: recCount,
      hiringTrend: {
        activeInternships: internships.filter((i) =>
          ['active', 'published'].includes(i.status)
        ).length,
        acceptanceRate:
          applications.length > 0
            ? Math.round(
                (applications.filter((a) => a.status === 'Accepted').length /
                  applications.length) *
                  100
              )
            : 0,
      },
      studentPerformance: {
        avgEmployability:
          profiles.length > 0
            ? Math.round(
                profiles.reduce((s, p) => s + (p.employabilityScore || 0), 0) /
                  profiles.length
              )
            : 0,
        improvingProfiles: profiles.filter(
          (p) => p.growthAnalysis?.trend === 'improving'
        ).length,
      },
      topStudents: profiles
        .sort((a, b) => (b.employabilityScore || 0) - (a.employabilityScore || 0))
        .slice(0, 5)
        .map((p) => ({
          userId: p.user,
          employabilityScore: p.employabilityScore,
          readiness: p.internshipReadinessScore,
          domain: p.careerDomain?.label,
          ats: p.latestAtsScore,
        })),
    },
  });
});

module.exports = {
  getAIStatus,
  getAIProfile,
  getAIIntelligence,
  analyzeResumeAI,
  getAIRecommendations,
  matchSingleInternship,
  aiChat,
  getAdminAIInsights,
  runAIPipelineForUser,
};
