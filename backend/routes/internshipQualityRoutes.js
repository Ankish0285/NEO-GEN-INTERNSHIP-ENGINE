const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getInternshipQuality, getApplicationStrength } = require('../controllers/internshipQualityController');

router.get('/application/:applicationId/strength', protect, getApplicationStrength);
router.get('/:internshipId', protect, getInternshipQuality);
module.exports = router;
