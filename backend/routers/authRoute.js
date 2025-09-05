const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin, validatePasswordChange, checkValidationResult } = require('../middleware/validation');
const { loginLimiter, registerLimiter, authLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/auth');

// Apply general rate limiting to all auth routes
router.use(authLimiter);

// Public routes
router.post('/register', 
    registerLimiter,
    validateRegistration, 
    checkValidationResult, 
    authController.register
);

router.post('/login', 
    loginLimiter,
    validateLogin, 
    checkValidationResult, 
    authController.login
);

router.post('/refresh-token', authController.refreshToken);

// Protected routes (require authentication)
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/change-password', 
    authenticate, 
    validatePasswordChange, 
    checkValidationResult, 
    authController.changePassword
);

module.exports = router;