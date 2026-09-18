const asyncHandler = require('express-async-handler');
const Resume = require('../models/Resume');
const Internship = require('../models/Internship');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const path = require('path');
const fs = require('fs');
const { extractResumeText } = require('../utils/parseResume');
const { calculateATSScore, generateSuggestions, extractResumeInfo } = require('../utils/atsScoring');
const cloudinary = require('../config/cloudinary');
const { deleteCloudinaryAsset } = require('../utils/cloudinaryCleanup');
const { releaseCloudinaryAsset } = require('../utils/cloudinaryUpload');
const { incrementUsage } = require('../middleware/subscriptionMiddleware');
const aiClient = require('../services/aiServiceClient');
const { runAIPipelineForUser } = require('./aiController');

const mapAiToScoreData = (aiAts, parsedText) => ({
  score: Math.round(aiAts.ats_score || 0),
  matched: aiAts.matched_skills || [],
  missing: aiAts.missing_skills || [],
  breakdown: aiAts.breakdown || {
    technical: 0,
    softSkills: 0,
    experience: 0,
    education: 0,
    completeness: 0,
    formatting: 0,
    contact: 0,
  },
  sections: aiAts.sections || {},
  wordCount: parsedText.split(/\s+/).filter(Boolean).length,
});

// @desc    Upload resume and analyze with ATS
// @route   POST /api/resume/upload
// @access  Private  (checkResumeAccess middleware runs before this)
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a file');
  }

  // ── OWNERSHIP: always bind to the authenticated user. Never trust body/query. ──
  const authenticatedUserId = (req.user._id || req.user.id).toString();

  try {
    let parsedText = '';
    try {
      parsedText = await extractResumeText(req.file.path, req.file.mimetype);
    } catch (extractError) {
      res.status(400);
      throw new Error(`Unable to parse resume file: ${extractError.message}`);
    }

    if (!parsedText || parsedText.trim().length < 10) {
      res.status(400);
      throw new Error('Resume is too short or could not be parsed.');
    }

    // Capture previous resume URL BEFORE uploading the new one
    const previousResume = await Resume.findOne({ user: authenticatedUserId })
      .sort({ createdAt: -1 })
      .select('fileUrl user');

    // ── OWNERSHIP GUARD on existing resume (belt-and-suspenders) ──────────────
    if (previousResume && previousResume.user.toString() !== authenticatedUserId) {
      res.status(403);
      throw new Error('You can only analyze your own resume.');
    }

    const oldResumeUrl = previousResume?.fileUrl || null;

    let uploadResult;
    try {
      uploadResult = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'auto',
        folder: 'resumes',
      });
    } catch (uploadError) {
      res.status(500);
      throw new Error(`Cloudinary upload failed: ${uploadError.message}`);
    }

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const secureUrl = uploadResult.secure_url;
    const jobDesc =
      req.body.jobDescription?.trim() ||
      'software engineer internship requiring technical skills programming projects';

    let scoreData;
    let suggestions = [];
    let aiAnalysis = null;
    let matchPercentage = 0;
    let aiConfidenceScore = 70;

    try {
      const aiAts = await aiClient.analyzeATS(parsedText, jobDesc);
      scoreData = mapAiToScoreData(aiAts, parsedText);
      suggestions = aiAts.improvement_tips || [];
      aiAnalysis = aiAts;
      matchPercentage = aiAts.match_percentage || scoreData.score;
      aiConfidenceScore = aiAts.ai_confidence_score || 75;
    } catch (aiErr) {
      console.warn('[ATS] AI analyze failed, using JS fallback:', aiErr.message);
      scoreData = calculateATSScore(parsedText, jobDesc.split(/\s+/));
      suggestions = generateSuggestions(scoreData);
      matchPercentage = scoreData.score;
    }

    if (suggestions.length === 0) {
      suggestions = generateSuggestions(scoreData);
    }

    const resumeInfo = extractResumeInfo(parsedText);

    const user = await User.findById(authenticatedUserId).select('name email');
    console.log('Resume upload info:', {
      userName: user.name,
      userEmail: user.email,
      resumeName: resumeInfo.name,
      resumeEmail: resumeInfo.email,
    });

    if (resumeInfo.skills?.length) {
      await User.findByIdAndUpdate(authenticatedUserId, {
        $addToSet: { skills: { $each: resumeInfo.skills } },
      });
    }

    // ── Create Resume record — always owned by the authenticated user ──────────
    const resume = await Resume.create({
      user: authenticatedUserId,       // NEVER from req.body
      fileName: req.file.originalname,
      fileUrl: secureUrl,
      parsedText,
      atsScore: scoreData.score,
      keywordsMatched: scoreData.matched.slice(0, 20),
      missingKeywords: scoreData.missing,
      breakdown: scoreData.breakdown,
      sections: scoreData.sections,
      suggestions,
      extractedSkills: resumeInfo.skills,
      wordCount: scoreData.wordCount,
      aiAnalysis,
      matchPercentage,
      aiConfidenceScore,
    });

    await User.findByIdAndUpdate(authenticatedUserId, {
      resumeUploaded: true,
      atsScore: scoreData.score,
    });

    await ActivityLog.create({
      user: authenticatedUserId,
      action: 'Uploaded Resume',
      details: { fileName: req.file.originalname, score: scoreData.score },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // ── Increment usage AFTER successful DB write ─────────────────────────────
    const isSubscribed = req.resumeAccess?.isSubscribed ?? false;
    await incrementUsage(authenticatedUserId, isSubscribed);

    runAIPipelineForUser(authenticatedUserId, parsedText, req).catch((e) =>
      console.warn('AI pipeline:', e.message)
    );

    // Release the old resume from Cloudinary AFTER all DB writes succeeded
    if (oldResumeUrl && oldResumeUrl !== secureUrl) {
      await releaseCloudinaryAsset(oldResumeUrl);
    }

    // ── Include updated usage in the response so the frontend can update UI ───
    const usageAfter = req.resumeAccess?.usage
      ? {
          freeUsed:  isSubscribed ? req.resumeAccess.freeUsed : req.resumeAccess.freeUsed + 1,
          freeLimit: req.resumeAccess.freeLimit,
          isSubscribed,
        }
      : null;

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and analyzed successfully',
      resumeId: resume._id,
      resumeUploaded: true,
      atsScore: scoreData.score,
      overallScore: scoreData.score,
      technical: scoreData.breakdown.technical,
      softSkills: scoreData.breakdown.softSkills,
      experience: scoreData.breakdown.experience,
      education: scoreData.breakdown.education,
      formatting: scoreData.breakdown.formatting,
      contact: scoreData.breakdown.contact,
      completeness: scoreData.breakdown.completeness,
      score: scoreData.score,
      breakdown: scoreData.breakdown,
      suggestions,
      matchedKeywords: scoreData.matched.slice(0, 15),
      missingKeywords: scoreData.missing.slice(0, 10),
      sections: scoreData.sections,
      contactInfo: {
        email: resumeInfo.email,
        phone: resumeInfo.phone,
        linkedin: resumeInfo.linkedin,
        github: resumeInfo.github,
      },
      extractedSkills: resumeInfo.skills.slice(0, 20),
      wordCount: scoreData.wordCount,
      fileName: req.file.originalname,
      fileUrl: secureUrl,
      secure_url: secureUrl,
      matchPercentage,
      aiConfidenceScore,
      usage: usageAfter,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});

// @desc    Get latest resume score
// @route   GET /api/resume/score
// @access  Private
const getResumeScore = asyncHandler(async (req, res) => {
  // Only return THIS user's resume — ownership enforced by query filter
  const resume = await Resume.findOne({ user: req.user.id }).sort({ createdAt: -1 });

  if (resume) {
    res.json({
      success: true,
      resumeId: resume._id,
      resumeUploaded: true,
      atsScore: resume.atsScore,
      overallScore: resume.atsScore,
      technical: resume.breakdown?.technical ?? 0,
      softSkills: resume.breakdown?.softSkills ?? 0,
      experience: resume.breakdown?.experience ?? 0,
      education: resume.breakdown?.education ?? 0,
      formatting: resume.breakdown?.formatting ?? 0,
      contact: resume.breakdown?.contact ?? 0,
      completeness: resume.breakdown?.completeness ?? 0,
      score: resume.atsScore,
      breakdown: resume.breakdown,
      suggestions: resume.suggestions,
      matchedKeywords: resume.keywordsMatched?.slice(0, 15) || [],
      missingKeywords: resume.missingKeywords?.slice(0, 10) || [],
      sections: resume.sections,
      extractedSkills: resume.extractedSkills,
      wordCount: resume.wordCount,
      fileName: resume.fileName,
      uploadedAt: resume.createdAt,
      matchPercentage: resume.matchPercentage,
      aiConfidenceScore: resume.aiConfidenceScore,
      aiAnalysis: resume.aiAnalysis,
    });
  } else {
    res.json({
      success: true,
      resumeUploaded: false,
      atsScore: 0,
      score: 0,
      message: 'No resume uploaded yet',
      breakdown: {},
      suggestions: [],
      sections: {},
    });
  }
});

// @desc    Get resume usage (free checks used, limit, subscription status)
// @route   GET /api/resume/usage
// @access  Private
const getResumeUsage = asyncHandler(async (req, res) => {
  const { getOrCreateUsage, getActiveSubscription } = require('../middleware/subscriptionMiddleware');
  const userId = req.user._id || req.user.id;

  const [usage, activeSub] = await Promise.all([
    getOrCreateUsage(userId),
    getActiveSubscription(userId),
  ]);

  res.json({
    success: true,
    freeUsed:     usage.freeUsed,
    freeLimit:    usage.freeLimit,
    premiumUsed:  usage.premiumUsed,
    isSubscribed: !!activeSub,
    subscription: activeSub
      ? {
          planName:  activeSub.planSnapshot?.name || activeSub.planId?.name || 'Pro',
          status:    activeSub.status,
          expiresAt: activeSub.expiresAt,
          features:  activeSub.planId?.features || activeSub.planSnapshot?.features || {},
        }
      : null,
  });
});

// @desc    Delete resume
// @route   DELETE /api/resume/:resumeId
// @access  Private
const deleteResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.resumeId);

  if (!resume) {
    res.status(404);
    throw new Error('Resume not found');
  }

  if (resume.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized');
  }

  // Release the Cloudinary asset safely (checks refcount before deleting)
  if (resume.fileUrl) {
    if (/res\.cloudinary\.com/i.test(String(resume.fileUrl))) {
      await releaseCloudinaryAsset(resume.fileUrl);
    } else if (!resume.fileUrl.startsWith('http')) {
      const filePath = path.join(__dirname, '../uploads/', resume.fileName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }

  await Resume.findByIdAndDelete(req.params.resumeId);

  await ActivityLog.create({
    user: req.user.id,
    action: 'Deleted Resume',
    details: { fileName: resume.fileName },
  });

  res.json({
    success: true,
    message: 'Resume deleted successfully',
  });
});

module.exports = {
  uploadResume,
  getResumeScore,
  getResumeUsage,
  deleteResume,
};
