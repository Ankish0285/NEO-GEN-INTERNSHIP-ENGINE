const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const Internship = require('../models/Internship');
const { createAndNotify } = require('../utils/notificationHelper');
const Resume = require('../models/Resume');
const User = require('../models/User');
const { isHttpUrl, fixLocalResumeHttpUrl, isCloudinaryUrl } = require('../utils/resumeUrl');
const { attachResolvedResumeUrls } = require('../utils/attachApplicationResumeUrls');
const aiClient = require('../services/aiServiceClient');
const { calculateATSScore } = require('../utils/atsScoring');

const scoreFromResumeText = async (resumeText, jobDescription) => {
  if (!resumeText || resumeText.length < 20) return { ats_score: 0 };
  try {
    const ai = await aiClient.analyzeATS(resumeText, jobDescription);
    return { ats_score: ai.ats_score || 0 };
  } catch {
    const fallback = calculateATSScore(resumeText);
    return { ats_score: fallback.score || 0 };
  }
};

// @desc    Get all applications (Admin)
// @route   GET /api/applications
// @access  Private/Admin
const getApplications = asyncHandler(async (req, res) => {
  const { internshipId } = req.query;

  let query = {};
  if (internshipId) {
    query.internship = internshipId;
  }

  const applications = await Application.find(query)
    .populate('student', 'name email profilePicture isBlocked partnerInfo')
    .populate('internship', 'title organization createdBy')
    .sort({ createdAt: -1 })
    .lean();

  await attachResolvedResumeUrls(applications);
  res.status(200).json(applications);
});

// @desc    Create new application (Student)
// @route   POST /api/applications
// @access  Private/Student
const createApplication = asyncHandler(async (req, res) => {
  const { internshipId, coverLetter, form } = req.body;

  if (!internshipId) {
    res.status(400);
    throw new Error('Internship ID is required');
  }

  // Check if internship exists and is active
  const internship = await Internship.findById(internshipId);
  if (!internship) {
    res.status(404);
    throw new Error('Internship not found');
  }

  if (internship.status !== 'active') {
    res.status(400);
    throw new Error('This internship is no longer accepting applications');
  }

  // Check if already applied
  const existingApplication = await Application.findOne({
    student: req.user.id,
    internship: internshipId,
  });

  if (existingApplication) {
    res.status(400);
    throw new Error('You have already applied to this internship');
  }

  // If a structured form is provided, validate basic fields
  const details = form ? {
    fullName: String(form.fullName || '').trim(),
    email: String(form.email || '').trim().toLowerCase(),
    phone: String(form.phone || '').trim(),
    college: String(form.college || '').trim(),
    course: String(form.course || '').trim(),
    year: String(form.year || '').trim(),
    gpa: String(form.gpa || '').trim(),
    skills: Array.isArray(form.skills) ? form.skills.map(s => String(s).trim()).filter(Boolean) : [],
    experience: String(form.experience || '').trim(),
    resumePath: form.resumePath || null,
    portfolio: String(form.portfolio || '').trim(),
    github: String(form.github || '').trim(),
    linkedin: String(form.linkedin || '').trim(),
    notes: String(form.notes || '').trim(),
  } : {};

  if (form) {
    if (!details.fullName || !details.email) {
      res.status(400);
      throw new Error('Full name and email are required');
    }
    // Ensure email matches logged-in user record to avoid impersonation
    const me = await User.findById(req.user.id);
    if (me && me.email.toLowerCase() !== details.email) {
      res.status(400);
      throw new Error('Email must match your account email');
    }
  }

  // Latest resume (Cloudinary URL) — always load so we can fix bare filenames in resumePath
  const resumeDoc = await Resume.findOne({ user: req.user.id }).sort({ createdAt: -1 });

  let resumeUrl = details.resumePath || resumeDoc?.fileUrl || null;
  if (resumeUrl && !isHttpUrl(resumeUrl)) {
    if (resumeDoc?.fileUrl && isHttpUrl(resumeDoc.fileUrl)) {
      resumeUrl = resumeDoc.fileUrl;
      if (form) details.resumePath = resumeDoc.fileUrl;
    }
  }

  if (resumeUrl && isHttpUrl(resumeUrl) && !isCloudinaryUrl(resumeUrl)) {
    const fixedHttp = fixLocalResumeHttpUrl(resumeUrl);
    if (fixedHttp !== resumeUrl) {
      resumeUrl = fixedHttp;
      if (form && details.resumePath) details.resumePath = fixedHttp;
    }
  }

  let finalAtsScore = resumeDoc?.atsScore || 0;

  // Calculate real-time ATS score if we have a resume URL and an internship description
  if (internship && resumeDoc?.parsedText) {
    const jobDesc = [
      internship.description,
      internship.eligibility,
      (internship.skills || []).join(' '),
    ].join(' ');

    const atsResult = await scoreFromResumeText(resumeDoc.parsedText, jobDesc);
    if (atsResult?.ats_score) {
      finalAtsScore = Math.round(atsResult.ats_score);
    }
  }

  const application = await Application.create({
    student: req.user.id,
    internship: internshipId,
    details,
    resume: resumeUrl,
    atsScore: finalAtsScore,
    coverLetter,
  });

  res.status(201).json(application);
});

// @desc    Apply with form data (explicit endpoint)
// @route   POST /api/applications/apply/:internshipId
// @access  Private/Student
const applyWithForm = asyncHandler(async (req, res) => {
  req.body.internshipId = req.params.internshipId;
  req.body.form = req.body.form || req.body; // accept direct body as form
  return createApplication(req, res);
});

// @desc    Get my applications (Student)
// @route   GET /api/applications/my
// @access  Private/Student
const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ student: req.user.id })
    .populate('internship', 'title organization status')
    .lean();
  await attachResolvedResumeUrls(applications);
  res.status(200).json(applications);
});

// @desc    Get applications for partner's internships
// @route   GET /api/applications/partner
// @access  Private/Partner
const getPartnerApplications = asyncHandler(async (req, res) => {
  const partnerId = req.user.id;

  const applications = await Application.find()
    .populate({
      path: 'internship',
      match: { createdBy: partnerId },
      select: 'title organization createdBy',
    })
    .populate('student', 'name email profilePicture')
    .sort({ createdAt: -1 })
    .lean();

  const filtered = applications.filter(app => app.internship);
  await attachResolvedResumeUrls(filtered);
  res.status(200).json(filtered);
});

// @desc    Get application by ID (Admin)
// @route   GET /api/applications/:id
// @access  Private/Admin
const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('student', 'name email phone university course profilePicture')
    .populate('internship', 'title organization department')
    .lean();

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  await attachResolvedResumeUrls([application]);
  res.status(200).json(application);
});
// @desc    Update application status (Admin/Partner)
// @route   PUT /api/applications/:id/status
// @access  Private/Admin or Private/Partner
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  // --- Valid statuses ---
  const VALID_STATUSES = ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected'];

  if (!VALID_STATUSES.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status "${status}". Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  // --- Valid transitions (server-side enforcement) ---
  const VALID_TRANSITIONS = {
    'Applied':      ['Shortlisted', 'Rejected'],
    'Viewed':       ['Shortlisted', 'Rejected'],              // legacy compat
    'Under Review': ['Shortlisted', 'Rejected'],              // legacy compat
    'Shortlisted':  ['Interview', 'Rejected'],
    'Interview':    ['Selected', 'Rejected'],
    'Accepted':     ['Interview', 'Selected', 'Rejected'],    // legacy compat — allow full forward path
    'Selected':     ['Rejected'],
    'Rejected':     [],                                       // terminal
  };

  const application = await Application.findById(req.params.id).populate('internship', 'title organization createdBy');

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  // --- Partner authorization: can only update applications for their own internships ---
  const userRole = req.user.role;
  if (userRole === 'partner') {
    const internshipCreatorId = application.internship?.createdBy?.toString();
    const partnerId = req.user._id.toString();
    if (internshipCreatorId !== partnerId) {
      res.status(403);
      throw new Error('Forbidden - You can only manage applications for your own internships');
    }
  }

  const currentStatus = application.status;
  const allowed = VALID_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error(
      `Cannot transition from "${currentStatus}" to "${status}". ` +
      `Allowed next states: ${allowed.length ? allowed.join(', ') : 'none (terminal state)'}`
    );
  }

  application.status = status;
  await application.save();

  // --- Status-specific notification messages ---
  const internshipTitle = application.internship?.title || 'the internship';
  const org = application.internship?.organization ? ` at ${application.internship.organization}` : '';

  const notificationMessages = {
    'Shortlisted': {
      title: 'Application Shortlisted',
      message: `Your application for "${internshipTitle}"${org} has been shortlisted! Stay tuned for next steps.`,
    },
    'Interview': {
      title: 'Interview Stage',
      message: `Congratulations! Your application for "${internshipTitle}"${org} has moved to the interview stage.`,
    },
    'Selected': {
      title: 'Application Selected 🎉',
      message: `Congratulations! You have been selected for "${internshipTitle}"${org}. The team will contact you shortly.`,
    },
    'Rejected': {
      title: 'Application Update',
      message: `Your application for "${internshipTitle}"${org} was not selected at this time. We encourage you to keep applying!`,
    },
  };

  const notif = notificationMessages[status] || {
    title: 'Application Status Updated',
    message: `Your application for "${internshipTitle}"${org} has been updated to: ${status}.`,
  };

  await createAndNotify(req.app, {
    recipient: application.student,
    title: notif.title,
    message: notif.message,
    type: 'personal',
    priority: status === 'Selected' ? 'high' : 'medium',
    link: '/dashboard/applications',
  });

  res.status(200).json(application);
});

// @route   DELETE /api/applications/:id/withdraw
// @access  Private (Student)
const withdrawApplication = asyncHandler(async (req, res) => {
  const appId = req.params.id;
  console.log('[Withdraw] Attempting to withdraw application ID:', appId);
  
  const application = await Application.findById(appId);

  if (!application) {
    console.log('[Withdraw] Application not found in DB:', appId);
    res.status(404);
    throw new Error('Application not found');
  }

  // Check if the user is the owner of the application
  const userId = (req.user._id || req.user.id).toString();
  const studentId = application.student.toString();
  
  console.log('[Withdraw] Application student ID from DB:', studentId);
  console.log('[Withdraw] Request user ID from token:', userId);

  if (studentId !== userId) {
    console.log('[Withdraw] Authorization failed: IDs do not match');
    res.status(401);
    throw new Error(`User not authorized. You can only withdraw your own applications.`);
  }

  await Application.findByIdAndDelete(appId);
  console.log('[Withdraw] Successfully deleted application from DB:', appId);

  res.status(200).json({ success: true, message: 'Application withdrawn successfully' });
});

module.exports = {
  getApplications,
  createApplication,
  getMyApplications,
  updateApplicationStatus,
  getPartnerApplications,
  applyWithForm,
  getApplicationById,
  withdrawApplication,
};
