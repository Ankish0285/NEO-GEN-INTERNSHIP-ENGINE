const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Application = require('../models/Application');
const Internship = require('../models/Internship');
const ActivityLog = require('../models/ActivityLog');
const Resume = require('../models/Resume');

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const totalApplications = await Application.countDocuments({ student: userId });
  const pendingReviews = await Application.countDocuments({ student: userId, status: 'Applied' });
  const accepted = await Application.countDocuments({ student: userId, status: 'Accepted' });

  // Get latest resume score
  const latestResume = await Resume.findOne({ user: userId }).sort({ createdAt: -1 });
  const atsScore = latestResume ? latestResume.atsScore : 0;

  // Advanced Recommendation Algorithm
  const user = await User.findById(userId);
  let recommendedInternships = [];

  // Fetch all active internships
  const allInternships = await Internship.find({ status: 'active' }).lean();

  if (allInternships.length === 0) {
    return res.json({
      totalApplications,
      pendingReviews,
      accepted,
      atsScore,
      recommendedInternships: []
    });
  }

  // Combine user profile skills and resume extracted skills
  let userSkills = user.skills || [];
  if (latestResume && latestResume.extractedSkills) {
    // Add resume skills that aren't in profile
    const currentSkillsLower = new Set(userSkills.map(s => s.toLowerCase()));
    latestResume.extractedSkills.forEach(s => {
      if (!currentSkillsLower.has(s.toLowerCase())) {
        userSkills.push(s);
      }
    });
  }
  const userSkillsLower = userSkills.map(s => s.toLowerCase());

  // Calculate sophisticated match scores for each internship
  recommendedInternships = allInternships.map(internship => {
    let matchScore = 0;
    let matchReasons = [];

    // 1. Skills Match (45% weight)
    let skillScore = 0;
    if (userSkillsLower.length > 0 && internship.fields && internship.fields.length > 0) {
      const internshipFieldsLower = internship.fields.map(f => f.toLowerCase());

      // Check for partial matches too
      const matchingSkills = internshipFieldsLower.filter(field =>
        userSkillsLower.some(us => us.includes(field) || field.includes(us))
      );

      skillScore = (matchingSkills.length / internship.fields.length) * 100;
      if (matchingSkills.length > 0) {
        matchReasons.push(`${matchingSkills.length} skill match${matchingSkills.length > 1 ? 'es' : ''}`);
      }
    }
    matchScore += skillScore * 0.45;

    // 2. Location Preference (15% weight)
    let locationScore = 60; // Default neutral score
    if (user.preferredLocation && internship.location) {
      const userLocationLower = user.preferredLocation.toLowerCase();
      const internshipLocationLower = internship.location.toLowerCase();

      if (internshipLocationLower.includes(userLocationLower) || userLocationLower.includes(internshipLocationLower)) {
        locationScore = 100;
        matchReasons.push('Location match');
      } else if (internshipLocationLower.includes('remote') || internshipLocationLower.includes('work from home')) {
        locationScore = 90;
        matchReasons.push('Remote option');
      }
    }
    matchScore += locationScore * 0.15;

    // 3. Eligibility Match (20% weight) - Check if user's course/education matches
    let eligibilityScore = 70; // Default neutral
    if (internship.eligibility && user.course) {
      const eligibilityLower = internship.eligibility.toLowerCase();
      const courseLower = user.course.toLowerCase();

      if (eligibilityLower.includes(courseLower) || courseLower.includes('engineering') && eligibilityLower.includes('engineering')) {
        eligibilityScore = 100;
        matchReasons.push('Eligibility match');
      }
    }
    matchScore += eligibilityScore * 0.2;

    // 4. Deadline Urgency (10% weight) - Boost recent postings and urgent deadlines
    let urgencyScore = 50;
    const now = new Date();
    const deadline = new Date(internship.deadline);
    const daysUntilDeadline = Math.floor((deadline - now) / (1000 * 60 * 60 * 24));

    if (daysUntilDeadline > 0 && daysUntilDeadline <= 7) {
      urgencyScore = 100;
      matchReasons.push('Deadline soon');
    } else if (daysUntilDeadline > 7 && daysUntilDeadline <= 30) {
      urgencyScore = 80;
    } else if (daysUntilDeadline > 30) {
      urgencyScore = 60;
    }
    matchScore += urgencyScore * 0.1;

    // 5. ATS Score Compatibility (15% weight) - Match internships to user's profile strength
    let atsCompatibility = 70;
    if (atsScore >= 70) {
      // High ATS score users get matched with competitive internships (longer descriptions, reputed orgs)
      if (internship.description && internship.description.length > 200) {
        atsCompatibility = 90;
      }
    } else if (atsScore < 50) {
      // Lower ATS score users get matched with more accessible opportunities
      if (internship.eligibility && internship.eligibility.toLowerCase().includes('all')) {
        atsCompatibility = 85;
        matchReasons.push('Great for beginners');
      }
    }
    matchScore += atsCompatibility * 0.15;

    // Normalize and cap at 100
    matchScore = Math.min(Math.round(matchScore), 100);

    // Boost score slightly for perfect matches
    if (matchReasons.length >= 3) {
      matchScore = Math.min(matchScore + 5, 100);
    }

    return {
      ...internship,
      matchScore,
      matchReasons,
      id: internship._id,
      daysUntilDeadline: Math.max(0, Math.floor((new Date(internship.deadline) - now) / (1000 * 60 * 60 * 24)))
    };
  });

  // Sort by match score descending and take top 6
  recommendedInternships = recommendedInternships
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);

  res.json({
    totalApplications,
    pendingReviews,
    accepted,
    atsScore,
    recommendedInternships
  });
});

// @desc    Get recent activity
// @route   GET /api/dashboard/activity
// @access  Private
const getRecentActivity = asyncHandler(async (req, res) => {
  const activity = await ActivityLog.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(10);
  res.json(activity);
});

// @desc    Get admin dashboard summary
// @route   GET /api/dashboard/admin-summary
// @access  Private/Admin
const getAdminDashboardSummary = asyncHandler(async (req, res) => {
  const totalStudents = await User.countDocuments({ role: 'student' });
  const totalInternships = await Internship.countDocuments();
  const totalApplications = await Application.countDocuments();

  // Recent applications
  const recentApplications = await Application.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('student', 'name email')
    .populate('internship', 'title organization');

  // Recent activity (system wide)
  const recentActivity = await ActivityLog.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('user', 'name role');

  res.json({
    totalStudents,
    totalInternships,
    totalApplications,
    recentApplications,
    recentActivity
  });
});

module.exports = {
  getDashboardSummary,
  getRecentActivity,
  getAdminDashboardSummary
};
