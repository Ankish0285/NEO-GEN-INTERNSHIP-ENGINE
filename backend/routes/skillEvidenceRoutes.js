const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getSkillEvidence,
  upsertSkillEvidence,
  getSkillEvidenceBreakdown,
  deleteSkillEvidence,
} = require('../controllers/skillEvidenceController');

// All routes are protected
router.get('/', protect, getSkillEvidence);
router.post('/', protect, upsertSkillEvidence);
router.get('/breakdown', protect, getSkillEvidenceBreakdown);
router.delete('/:id', protect, deleteSkillEvidence);

module.exports = router;
