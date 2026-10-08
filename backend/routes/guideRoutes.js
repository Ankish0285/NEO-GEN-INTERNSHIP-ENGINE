const express = require('express');
const router = express.Router();
const {
  getPublicResources,
  getStudentResources,
  getPartnerResources,
  getAdminResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  publishResource,
  unpublishResource,
} = require('../controllers/guideController');
const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');

// Public — no token required
// GET /api/guides  (root — kept for backward compat)
router.get('/', optionalAuth, getPublicResources);

// GET /api/guides/public  (explicit public alias used by frontend)
router.get('/public', optionalAuth, getPublicResources);

// Admin only — all resources regardless of status
// GET /api/guides/admin
router.get('/admin', protect, admin, getAdminResources);

// Student — published resources for students, both, or public audiences
// GET /api/guides/student
router.get('/student', protect, getStudentResources);

// Partner — published resources for partners, both, or public audiences
// GET /api/guides/partner
router.get('/partner', protect, getPartnerResources);

// Single resource — access control enforced inside controller
// GET /api/guides/:id
router.get('/:id', optionalAuth, getResourceById);

// Admin CRUD
// POST /api/guides
router.post('/', protect, admin, createResource);
// PUT /api/guides/:id
router.put('/:id', protect, admin, updateResource);
// PUT /api/guides/:id/publish
router.put('/:id/publish', protect, admin, publishResource);
// PUT /api/guides/:id/unpublish
router.put('/:id/unpublish', protect, admin, unpublishResource);
// DELETE /api/guides/:id
router.delete('/:id', protect, admin, deleteResource);

module.exports = router;
