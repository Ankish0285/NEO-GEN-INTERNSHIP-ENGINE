const express = require('express');
const router = express.Router();
const { getMyCareerGoal, upsertCareerGoal, deleteCareerGoal } = require('../controllers/careerGoalController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getMyCareerGoal)
  .post(protect, upsertCareerGoal)
  .put(protect, upsertCareerGoal)
  .delete(protect, deleteCareerGoal);

module.exports = router;
