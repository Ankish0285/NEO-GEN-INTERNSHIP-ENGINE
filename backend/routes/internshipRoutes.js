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
    approveInternship,
    getMyInternships
} = require('../controllers/internshipController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin only routes
router.get('/admin/all', protect, admin, getAdminInternships);
router.put('/:id/approve', protect, admin, approveInternship);

// Authenticated user (partner / admin) own posted internships
// NOTE: MUST be declared before /:id otherwise Express matches "mine" as an :id
router.get('/mine', protect, getMyInternships);

// Public & shared routes
router.route('/').get(getInternships).post(protect, createInternship);
router.get('/recommended', protect, getRecommendedInternships);
router.route('/:id').get(getInternshipById).put(protect, updateInternship).delete(protect, admin, deleteInternship);

module.exports = router;
