const asyncHandler = require('express-async-handler');
const QRCode = require('qrcode');
const PlacementRecord = require('../models/PlacementRecord');
const { createAndNotify } = require('../utils/notificationHelper');

const generateCertificateId = () => {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `NGIE-${year}-${random}`;
};

const issueCertificate = asyncHandler(async (req, res) => {
  const { applicationId, studentId, internshipId, role, organization, duration, skills } = req.body;
  if (req.user.role !== 'partner' && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    res.status(403); throw new Error('Only partners or admins can issue certificates');
  }
  const certificateId = generateCertificateId();
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/certificate/verify/${certificateId}`;
  let qrCodeData = '';
  try { qrCodeData = await QRCode.toDataURL(verifyUrl); } catch(e) { console.error('QR generation failed:', e); }
  const cert = await PlacementRecord.create({
    applicationId, studentId: studentId || req.body.studentId, internshipId,
    partnerId: req.user._id, certificateId, role, organization, duration,
    skills: skills || [], status: 'pending', qrCodeData, publicVerifyUrl: verifyUrl, issuedAt: new Date(),
  });
  await createAndNotify(req.app, {
    recipient: studentId,
    title: '🎓 Certificate Issued',
    message: `Your internship certificate has been issued. Certificate ID: ${certificateId}`,
    type: 'success', priority: 'high', link: `/dashboard/passport`,
  });
  res.status(201).json({ success: true, data: cert });
});

const verifyCertificate = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    res.status(403); throw new Error('Admin only');
  }
  const cert = await PlacementRecord.findOneAndUpdate(
    { certificateId: req.params.certificateId },
    { status: 'active', verifiedAt: new Date(), verifiedBy: req.user._id },
    { new: true }
  );
  if (!cert) { res.status(404); throw new Error('Certificate not found'); }
  await createAndNotify(req.app, {
    recipient: cert.studentId,
    title: '✅ Certificate Verified',
    message: `Your certificate ${cert.certificateId} has been verified and is now active!`,
    type: 'success', priority: 'high', link: `/dashboard/passport`,
  });
  res.json({ success: true, data: cert });
});

const revokeCertificate = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    res.status(403); throw new Error('Admin only');
  }
  const cert = await PlacementRecord.findOneAndUpdate(
    { certificateId: req.params.certificateId },
    { status: 'revoked', revokedAt: new Date(), revokedBy: req.user._id, revokedReason: req.body.reason },
    { new: true }
  );
  if (!cert) { res.status(404); throw new Error('Certificate not found'); }
  res.json({ success: true, data: cert });
});

const getMyCertificates = asyncHandler(async (req, res) => {
  const certs = await PlacementRecord.find({ studentId: req.user._id, certificateId: { $exists: true } })
    .sort({ issuedAt: -1 });
  res.json({ success: true, data: certs });
});

const getPublicCertificate = asyncHandler(async (req, res) => {
  const cert = await PlacementRecord.findOne({ certificateId: req.params.certificateId });
  if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
  res.json({
    success: true,
    data: {
      certificateId: cert.certificateId, role: cert.role, organization: cert.organization,
      duration: cert.duration, skills: cert.skills, issuedAt: cert.issuedAt,
      verifiedAt: cert.verifiedAt, status: cert.status,
      qrCodeData: cert.status === 'active' ? cert.qrCodeData : null,
    }
  });
});

const getPartnerCertificates = asyncHandler(async (req, res) => {
  const certs = await PlacementRecord.find({ partnerId: req.user._id, certificateId: { $exists: true } })
    .sort({ issuedAt: -1 });
  res.json({ success: true, data: certs });
});

const getAdminCertificates = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const filter = { certificateId: { $exists: true } };
  if (req.query.status) filter.status = req.query.status;
  const total = await PlacementRecord.countDocuments(filter);
  const certs = await PlacementRecord.find(filter).sort({ issuedAt: -1 }).skip((page-1)*limit).limit(limit);
  res.json({ success: true, data: certs, total, page, pages: Math.ceil(total/limit) });
});

module.exports = { issueCertificate, verifyCertificate, revokeCertificate, getMyCertificates, getPublicCertificate, getPartnerCertificates, getAdminCertificates };
