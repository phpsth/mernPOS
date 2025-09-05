const bcrypt = require('bcryptjs');

// Hash password
const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};

// Compare password with hash
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// Validate password strength
const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumber) {
        errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
        errors.push('Password must contain at least one special character');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

module.exports = {
    hashPassword,
    comparePassword,
    validatePassword
};