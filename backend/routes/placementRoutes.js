const express = require('express');
const router = express.Router();
const {
  getMyPlacements,
  addPlacement,
  adminGetAllPlacements,
  adminVerifyPlacement,
  updatePlacement,
  deletePlacement,
} = require('../controllers/placementController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/my', protect, getMyPlacements);
router.post('/', protect, addPlacement);

router.get('/admin/all', protect, admin, adminGetAllPlacements);
router.put('/admin/:id/verify', protect, admin, adminVerifyPlacement);

router.route('/:id')
  .put(protect, updatePlacement)
  .delete(protect, deletePlacement);

module.exports = router;
