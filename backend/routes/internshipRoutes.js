const express = require('express');
const router = express.Router();
const {
    getInternships,
    getInternshipById,
    createInternship,
    updateInternship,
    deleteInternship,
    getRecommendedInternships,
    getAdminInternships,
    approveInternship
} = require('../controllers/internshipController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin only routes
router.get('/admin/all', protect, admin, getAdminInternships);
router.put('/:id/approve', protect, admin, approveInternship);

// Public & shared routes
router.route('/').get(getInternships).post(protect, createInternship);
router.get('/recommended', protect, getRecommendedInternships);
router.route('/:id').get(getInternshipById).put(protect, admin, updateInternship).delete(protect, admin, deleteInternship);

module.exports = router;
