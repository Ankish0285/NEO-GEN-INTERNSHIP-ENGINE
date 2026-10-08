const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { issueCertificate, verifyCertificate, revokeCertificate, getMyCertificates, getPublicCertificate, getPartnerCertificates, getAdminCertificates, adminIssueCertificate, searchStudents } = require('../controllers/certificateController');

router.post('/', protect, issueCertificate);
router.post('/admin/issue', protect, adminIssueCertificate);       // Admin direct issue
router.get('/admin/students/search', protect, searchStudents);     // Search students
router.put('/:certificateId/verify', protect, verifyCertificate);
router.put('/:certificateId/revoke', protect, revokeCertificate);
router.get('/my', protect, getMyCertificates);
router.get('/verify/:certificateId', getPublicCertificate);
router.get('/partner', protect, getPartnerCertificates);
router.get('/admin/all', protect, getAdminCertificates);
module.exports = router;
