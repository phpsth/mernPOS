const mongoose = require('mongoose');

// OrderItem subdocument schema
const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    subtotal: {
        type: Number,
        required: true
    }
}, { _id: true });

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        default: null
    },
    customerName: {
        type: String,
        required: true
    },
    items: [orderItemSchema],
    subtotal: {
        type: Number,
        required: true,
        default: 0
    },
    tax: {
        type: Number,
        required: true,
        default: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'mobile'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    notes: {
        type: String,
        maxLength: 500
    }
}, {
    timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', function(next) {
    if (!this.orderNumber) {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        this.orderNumber = `ORD-${dateStr}-${randomNum}`;
    }
    next();
});

// Calculate totals before saving
orderSchema.pre('save', function() {
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.total = this.subtotal + this.tax - this.discount;
});

module.exports = mongoose.model('Order', orderSchema);