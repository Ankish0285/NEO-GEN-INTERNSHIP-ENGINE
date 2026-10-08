const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getInternshipQuality } = require('../controllers/internshipQualityController');

router.get('/:internshipId', protect, getInternshipQuality);
module.exports = router;
