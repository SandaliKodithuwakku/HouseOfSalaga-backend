const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getUserProfile,
  updateUserProfile,
  getUserOrders,
} = require('../controllers/userController');

const router = express.Router();

router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateUserProfile);
router.get('/orders', authMiddleware, getUserOrders);

module.exports = router;