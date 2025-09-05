const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validateUserCreation, checkValidationResult } = require('../middleware/validation');

// All user management routes require authentication
router.use(authenticate);

// User management routes (Admin and Manager access)
router.get('/', authorize(['admin', 'manager']), userController.getAllUsers);
router.get('/:id', authorize(['admin', 'manager']), userController.getUserById);
router.post('/', 
    authorize(['admin', 'manager']), 
    validateUserCreation, 
    checkValidationResult, 
    userController.createUser
);
router.put('/:id', authorize(['admin', 'manager']), userController.updateUser);
router.delete('/:id', authorize(['admin']), userController.deleteUser);
router.patch('/:id/role', authorize(['admin']), userController.changeUserRole);

module.exports = router;