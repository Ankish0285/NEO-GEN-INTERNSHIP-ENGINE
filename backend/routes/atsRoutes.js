const express = require('express');
const router = express.Router();
const { uploadResume, getResumeScore, getRecommendations, deleteResume } = require('../controllers/atsController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/upload', protect, upload.single('resume'), uploadResume);
router.get('/score', protect, getResumeScore);
router.get('/recommendations', protect, getRecommendations);
router.delete('/:resumeId', protect, deleteResume);

module.exports = router;
