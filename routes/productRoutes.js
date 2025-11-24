const express = require('express');
const {
  getAllProducts,
  getProductById,
  searchProducts,
} = require('../controllers/productController');

const router = express.Router();

router.get('/', getAllProducts);
router.get('/search', searchProducts);
router.get('/:productId', getProductById);

module.exports = router;