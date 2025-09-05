const rateLimit = require('express-rate-limit');

// Rate limiter for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: {
        success: false,
        message: 'Too many login attempts, please try again later',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limiter for registration
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 registration attempts per hour
    message: {
        success: false,
        message: 'Too many registration attempts, please try again later',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// General auth rate limiter
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 auth requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    loginLimiter,
    registerLimiter,
    authLimiter
};