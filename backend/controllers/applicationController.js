const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const Internship = require('../models/Internship');
const { createAndNotify } = require('../utils/notificationHelper');
const Resume = require('../models/Resume');
const User = require('../models/User');
const axios = require('axios');
const { isHttpUrl, fixLocalResumeHttpUrl, isCloudinaryUrl } = require('../utils/resumeUrl');
const { attachResolvedResumeUrls } = require('../utils/attachApplicationResumeUrls');

// Helper to calculate ATS Score via ATS Django API
const calculateAtsScore = async (resumeUrl, jobDescription) => {
  try {
    const baseUrl = process.env.ATS_API_URL;
    if (!baseUrl) {
      console.warn('[ATS] ATS_API_URL not set. Returning default score 0.');
      return { ats_score: 0 };
    }
    const url = `${baseUrl.replace(/\/+$/, '')}/ats/score`;
    const response = await axios.post(url, { resumeUrl, jobDescription }, { timeout: 15000 });
    return response.data || { ats_score: 0 };
  } catch (err) {
    console.error(`[ATS] HTTP error: ${err.message}`);
    return { ats_score: 0 };
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
  if (resumeUrl && internship) {
      const jobDesc = [
          internship.description,
          internship.requirements,
          (internship.requiredSkills || []).join(' ')
      ].join(' ');

      console.log(`[ATS] Calculating score for application...`);
      const atsResult = await calculateAtsScore(resumeUrl, jobDesc);
      if (atsResult && atsResult.ats_score) {
          finalAtsScore = atsResult.ats_score;
          console.log(`[ATS] Score calculated: ${finalAtsScore}`);
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
// @desc    Update application status (Admin)
// @route   PUT /api/applications/:id/status
// @access  Private/Admin
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const application = await Application.findById(req.params.id).populate('internship', 'title organization');

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  application.status = status;
  await application.save();

  // Notify student about application status update
  await createAndNotify(req.app, {
    recipient: application.student,
    title: 'Application Status Updated',
    message: `Your application for "${application.internship.title}" at ${application.internship.organization} has been marked as ${status}.`,
    type: 'personal',
    priority: 'high',
    link: '/dashboard/applications'
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
