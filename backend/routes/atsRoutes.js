const express = require('express');
const router = express.Router();
const { uploadResume, getResumeScore, deleteResume } = require('../controllers/atsController');
const { getAIRecommendations } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/upload', protect, upload.single('resume'), uploadResume);
router.get('/score', protect, getResumeScore);
router.get('/recommendations', protect, getAIRecommendations);
router.delete('/:resumeId', protect, deleteResume);

module.exports = router;
