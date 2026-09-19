const express = require('express');
const router  = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getTemplates,
  checkTemplateAccess,
  validateTemplateUse,
  adminGetTemplateConfig,
  adminSetTemplateAccess,
} = require('../controllers/resumeTemplateController');

// Public — gallery list (access levels reflect admin config)
router.get('/', getTemplates);

// Authenticated student — access check + use validation
router.get('/access/:templateId', protect, checkTemplateAccess);
router.post('/validate-use',      protect, validateTemplateUse);

// Super Admin only — manage which templates are FREE vs PREMIUM
router.get('/admin/config',                  protect, admin, adminGetTemplateConfig);
router.put('/admin/config/:templateId',      protect, admin, adminSetTemplateAccess);

module.exports = router;
