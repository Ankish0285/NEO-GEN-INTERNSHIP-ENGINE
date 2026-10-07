const express = require('express');
const router = express.Router();
const {
  getMyAssessments,
  addAssessment,
  updateAssessment,
  deleteAssessment,
  getAdminAllAssessments,
} = require('../controllers/skillAssessmentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getMyAssessments)
  .post(protect, addAssessment);

router.get('/admin/all', protect, admin, getAdminAllAssessments);

router.route('/:id')
  .put(protect, updateAssessment)
  .delete(protect, deleteAssessment);

module.exports = router;
