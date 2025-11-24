const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const {
  getAllCategories,
  createCategory,
  deleteCategory,
} = require('../controllers/categoryController');

const router = express.Router();

router.get('/', getAllCategories);
router.post('/', authMiddleware, adminMiddleware, createCategory);
router.delete('/:categoryId', authMiddleware, adminMiddleware, deleteCategory);

module.exports = router;