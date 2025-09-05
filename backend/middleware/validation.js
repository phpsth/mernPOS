const { body, validationResult } = require('express-validator');
const { validatePassword } = require('../utils/passwordUtils');

// Registration validation rules
const validateRegistration = [
    body('firstName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('First name can only contain letters and spaces'),
    
    body('lastName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Last name can only contain letters and spaces'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email address'),
    
    body('username')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('Username must be between 3 and 20 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers and underscores'),
    
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .custom((password) => {
            const validation = validatePassword(password);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }
            return true;
        }),
    
    body('role')
        .optional()
        .isIn(['cashier', 'staff'])
        .withMessage('Public registration only allows cashier or staff roles')
        .default('cashier')
];

// Login validation rules
const validateLogin = [
    body('login')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Email or username is required'),
    
    body('password')
        .isLength({ min: 1 })
        .withMessage('Password is required')
];

// Admin user creation validation (allows all roles)
const validateUserCreation = [
    body('firstName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('First name can only contain letters and spaces'),
    
    body('lastName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Last name can only contain letters and spaces'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email address'),
    
    body('username')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('Username must be between 3 and 20 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers and underscores'),
    
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .custom((password) => {
            const validation = validatePassword(password);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }
            return true;
        }),
    
    body('role')
        .isIn(['admin', 'manager', 'cashier', 'staff'])
        .withMessage('Role must be one of: admin, manager, cashier, staff')
];

// Password change validation
const validatePasswordChange = [
    body('currentPassword')
        .isLength({ min: 1 })
        .withMessage('Current password is required'),
    
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
        .custom((password) => {
            const validation = validatePassword(password);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }
            return true;
        })
];

// Check validation results
const checkValidationResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg
            }))
        });
    }
    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    validateUserCreation,
    validatePasswordChange,
    checkValidationResult
};