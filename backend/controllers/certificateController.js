const asyncHandler = require('express-async-handler');
const QRCode = require('qrcode');
const Certificate = require('../models/Certificate');
const Application = require('../models/Application');
const ActivityLog = require('../models/ActivityLog');
const { createAndNotify } = require('../utils/notificationHelper');
const emailService = require('../services/emailService');
const { smartCloudinaryUpload, releaseCloudinaryAsset } = require('../utils/cloudinaryUpload');

// ─── helpers ──────────────────────────────────────────────────────────────────

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://neogeninternshipengine.me';

const isAdminRole = (role) => role === 'admin' || role === 'super_admin';
const isIssuerRole = (role) => role === 'admin' || role === 'super_admin' || role === 'partner';

/** Verify student exists and has the student role. Returns User document. */
const resolveStudent = async (studentId) => {
  const User = require('../models/User');
  const student = await User.findById(studentId).select('name email role');
  if (!student) throw Object.assign(new Error('Student not found'), { status: 404 });
  if (student.role !== 'student')
    throw Object.assign(new Error('User is not a student'), { status: 400 });
  return student;
};

/**
 * For a partner, verify the student has at least one application to one of the
 * partner's internships with an accepted/selected/shortlisted status.
 */
const assertPartnerStudentScope = async (partnerId, studentId) => {
  const Internship = require('../models/Internship');
  const internships = await Internship.find({ createdBy: partnerId }).select('_id');
  const internshipIds = internships.map((i) => i._id);
  if (!internshipIds.length) {
    throw Object.assign(
      new Error('You have no internships to scope certificate issuance to'),
      { status: 403 }
    );
  }
  const app = await Application.findOne({
    internship: { $in: internshipIds },
    student: studentId,
    status: { $in: ['Accepted', 'Selected', 'Shortlisted'] },
  });
  if (!app) {
    throw Object.assign(
      new Error(
        'This student is not associated with your internships (must have an accepted/selected/shortlisted application)'
      ),
      { status: 403 }
    );
  }
};

/** Create a notification + activity log entry after a certificate is issued. */
const postIssueSideEffects = async (app, cert, studentId, issuerUserId) => {
  await createAndNotify(app, {
    recipient: studentId,
    title: '🎓 Certificate Issued',
    message: `Your certificate "${cert.title}" (ID: ${cert.certificateId}) has been issued and is now active!`,
    type: 'success',
    priority: 'high',
    link: '/dashboard/passport',
  });
  await ActivityLog.create({
    user: issuerUserId,
    action: 'certificate_issued',
    details: { certificateId: cert.certificateId, studentId, type: cert.type },
    ip: null,
    userAgent: null,
  });

  // Email the student about the issued certificate (fire-and-forget)
  setImmediate(() => emailService.notifyCertificateIssued(cert).catch((err) => console.error('[Email]', err.message)));
};

// ─── controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/certificates/issue
 * Admin shorthand issue (keeps backward compat with old admin flow).
 * Delegates to adminIssueCertificate logic.
 */
const issueCertificate = asyncHandler(async (req, res) => {
  if (!isAdminRole(req.user.role)) {
    res.status(403);
    throw new Error('Admin only');
  }
  return adminIssueCertificate(req, res);
});

/**
 * POST /api/certificates/admin/issue   (kept for backward compat)
 * Admin direct-issue: creates a generated-type cert with no file.
 */
const adminIssueCertificate = asyncHandler(async (req, res) => {
  if (!isAdminRole(req.user.role)) {
    res.status(403);
    throw new Error('Admin only');
  }

  const {
    studentId,
    role,
    organization,
    duration,
    skills,
    notes,
    title,
    description,
  } = req.body;

  if (!studentId || !role || !organization) {
    res.status(400);
    throw new Error('studentId, role, and organization are required');
  }

  const student = await resolveStudent(studentId);

  // Generate QR code pointing to UUID-based verification URL.
  // We'll set it after creating the cert (so we have verificationId).
  const cert = await Certificate.create({
    student: studentId,
    issuedBy: req.user._id,
    issuerOrganization: req.user.partnerInfo?.organization || 'NEO GEN',
    role: role.trim(),
    organization: organization.trim(),
    duration: (duration || '').trim(),
    skills: Array.isArray(skills)
      ? skills.map((s) => s.trim()).filter(Boolean)
      : (skills || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
    internalNotes: (notes || '').trim(),
    status: 'active',
    type: 'generated',
    title: (title || 'Internship Completion Certificate').trim(),
    description: (description || '').trim(),
  });

  // Now generate QR code and patch it back
  const verifyUrl = `${FRONTEND_URL}/verify/${cert.verificationId}`;
  let qrCodeData = '';
  try {
    qrCodeData = await QRCode.toDataURL(verifyUrl);
  } catch (_) {}

  cert.qrCodeData = qrCodeData;
  await cert.save();

  await postIssueSideEffects(req.app, cert, studentId, req.user._id);

  res.status(201).json({ success: true, data: cert });
});

/**
 * POST /api/certificates/upload
 * Upload an existing certificate file (image or PDF) via Cloudinary.
 */
const uploadCertificate = asyncHandler(async (req, res) => {
  if (!isIssuerRole(req.user.role)) {
    res.status(403);
    throw new Error('Unauthorized');
  }

  const {
    studentId,
    role,
    organization,
    duration,
    skills,
    internalNotes,
    title,
    description,
  } = req.body;

  if (!studentId || !role || !organization) {
    res.status(400);
    throw new Error('studentId, role, and organization are required');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Certificate file is required');
  }

  const student = await resolveStudent(studentId);

  // Partner scope check
  if (req.user.role === 'partner') {
    await assertPartnerStudentScope(req.user._id, studentId);
  }

  const issuerOrg =
    req.user.role === 'partner'
      ? req.user.partnerInfo?.organization || organization
      : organization;

  // Upload to Cloudinary
  const { url: fileUrl, publicId: filePublicId } = await smartCloudinaryUpload(
    req.file,
    { folder: 'neo-gen/certificates', resourceType: 'auto' }
  );

  const cert = await Certificate.create({
    student: studentId,
    issuedBy: req.user._id,
    issuerOrganization: issuerOrg,
    role: role.trim(),
    organization: organization.trim(),
    duration: (duration || '').trim(),
    skills: Array.isArray(skills)
      ? skills.map((s) => s.trim()).filter(Boolean)
      : (skills || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
    internalNotes: (internalNotes || '').trim(),
    status: 'active',
    type: 'uploaded',
    fileUrl,
    filePublicId,
    title: (title || 'Internship Completion Certificate').trim(),
    description: (description || '').trim(),
  });

  await postIssueSideEffects(req.app, cert, studentId, req.user._id);

  res.status(201).json({ success: true, data: cert });
});

/**
 * POST /api/certificates/generate
 * Generate a certificate (no file upload, frontend renders it).
 */
const generateCertificate = asyncHandler(async (req, res) => {
  if (!isIssuerRole(req.user.role)) {
    res.status(403);
    throw new Error('Unauthorized');
  }

  const {
    studentId,
    role,
    organization,
    duration,
    skills,
    internalNotes,
    title,
    description,
    templateId,
  } = req.body;

  if (!studentId || !role || !organization) {
    res.status(400);
    throw new Error('studentId, role, and organization are required');
  }

  const student = await resolveStudent(studentId);

  if (req.user.role === 'partner') {
    await assertPartnerStudentScope(req.user._id, studentId);
  }

  const issuerOrg =
    req.user.role === 'partner'
      ? req.user.partnerInfo?.organization || organization
      : organization;

  const cert = await Certificate.create({
    student: studentId,
    issuedBy: req.user._id,
    issuerOrganization: issuerOrg,
    role: role.trim(),
    organization: organization.trim(),
    duration: (duration || '').trim(),
    skills: Array.isArray(skills)
      ? skills.map((s) => s.trim()).filter(Boolean)
      : (skills || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
    internalNotes: (internalNotes || '').trim(),
    status: 'active',
    type: 'generated',
    templateId: templateId || 'classic',
    title: (title || 'Internship Completion Certificate').trim(),
    description: (description || '').trim(),
  });

  // Generate QR code
  const verifyUrl = `${FRONTEND_URL}/verify/${cert.verificationId}`;
  let qrCodeData = '';
  try {
    qrCodeData = await QRCode.toDataURL(verifyUrl);
  } catch (_) {}
  cert.qrCodeData = qrCodeData;
  await cert.save();

  // Populate student name for the response
  await cert.populate('student', 'name email');
  await cert.populate('issuedBy', 'name');

  await postIssueSideEffects(req.app, cert, studentId, req.user._id);

  // Fetch branding data for the frontend cert preview
  const SiteSettings = require('../models/SiteSettings');
  const siteSettings = await SiteSettings.findOne({ key: 'main' }).select('neogenCertBranding');
  const neogenBranding = siteSettings?.neogenCertBranding ?? {
    logoUrl: '',
    ceoName: 'Ankish Kumar',
    ceoDesignation: 'Founder & CEO, NEO GEN Internship Engine',
    ceoSignatureUrl: '',
  };

  const partnerCertSettings = req.user.role === 'partner'
    ? (req.user.partnerInfo?.certSettings ?? null)
    : null;

  res.status(201).json({
    success: true,
    data: {
      ...cert.toObject(),
      studentName: student.name,
      issuerName: req.user.name,
    },
    neogenBranding,
    partnerCertSettings,
  });
});

/**
 * GET /api/certificates/my
 * Student: get own certificates.
 */
const getMyCertificates = asyncHandler(async (req, res) => {
  const certs = await Certificate.find({ student: req.user._id })
    .sort({ issueDate: -1 })
    .populate('issuedBy', 'name');
  res.json({ success: true, data: certs });
});

/**
 * GET /api/certificates/admin/all
 * Admin: get all certificates with optional filters and pagination.
 */
const getAdminCertificates = asyncHandler(async (req, res) => {
  if (!isAdminRole(req.user.role)) {
    res.status(403);
    throw new Error('Admin only');
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const filter = {};
  if (req.query.status && req.query.status !== 'all') {
    filter.status = req.query.status;
  }

  let certs = await Certificate.find(filter)
    .sort({ issueDate: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('student', 'name email')
    .populate('issuedBy', 'name');

  // Client-side name search after populate (simple; list is bounded by limit)
  if (req.query.search) {
    const regex = new RegExp(req.query.search.trim(), 'i');
    certs = certs.filter(
      (c) =>
        regex.test(c.certificateId || '') ||
        regex.test(c.organization || '') ||
        regex.test(c.student?.name || '') ||
        regex.test(c.student?.email || '')
    );
  }

  const total = await Certificate.countDocuments(filter);
  res.json({ success: true, data: certs, total, page, pages: Math.ceil(total / limit) });
});

/**
 * GET /api/certificates/admin/students/search?q=…
 * Admin: search students by name or email.
 */
const searchStudents = asyncHandler(async (req, res) => {
  if (!isAdminRole(req.user.role)) {
    res.status(403);
    throw new Error('Admin only');
  }
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json({ success: true, data: [] });

  const User = require('../models/User');
  const students = await User.find({
    role: 'student',
    $or: [
      { name: { $regex: q.trim(), $options: 'i' } },
      { email: { $regex: q.trim(), $options: 'i' } },
    ],
  })
    .select('_id name email university course')
    .limit(10);
  res.json({ success: true, data: students });
});

/**
 * GET /api/certificates/partner
 * Partner: get certificates issued by this partner's user ID.
 */
const getPartnerCertificates = asyncHandler(async (req, res) => {
  if (req.user.role !== 'partner') {
    res.status(403);
    throw new Error('Partner only');
  }
  const certs = await Certificate.find({ issuedBy: req.user._id })
    .sort({ issueDate: -1 })
    .populate('student', 'name email');
  res.json({ success: true, data: certs });
});

/**
 * GET /api/certificates/partner/students/search?q=…
 * Partner: search students who have applications to the partner's internships.
 */
const searchStudentsPartner = asyncHandler(async (req, res) => {
  if (req.user.role !== 'partner') {
    res.status(403);
    throw new Error('Partner only');
  }

  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json({ success: true, data: [] });

  const Internship = require('../models/Internship');
  const internships = await Internship.find({ createdBy: req.user._id }).select('_id');
  const internshipIds = internships.map((i) => i._id);

  if (!internshipIds.length) return res.json({ success: true, data: [] });

  const User = require('../models/User');
  const regex = new RegExp(q.trim(), 'i');

  // Find applications for this partner's internships with accepted/selected/shortlisted status
  const apps = await Application.find({
    internship: { $in: internshipIds },
    status: { $in: ['Accepted', 'Selected', 'Shortlisted'] },
  })
    .populate({
      path: 'student',
      select: '_id name email university course',
      match: { $or: [{ name: regex }, { email: regex }] },
    })
    .limit(20);

  // Filter out apps where student didn't match
  const students = apps
    .filter((a) => a.student)
    .map((a) => a.student)
    // De-duplicate by student _id
    .filter((s, idx, arr) => arr.findIndex((x) => String(x._id) === String(s._id)) === idx)
    .slice(0, 10);

  res.json({ success: true, data: students });
});

/**
 * GET /api/certificates/partner/accepted-applications
 * Partner: get accepted/selected/shortlisted applications for the partner's internships.
 */
const getPartnerAcceptedApplications = asyncHandler(async (req, res) => {
  if (req.user.role !== 'partner') {
    res.status(403);
    throw new Error('Partner only');
  }

  const Internship = require('../models/Internship');
  const internships = await Internship.find({ createdBy: req.user._id }).select(
    '_id title organization duration'
  );
  const internshipIds = internships.map((i) => i._id);

  const applications = await Application.find({
    internship: { $in: internshipIds },
    status: { $in: ['Accepted', 'Selected', 'Shortlisted'] },
  })
    .populate('student', 'name email university course')
    .populate('internship', 'title organization duration')
    .sort({ updatedAt: -1 })
    .limit(50);

  res.json({ success: true, data: applications });
});

/**
 * GET /api/certificates/:id
 * Auth required. Admin sees any. Partner sees own. Student sees own.
 */
const getCertificateById = asyncHandler(async (req, res) => {
  const cert = await Certificate.findById(req.params.id)
    .populate('student', 'name email')
    .populate('issuedBy', 'name');

  if (!cert) {
    res.status(404);
    throw new Error('Certificate not found');
  }

  // RBAC
  if (isAdminRole(req.user.role)) {
    // allowed
  } else if (req.user.role === 'partner') {
    if (String(cert.issuedBy?._id || cert.issuedBy) !== String(req.user._id)) {
      res.status(403);
      throw new Error('Access denied');
    }
  } else {
    // student
    if (String(cert.student?._id || cert.student) !== String(req.user._id)) {
      res.status(403);
      throw new Error('Access denied');
    }
  }

  res.json({ success: true, data: cert });
});

/**
 * GET /api/certificates/verify/:verificationId   (PUBLIC — no auth)
 * Returns only public-safe fields. Never returns email or internal notes.
 */
const verifyCertificatePublic = asyncHandler(async (req, res) => {
  const cert = await Certificate.findOne({
    verificationId: req.params.verificationId,
  }).populate('student', 'name');

  if (!cert) {
    return res.status(404).json({ success: false, message: 'Certificate not found' });
  }

  // Format student name: FirstName L. — first name + last initial only
  const fullName = cert.student?.name || '';
  const nameParts = fullName.trim().split(/\s+/);
  const studentName =
    nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]?.toUpperCase()}.`
      : nameParts[0] || 'Student';

  res.json({
    success: true,
    data: {
      certificateId: cert.certificateId,
      verificationId: cert.verificationId,
      studentName,
      organization: cert.organization,
      role: cert.role,
      issueDate: cert.issueDate,
      status: cert.status,
      skills: cert.skills,
      duration: cert.duration,
      title: cert.title,
      // For backward-compat, also expose qrCodeData on active certs
      qrCodeData: cert.status === 'active' ? cert.qrCodeData : null,
    },
  });
});

/**
 * GET /api/certificates/verify/:certificateId (old route, by certificateId string)
 * Kept for backward compat with QR codes already issued.
 */
const getPublicCertificate = asyncHandler(async (req, res) => {
  // The old route uses certificateId (NEOGEN-CERT-XXXXXXXX or NGIE-YYYY-XXXXXX).
  const cert = await Certificate.findOne({
    certificateId: req.params.certificateId,
  }).populate('student', 'name');

  if (!cert) {
    // Fall back to PlacementRecord for pre-migration certs
    const PlacementRecord = require('../models/PlacementRecord');
    const old = await PlacementRecord.findOne({
      certificateId: req.params.certificateId,
    });
    if (!old) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    return res.json({
      success: true,
      data: {
        certificateId: old.certificateId,
        organization: old.organization,
        role: old.role,
        duration: old.duration,
        skills: old.skills,
        issuedAt: old.issuedAt,
        status: old.status,
        qrCodeData: old.status === 'active' ? old.qrCodeData : null,
      },
    });
  }

  res.json({
    success: true,
    data: {
      certificateId: cert.certificateId,
      verificationId: cert.verificationId,
      organization: cert.organization,
      role: cert.role,
      duration: cert.duration,
      skills: cert.skills,
      issuedAt: cert.issueDate,
      status: cert.status,
      qrCodeData: cert.status === 'active' ? cert.qrCodeData : null,
    },
  });
});

/**
 * PUT /api/certificates/:id/verify
 * Admin: mark a certificate as verified (active).
 */
const verifyCertificate = asyncHandler(async (req, res) => {
  if (!isAdminRole(req.user.role)) {
    res.status(403);
    throw new Error('Admin only');
  }
  const cert = await Certificate.findByIdAndUpdate(
    req.params.id,
    { status: 'active', verifiedAt: new Date(), verifiedBy: req.user._id },
    { new: true }
  ).populate('student', 'name email');

  if (!cert) {
    res.status(404);
    throw new Error('Certificate not found');
  }

  await createAndNotify(req.app, {
    recipient: cert.student?._id || cert.student,
    title: '✅ Certificate Verified',
    message: `Your certificate (ID: ${cert.certificateId}) has been verified and is now active!`,
    type: 'success',
    priority: 'high',
    link: '/dashboard/passport',
  });

  // Email the student about the status change (fire-and-forget)
  setImmediate(() => emailService.notifyCertificateStatus(cert, 'active').catch((err) => console.error('[Email]', err.message)));

  res.json({ success: true, data: cert });
});

/**
 * PATCH /api/certificates/:id/revoke
 * Admin: revoke a certificate.
 */
const revokeCertificate = asyncHandler(async (req, res) => {
  if (!isAdminRole(req.user.role)) {
    res.status(403);
    throw new Error('Admin only');
  }
  const cert = await Certificate.findByIdAndUpdate(
    req.params.id,
    {
      status: 'revoked',
      revokedAt: new Date(),
      revokedBy: req.user._id,
      revokedReason: req.body.reason || '',
    },
    { new: true }
  );

  if (!cert) {
    res.status(404);
    throw new Error('Certificate not found');
  }

  await ActivityLog.create({
    user: req.user._id,
    action: 'certificate_revoked',
    details: { certificateId: cert.certificateId, reason: req.body.reason },
    ip: null,
    userAgent: null,
  });

  // Email the student about the revocation (fire-and-forget)
  setImmediate(() => emailService.notifyCertificateStatus(cert, 'revoked').catch((err) => console.error('[Email]', err.message)));

  res.json({ success: true, data: cert });
});

/**
 * DELETE /api/certificates/:id
 * Admin: delete a certificate and clean up Cloudinary asset.
 */
const deleteCertificate = asyncHandler(async (req, res) => {
  if (!isAdminRole(req.user.role)) {
    res.status(403);
    throw new Error('Admin only');
  }
  const cert = await Certificate.findById(req.params.id);
  if (!cert) {
    res.status(404);
    throw new Error('Certificate not found');
  }

  if (cert.fileUrl) {
    try {
      await releaseCloudinaryAsset(cert.fileUrl);
    } catch (_) {
      // non-fatal
    }
  }

  await Certificate.deleteOne({ _id: cert._id });
  res.json({ success: true });
});

module.exports = {
  issueCertificate,
  adminIssueCertificate,
  uploadCertificate,
  generateCertificate,
  getMyCertificates,
  getAdminCertificates,
  searchStudents,
  getPartnerCertificates,
  searchStudentsPartner,
  getPartnerAcceptedApplications,
  getCertificateById,
  verifyCertificatePublic,
  getPublicCertificate,
  verifyCertificate,
  revokeCertificate,
  deleteCertificate,
};
