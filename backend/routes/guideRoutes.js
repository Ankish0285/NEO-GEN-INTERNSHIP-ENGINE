const express = require('express');
const router = express.Router();
const {
    getGuides,
    createGuide,
    updateGuide,
    deleteGuide,
} = require('../controllers/guideController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(getGuides).post(protect, admin, createGuide);
router.route('/:id').put(protect, admin, updateGuide).delete(protect, admin, deleteGuide);

module.exports = router;
