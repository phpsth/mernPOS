const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        validate: {
            validator: function(v) {
                return /^\+?[\d\s-()]{8,15}$/.test(v);
            },
            message: 'Please enter a valid phone number'
        }
    },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
        country: { type: String, default: 'USA', trim: true }
    },
    customerType: {
        type: String,
        enum: ['regular', 'vip', 'wholesale'],
        default: 'regular'
    },
    discount: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    }
}, {
    timestamps: true
});

// Virtual for full name
customerSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Index for search functionality
customerSchema.index({ 
    firstName: 'text', 
    lastName: 'text', 
    email: 'text',
    phone: 'text'
});

module.exports = mongoose.model('Customer', customerSchema);