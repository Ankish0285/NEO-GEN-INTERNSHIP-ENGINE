const express = require('express');
const { loginPartner } = require('../controllers/authController');
const { protect, partner } = require('../middleware/authMiddleware');
const { getPartnerIntelligence } = require('../controllers/partnerIntelligenceController');

const router = express.Router();

// Public — Partner portal login only
router.post('/login', loginPartner);

// Protected — Partner-only API namespace
router.use(protect, partner);

// Reserved for partner-specific routes (dashboard summary lives under /api/dashboard)
router.get('/intelligence', getPartnerIntelligence);

module.exports = router;
