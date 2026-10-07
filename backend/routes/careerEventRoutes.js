const express = require('express');
const router = express.Router();
const {
  getCareerEvents,
  getCareerEventById,
  createCareerEvent,
  updateCareerEvent,
  deleteCareerEvent,
  registerForEvent,
  unregisterFromEvent,
} = require('../controllers/careerEventController');
const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');

router.route('/')
  .get(optionalAuth, getCareerEvents)
  .post(protect, admin, createCareerEvent);

router.route('/:id')
  .get(optionalAuth, getCareerEventById)
  .put(protect, admin, updateCareerEvent)
  .delete(protect, admin, deleteCareerEvent);

router.route('/:id/register')
  .post(protect, registerForEvent)
  .delete(protect, unregisterFromEvent);

module.exports = router;
