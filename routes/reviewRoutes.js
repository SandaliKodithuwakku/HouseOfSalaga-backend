const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getProductReviews,
  getUserReviews,
  addReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');

const router = express.Router();

router.get('/product', getProductReviews);
router.get('/my-reviews', authMiddleware, getUserReviews);
router.post('/', authMiddleware, addReview);
router.put('/:reviewId', authMiddleware, updateReview);
router.delete('/:reviewId', authMiddleware, deleteReview);

module.exports = router;