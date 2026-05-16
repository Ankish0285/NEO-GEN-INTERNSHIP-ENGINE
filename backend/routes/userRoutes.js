const express = require('express');
const router = express.Router();
const { getUsers, toggleUserStatus, blockUser, deleteUser, createPartner, getPartners, deleteMyAccount } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, admin, getUsers);
router.route('/partners').get(protect, admin, getPartners);
router.route('/partner').post(protect, admin, createPartner);
router.delete('/delete-account', protect, deleteMyAccount);
router.route('/:id/status').put(protect, admin, toggleUserStatus);
router.route('/:id/block').put(protect, admin, blockUser);
router.route('/:id').delete(protect, admin, deleteUser);

module.exports = router;
 
