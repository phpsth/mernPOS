const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// All customer routes require authentication
router.use(authenticate);

// Customer routes with role-based access
router.get('/', authorize(['admin', 'manager', 'cashier']), customerController.getAllCustomers);
router.get('/:id', authorize(['admin', 'manager', 'cashier']), customerController.getCustomerById);
router.post('/', authorize(['admin', 'manager', 'cashier']), customerController.createCustomer);
router.put('/:id', authorize(['admin', 'manager']), customerController.updateCustomer);
router.delete('/:id', authorize(['admin', 'manager']), customerController.deleteCustomer);

module.exports = router;