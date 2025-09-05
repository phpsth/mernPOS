const jwt = require('jsonwebtoken');

// Generate access token
const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// Generate refresh token
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
    });
};

// Verify access token
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

// Verify refresh token
const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

// Decode token without verification (for expired tokens)
const decodeToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    generateToken,
    generateRefreshToken,
    verifyToken,
    verifyRefreshToken,
    decodeToken
};