const express = require('express');
const router = express.Router();
const {
  getApplications,
  createApplication,
  getMyApplications,
  updateApplicationStatus,
  applyWithForm,
  getPartnerApplications,
  getApplicationById,
  withdrawApplication
} = require('../controllers/applicationController');
const { protect, admin, partner } = require('../middleware/authMiddleware');

router.route('/').get(protect, admin, getApplications).post(protect, createApplication);
router.route('/apply/:internshipId').post(protect, applyWithForm);
router.route('/my').get(protect, getMyApplications);
router.route('/partner').get(protect, partner, getPartnerApplications);
router.route('/:id/status').put(protect, admin, updateApplicationStatus);
router.route('/:id/withdraw').delete(protect, withdrawApplication);
router.route('/:id').get(protect, admin, getApplicationById);

module.exports = router;
