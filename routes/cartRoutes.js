const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getCart,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');

const router = express.Router();

router.get('/', authMiddleware, getCart);
router.post('/', authMiddleware, addToCart);
router.put('/:cartItemId', authMiddleware, updateCart);
router.delete('/:cartItemId', authMiddleware, removeFromCart);
router.delete('/', authMiddleware, clearCart);

module.exports = router;