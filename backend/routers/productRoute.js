const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// Public routes (no authentication required)
router.get('/', productController.getAllProducts); // Anyone can view products
router.get('/:id', productController.getProductById); // Anyone can view single product

// Protected routes (authentication required)
router.get('/low-stock', authenticate, authorize(['admin', 'manager']), productController.getLowStockProducts);
router.post('/', authenticate, authorize(['admin', 'manager']), productController.createProduct);
router.put('/:id', authenticate, authorize(['admin', 'manager']), productController.updateProduct);
router.patch('/:id/stock', authenticate, authorize(['admin', 'manager', 'cashier']), productController.updateStock);
router.delete('/:id', authenticate, authorize(['admin', 'manager']), productController.deleteProduct);

module.exports = router;