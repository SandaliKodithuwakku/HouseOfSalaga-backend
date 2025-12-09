const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  getDashboardStats,
  addProduct,
  updateProduct,
  deleteProduct,
  getAllUsers,
  deleteUser,
  getAllOrders,
  updateOrderStatus,
  deleteReview,
  getSalesReport,
} = require('../controllers/adminController');

const router = express.Router();

// Dashboard Stats
router.get('/stats', authMiddleware, adminMiddleware, getDashboardStats);

// Product Management
router.post('/products', authMiddleware, adminMiddleware, upload.single('image'), addProduct);
router.put('/products/:productId', authMiddleware, adminMiddleware, upload.single('image'), updateProduct);
router.delete('/products/:productId', authMiddleware, adminMiddleware, deleteProduct);

// User Management
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);
router.delete('/users/:userId', authMiddleware, adminMiddleware, deleteUser);

// Order Management
router.get('/orders', authMiddleware, adminMiddleware, getAllOrders);
router.put('/orders/:orderId', authMiddleware, adminMiddleware, updateOrderStatus);

// Review Management
router.delete('/reviews/:reviewId', authMiddleware, adminMiddleware, deleteReview);

// Reports
router.get('/reports/sales', authMiddleware, adminMiddleware, getSalesReport);

module.exports = router;