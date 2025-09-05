const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

// Authentication middleware
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }
        
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        // Verify token
        const decoded = verifyToken(token);
        
        // Check if user still exists and is active
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }
        
        // Check if account is locked
        if (user.isLocked) {
            return res.status(423).json({
                success: false,
                message: 'Account is temporarily locked'
            });
        }
        
        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            username: decoded.username,
            role: decoded.role
        };
        
        next();
        
    } catch (error) {
        console.error('Authentication error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

// Optional authentication middleware (for endpoints that can work with or without auth)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);
            
            const user = await User.findById(decoded.userId);
            if (user && user.isActive && !user.isLocked) {
                req.user = {
                    userId: decoded.userId,
                    email: decoded.email,
                    username: decoded.username,
                    role: decoded.role
                };
            }
        }
        
        next();
        
    } catch (error) {
        // For optional auth, we continue even if token is invalid
        next();
    }
};

module.exports = {
    authenticate,
    optionalAuth
};