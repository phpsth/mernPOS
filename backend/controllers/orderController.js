const Order = require('../models/Order');
const Product = require('../models/Product');

// Create new order with inventory management
const createOrder = async (req, res) => {
    try {
        const { items, customer, customerName, paymentMethod, tax, discount, notes } = req.body;
        
        // Validate and prepare order items with stock check
        const orderItems = [];
        const stockUpdates = [];
        
        for (let item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `Product not found: ${item.product}`
                });
            }
            
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
                });
            }
            
            orderItems.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                subtotal: product.price * item.quantity
            });
            
            // Prepare stock update
            stockUpdates.push({
                productId: product._id,
                newStock: product.stock - item.quantity
            });
        }
        
        // Create order
        const order = new Order({
            customer: customer || null,
            customerName: customerName || 'Walk-in Customer',
            items: orderItems,
            tax: tax || 0,
            discount: discount || 0,
            paymentMethod,
            notes
        });
        
        const savedOrder = await order.save();
        
        // Update product stock
        for (let update of stockUpdates) {
            await Product.findByIdAndUpdate(
                update.productId,
                { stock: update.newStock }
            );
        }
        
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: savedOrder
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
};

// Get all orders with filtering
const getAllOrders = async (req, res) => {
    try {
        const { status, startDate, endDate, customer, limit = 50, page = 1 } = req.query;
        
        let query = {};
        
        // Filter by status
        if (status) {
            query.status = status;
        }
        
        // Filter by date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        
        // Filter by customer
        if (customer) {
            query.customer = customer;
        }
        
        const skip = (page - 1) * limit;
        
        const orders = await Order.find(query)
            .populate('customer', 'firstName lastName phone email')
            .populate('items.product', 'name category')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);
        
        const total = await Order.countDocuments(query);
        
        res.json({
            success: true,
            data: orders,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / limit),
                count: orders.length,
                totalOrders: total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

// Get single order
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customer')
            .populate('items.product', 'name category');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: error.message
        });
    }
};

// Get daily sales report
const getDailySalesReport = async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
        
        const orders = await Order.find({
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: 'cancelled' }
        });
        
        const report = {
            date: startOfDay.toISOString().split('T')[0],
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
            averageOrderValue: orders.length > 0 ? 
                orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0,
            paymentMethods: {
                cash: orders.filter(o => o.paymentMethod === 'cash').length,
                card: orders.filter(o => o.paymentMethod === 'card').length,
                mobile: orders.filter(o => o.paymentMethod === 'mobile').length
            },
            orderStatus: {
                pending: orders.filter(o => o.status === 'pending').length,
                processing: orders.filter(o => o.status === 'processing').length,
                completed: orders.filter(o => o.status === 'completed').length
            }
        };
        
        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating sales report',
            error: error.message
        });
    }
};

// Update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { status, paymentStatus } = req.body;
        
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { 
                status: status || undefined,
                paymentStatus: paymentStatus || undefined
            },
            { new: true, runValidators: true }
        ).populate('customer', 'firstName lastName');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Order updated successfully',
            data: order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating order',
            error: error.message
        });
    }
};

module.exports = {
    createOrder,
    getAllOrders,
    getOrderById,
    getDailySalesReport,
    updateOrderStatus
};