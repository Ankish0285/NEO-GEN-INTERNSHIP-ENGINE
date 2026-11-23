const express = require('express');
const { loginSuperAdmin } = require('../controllers/authController');
const { 
    getUsers, updateUserRole, toggleBlockUser, 
    updatePartnerStatus, getSystemAnalytics, impersonateUser, getAuditLogs 
} = require('../controllers/adminController');
const { getPlatformIntelligence } = require('../controllers/adminIntelligenceController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
    getCertBranding,
    updateCertBranding,
    uploadCertBrandingLogo,
    uploadCertBrandingSignature,
} = require('../controllers/certBrandingController');

const router = express.Router();

// Public specific bypass
router.post('/login', loginSuperAdmin);

// God Mode routes (Protected & Admin Only)
router.use(protect, admin);

router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/block', toggleBlockUser);
router.put('/partners/:id/status', updatePartnerStatus);
router.get('/analytics', getSystemAnalytics);
router.post('/impersonate/:id', impersonateUser);
router.get('/logs', getAuditLogs);
router.get('/intelligence', getPlatformIntelligence);

// Certificate branding (super_admin only — enforced inside controller)
router.get('/cert-branding', getCertBranding);
router.put('/cert-branding', updateCertBranding);
router.post('/cert-branding/logo', upload.single('logo'), uploadCertBrandingLogo);
router.post('/cert-branding/signature', upload.single('signature'), uploadCertBrandingSignature);

module.exports = router;
