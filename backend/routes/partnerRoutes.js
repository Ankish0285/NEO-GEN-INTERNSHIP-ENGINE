const express = require('express');
const { loginPartner } = require('../controllers/authController');
const { protect, partner } = require('../middleware/authMiddleware');
const { getPartnerIntelligence } = require('../controllers/partnerIntelligenceController');
const upload = require('../middleware/uploadMiddleware');
const {
    getPartnerCertSettings,
    updatePartnerCertSettings,
    uploadPartnerCertLogo,
    uploadPartnerCertSignature,
} = require('../controllers/partnerCertSettingsController');

const router = express.Router();

// Public — Partner portal login only
router.post('/login', loginPartner);

// Protected — Partner-only API namespace
router.use(protect, partner);

// Reserved for partner-specific routes (dashboard summary lives under /api/dashboard)
router.get('/intelligence', getPartnerIntelligence);

// Partner certificate settings
router.get('/cert-settings', getPartnerCertSettings);
router.put('/cert-settings', updatePartnerCertSettings);
router.post('/cert-settings/logo', upload.single('logo'), uploadPartnerCertLogo);
router.post('/cert-settings/signature', upload.single('signature'), uploadPartnerCertSignature);

module.exports = router;
