const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  createOrder,
  getUserOrders,
  getOrderById,
  trackOrder,
} = require('../controllers/orderController');

const router = express.Router();

router.post('/', authMiddleware, createOrder);
router.get('/', authMiddleware, getUserOrders);
router.get('/:orderId', authMiddleware, getOrderById);
router.get('/:orderId/track', authMiddleware, trackOrder);

module.exports = router;