const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { issueCertificate, verifyCertificate, revokeCertificate, getMyCertificates, getPublicCertificate, getPartnerCertificates, getAdminCertificates } = require('../controllers/certificateController');

router.post('/', protect, issueCertificate);
router.put('/:certificateId/verify', protect, verifyCertificate);
router.put('/:certificateId/revoke', protect, revokeCertificate);
router.get('/my', protect, getMyCertificates);
router.get('/verify/:certificateId', getPublicCertificate);
router.get('/partner', protect, getPartnerCertificates);
router.get('/admin/all', protect, getAdminCertificates);
module.exports = router;
