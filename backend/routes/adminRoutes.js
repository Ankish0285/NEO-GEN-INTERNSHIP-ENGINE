const express = require('express');
const { loginSuperAdmin } = require('../controllers/authController');
const { 
    getUsers, updateUserRole, toggleBlockUser, 
    updatePartnerStatus, getSystemAnalytics, impersonateUser, getAuditLogs 
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public specific bypass
router.post('/login', loginSuperAdmin);

// God Mode routes (Protected & Admin Only)
router.use(protect, admin);

router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/block', toggleBlockUser);
router.put('/partners/:id/status', updatePartnerStatus);
router.get('/analytics', getSystemAnalytics);
router.post('/impersonate/:id', impersonateUser);
router.get('/logs', getAuditLogs);

module.exports = router;
