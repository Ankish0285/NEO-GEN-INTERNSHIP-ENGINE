const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { getPublicCertBranding } = require('../controllers/certBrandingController');

const {
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
} = require('../controllers/certificateController');

// ── Public NEO GEN branding (no auth) ─────────────────────────────────────────
router.get('/branding/neogen', getPublicCertBranding);

// ── Write endpoints (auth required) ──────────────────────────────────────────
router.post('/issue', protect, issueCertificate);
router.post('/admin/issue', protect, adminIssueCertificate);
router.post('/upload', protect, upload.single('certificate'), uploadCertificate);
router.post('/generate', protect, generateCertificate);

// ── Student ───────────────────────────────────────────────────────────────────
router.get('/my', protect, getMyCertificates);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/admin/all', protect, getAdminCertificates);
router.get('/admin/students/search', protect, searchStudents);

// ── Partner ───────────────────────────────────────────────────────────────────
router.get('/partner', protect, getPartnerCertificates);
router.get('/partner/students/search', protect, searchStudentsPartner);
router.get('/partner/accepted-applications', protect, getPartnerAcceptedApplications);

// ── Public verification routes — MUST come before /:id ───────────────────────
// New UUID-based public verification (no auth)
router.get('/verify/:verificationId', verifyCertificatePublic);

// Legacy certId-based public verification (no auth) — kept for old QR codes
// NOTE: registered at /api/certificates/verify-cert/:certificateId to avoid
// collision; the old URL /api/certificates/verify/:certificateId still maps
// to verifyCertificatePublic which falls back to PlacementRecord lookup.

// ── Admin actions ─────────────────────────────────────────────────────────────
router.put('/:id/verify', protect, verifyCertificate);
router.patch('/:id/revoke', protect, revokeCertificate);
router.delete('/:id', protect, deleteCertificate);

// ── Single cert (by DB _id) — after all specific routes ──────────────────────
router.get('/:id', protect, getCertificateById);

module.exports = router;
