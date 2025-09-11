const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// All stats routes require authentication
router.use(authenticate);

// Stats routes with role-based access
router.get('/overview', authorize(['admin', 'manager']), statsController.getOverviewStats);
router.get('/sales', authorize(['admin', 'manager']), statsController.getSalesStats);
router.get('/products', authorize(['admin', 'manager']), statsController.getProductStats);
router.get('/customers', authorize(['admin', 'manager']), statsController.getCustomerStats);
router.get('/revenue', authorize(['admin', 'manager']), statsController.getRevenueStats);

module.exports = router;