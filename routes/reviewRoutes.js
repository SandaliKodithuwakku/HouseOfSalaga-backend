const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getProductReviews,
  addReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');

const router = express.Router();

router.get('/', getProductReviews);
router.post('/', authMiddleware, addReview);
router.put('/:reviewId', authMiddleware, updateReview);
router.delete('/:reviewId', authMiddleware, deleteReview);

module.exports = router;