const express = require('express');
const router = express.Router();
const { uploadResume, getResumeScore, getResumeUsage, deleteResume } = require('../controllers/atsController');
const { getAIRecommendations } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const { checkResumeAccess, FEATURE_ATS } = require('../middleware/subscriptionMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Resume upload — checkResumeAccess runs BEFORE uploadResume, blocks if limit exceeded
router.post('/upload', protect, checkResumeAccess(FEATURE_ATS), upload.single('resume'), uploadResume);

// Read-only — no usage check required
router.get('/score',           protect, getResumeScore);
router.get('/usage',           protect, getResumeUsage);
router.get('/recommendations', protect, getAIRecommendations);
router.delete('/:resumeId',    protect, deleteResume);

module.exports = router;
