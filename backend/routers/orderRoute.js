const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// All order routes require authentication
router.use(authenticate);

// Order routes with role-based access
router.get('/', authorize(['admin', 'manager', 'cashier']), orderController.getAllOrders);
router.get('/reports/daily', authorize(['admin', 'manager']), orderController.getDailySalesReport);
router.get('/:id', authorize(['admin', 'manager', 'cashier']), orderController.getOrderById);
router.post('/', authorize(['admin', 'manager', 'cashier']), orderController.createOrder);
router.patch('/:id/status', authorize(['admin', 'manager', 'cashier']), orderController.updateOrderStatus);

module.exports = router;