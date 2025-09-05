const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// Public routes
router.get('/', categoryController.getAllCategories); // Anyone can view categories
router.get('/:id', categoryController.getCategoryById);
router.get('/:id/products', categoryController.getCategoryProducts);

// Protected routes (admin and manager only)
router.post('/', authenticate, authorize(['admin', 'manager']), categoryController.createCategory);
router.put('/:id', authenticate, authorize(['admin', 'manager']), categoryController.updateCategory);
router.delete('/:id', authenticate, authorize(['admin', 'manager']), categoryController.deleteCategory);

module.exports = router;