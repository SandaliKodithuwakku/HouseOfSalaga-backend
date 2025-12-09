const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const {
  getProductReviews,
  getUserReviews,
  addReview,
  updateReview,
  deleteReview,
  getAllReviews,
  updateReviewStatus,
} = require('../controllers/reviewController');

const router = express.Router();

// Admin route - get ALL reviews
router.get('/admin/all', authMiddleware, adminMiddleware, getAllReviews);
router.patch('/admin/:reviewId/status', authMiddleware, adminMiddleware, updateReviewStatus);

router.get('/product', getProductReviews);
router.get('/my-reviews', authMiddleware, getUserReviews);
router.post('/', authMiddleware, addReview);
router.put('/:reviewId', authMiddleware, updateReview);
router.delete('/:reviewId', authMiddleware, deleteReview);

module.exports = router;