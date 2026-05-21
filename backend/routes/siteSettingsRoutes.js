const express = require('express');
const {
  getSiteSettings,
  updateSiteSettings,
  uploadSiteAsset,
} = require('../controllers/siteSettingsController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', getSiteSettings);
router.put('/', protect, admin, updateSiteSettings);
router.post('/upload', protect, admin, upload.single('file'), uploadSiteAsset);

module.exports = router;
