const User = require('../models/User');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { comparePassword, validatePassword } = require('../utils/passwordUtils');

// Register new user (public registration - limited roles only)
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, username, password, role = 'cashier' } = req.body;
        
        // 🔒 Security: Ensure only basic roles can be assigned via public registration
        const allowedRoles = ['cashier', 'staff'];
        const assignedRole = allowedRoles.includes(role) ? role : 'cashier';
        
        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });
        
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: existingUser.email === email ? 
                    'Email already registered' : 
                    'Username already taken'
            });
        }
        
        // Create new user with limited role
        const user = new User({
            firstName,
            lastName,
            email: email.toLowerCase(),
            username: username.toLowerCase(),
            password,
            role: assignedRole  // 🔒 Only basic roles allowed
        });
        
        await user.save();
        
        // Generate tokens
        const tokenPayload = {
            userId: user._id,
            email: user.email,
            username: user.username,
            role: user.role
        };
        
        const accessToken = generateToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);
        
        // Save refresh token
        user.refreshTokens.push({ token: refreshToken });
        await user.save();
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user,
                accessToken,
                refreshToken,
                expiresIn: process.env.JWT_EXPIRE || '7d'
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already exists`
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { login, password } = req.body;
        
        // Find user by email or username
        const user = await User.findOne({
            $or: [
                { email: login },
                { username: login }
            ],
            isActive: true
        });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Check if account is locked
        if (user.isLocked) {
            return res.status(423).json({
                success: false,
                message: 'Account temporarily locked due to too many failed login attempts'
            });
        }
        
        // Compare password
        const isPasswordValid = await comparePassword(password, user.password);
        
        if (!isPasswordValid) {
            // Increment login attempts
            await user.incLoginAttempts();
            
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Reset login attempts on successful login
        if (user.loginAttempts > 0) {
            await user.resetLoginAttempts();
        }
        
        // Generate tokens
        const tokenPayload = {
            userId: user._id,
            email: user.email,
            username: user.username,
            role: user.role
        };
        
        const accessToken = generateToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);
        
        // Save refresh token and update last login
        user.refreshTokens.push({ token: refreshToken });
        user.lastLogin = new Date();
        await user.save();
        
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user,
                accessToken,
                refreshToken,
                expiresIn: process.env.JWT_EXPIRE || '7d'
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Refresh token
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required'
            });
        }
        
        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);
        
        // Find user and check if refresh token exists
        const user = await User.findOne({
            _id: decoded.userId,
            'refreshTokens.token': refreshToken,
            isActive: true
        });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
        
        // Generate new tokens
        const tokenPayload = {
            userId: user._id,
            email: user.email,
            username: user.username,
            role: user.role
        };
        
        const newAccessToken = generateToken(tokenPayload);
        const newRefreshToken = generateRefreshToken(tokenPayload);
        
        // Replace old refresh token with new one
        user.refreshTokens = user.refreshTokens.filter(
            token => token.token !== refreshToken
        );
        user.refreshTokens.push({ token: newRefreshToken });
        await user.save();
        
        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                expiresIn: process.env.JWT_EXPIRE || '7d'
            }
        });
        
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token'
        });
    }
};

// Logout user
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const userId = req.user?.userId;
        
        if (userId && refreshToken) {
            // Remove refresh token from user
            await User.updateOne(
                { _id: userId },
                { $pull: { refreshTokens: { token: refreshToken } } }
            );
        }
        
        res.json({
            success: true,
            message: 'Logout successful'
        });
        
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};

// Logout from all devices
const logoutAll = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Remove all refresh tokens
        await User.updateOne(
            { _id: userId },
            { $set: { refreshTokens: [] } }
        );
        
        res.json({
            success: true,
            message: 'Logged out from all devices'
        });
        
    } catch (error) {
        console.error('Logout all error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: { user }
        });
        
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile'
        });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.userId;
        
        // Get user with password
        const user = await User.findById(userId).select('+password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Verify current password
        const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
        
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        // Validate new password
        const validation = validatePassword(newPassword);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Password validation failed',
                errors: validation.errors
            });
        }
        
        // Check if new password is different from current
        const isSamePassword = await comparePassword(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from current password'
            });
        }
        
        // Update password
        user.password = newPassword; // Will be hashed by pre-save middleware
        await user.save();
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
        
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
};

// Update profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { firstName, lastName, profile } = req.body;
        
        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (profile) updateData.profile = { ...updateData.profile, ...profile };
        
        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user }
        });
        
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    logoutAll,
    getProfile,
    changePassword,
    updateProfile
};