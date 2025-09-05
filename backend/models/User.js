const mongoose = require('mongoose');
const { hashPassword } = require('../utils/passwordUtils');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxLength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxLength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxLength: [20, 'Username cannot exceed 20 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long']
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'cashier', 'staff'],
        default: 'cashier'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        default: null
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },
    refreshTokens: [{
        token: String,
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 2592000 // 30 days
        }
    }],
    profile: {
        phone: {
            type: String,
            validate: {
                validator: function(v) {
                    return !v || /^\+?[\d\s-()]{8,15}$/.test(v);
                },
                message: 'Please enter a valid phone number'
            }
        },
        avatar: {
            type: String,
            default: null
        },
        // department: {
        //     type: String,
        //     enum: ['sales', 'inventory', 'management', 'support'],
        //     default: 'sales'
        // }
    }
}, {
    timestamps: true
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    // Only hash if password was modified
    if (!this.isModified('password')) return next();
    
    try {
        this.password = await hashPassword(this.password);
        next();
    } catch (error) {
        next(error);
    }
});

// Remove password from JSON output
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    delete user.refreshTokens;
    delete user.loginAttempts;
    delete user.lockUntil;
    return user;
};

// Account lock methods
userSchema.methods.incLoginAttempts = function() {
    // If we have previous lock and it's expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: {
                loginAttempts: 1
            },
            $unset: {
                lockUntil: 1
            }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
    }
    
    return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: {
            loginAttempts: 1,
            lockUntil: 1
        }
    });
};

module.exports = mongoose.model('User', userSchema);