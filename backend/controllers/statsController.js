const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// Get overview statistics
const getOverviewStats = async (req, res) => {
    try {
        const { period = '30' } = req.query; // Default to last 30 days
        const days = parseInt(period);
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        // Get total orders
        const totalOrders = await Order.countDocuments({
            createdAt: { $gte: startDate },
            status: { $ne: 'cancelled' }
        });
        
        // Get total revenue
        const revenueData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' }
                }
            }
        ]);
        
        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
        
        // Get active products count
        const totalProducts = await Product.countDocuments({ isActive: true });
        
        // Get registered customers count
        const totalCustomers = await Customer.countDocuments();
        
        // Get low stock products
        const lowStockProducts = await Product.countDocuments({
            stock: { $lte: 10 },
            isActive: true
        });
        
        // Get average order value
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Get top selling products
        const topProducts = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $ne: 'cancelled' }
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    name: { $first: '$items.name' },
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.subtotal' }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 }
        ]);
        
        // Calculate growth percentages (compare with previous period)
        const previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - days);
        
        const previousOrders = await Order.countDocuments({
            createdAt: { $gte: previousStartDate, $lt: startDate },
            status: { $ne: 'cancelled' }
        });
        
        const previousRevenueData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: previousStartDate, $lt: startDate },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' }
                }
            }
        ]);
        
        const previousRevenue = previousRevenueData.length > 0 ? previousRevenueData[0].totalRevenue : 0;
        
        const orderGrowth = previousOrders > 0 ? 
            ((totalOrders - previousOrders) / previousOrders * 100) : 0;
        const revenueGrowth = previousRevenue > 0 ? 
            ((totalRevenue - previousRevenue) / previousRevenue * 100) : 0;
        
        res.json({
            success: true,
            data: {
                overview: {
                    totalOrders,
                    totalRevenue: Math.round(totalRevenue * 100) / 100,
                    totalProducts,
                    totalCustomers,
                    lowStockProducts,
                    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
                    orderGrowth: Math.round(orderGrowth * 100) / 100,
                    revenueGrowth: Math.round(revenueGrowth * 100) / 100
                },
                topProducts,
                period: `${days} days`
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching overview stats',
            error: error.message
        });
    }
};

// Get sales statistics
const getSalesStats = async (req, res) => {
    try {
        const { period = '30', groupBy = 'day' } = req.query;
        const days = parseInt(period);
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        let groupFormat;
        switch (groupBy) {
            case 'hour':
                groupFormat = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' },
                    hour: { $hour: '$createdAt' }
                };
                break;
            case 'week':
                groupFormat = {
                    year: { $year: '$createdAt' },
                    week: { $week: '$createdAt' }
                };
                break;
            case 'month':
                groupFormat = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                };
                break;
            default: // day
                groupFormat = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                };
        }
        
        const salesData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: groupFormat,
                    totalSales: { $sum: '$total' },
                    totalOrders: { $sum: 1 },
                    avgOrderValue: { $avg: '$total' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);
        
        // Get payment method breakdown
        const paymentStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                    revenue: { $sum: '$total' }
                }
            }
        ]);
        
        res.json({
            success: true,
            data: {
                salesData,
                paymentStats,
                period: `${days} days`,
                groupBy
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching sales stats',
            error: error.message
        });
    }
};

// Get product statistics
const getProductStats = async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period);
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        // Get product performance
        const productPerformance = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $ne: 'cancelled' }
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    name: { $first: '$items.name' },
                    totalQuantitySold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.subtotal' },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            {
                $addFields: {
                    currentStock: { $arrayElemAt: ['$productInfo.stock', 0] },
                    category: { $arrayElemAt: ['$productInfo.category', 0] }
                }
            },
            { $sort: { totalQuantitySold: -1 } }
        ]);
        
        // Get category performance
        const categoryPerformance = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $ne: 'cancelled' }
                }
            },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'productInfo.category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            {
                $group: {
                    _id: { $arrayElemAt: ['$categoryInfo._id', 0] },
                    categoryName: { $first: { $arrayElemAt: ['$categoryInfo.name', 0] } },
                    totalQuantitySold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.subtotal' },
                    uniqueProducts: { $addToSet: '$items.product' }
                }
            },
            {
                $addFields: {
                    uniqueProductCount: { $size: '$uniqueProducts' }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);
        
        // Get stock levels
        const stockLevels = await Product.aggregate([
            {
                $match: { isActive: true }
            },
            {
                $group: {
                    _id: null,
                    outOfStock: {
                        $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] }
                    },
                    lowStock: {
                        $sum: { $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', 10] }] }, 1, 0] }
                    },
                    goodStock: {
                        $sum: { $cond: [{ $gt: ['$stock', 10] }, 1, 0] }
                    },
                    totalProducts: { $sum: 1 }
                }
            }
        ]);
        
        res.json({
            success: true,
            data: {
                productPerformance,
                categoryPerformance,
                stockLevels: stockLevels[0] || {
                    outOfStock: 0,
                    lowStock: 0,
                    goodStock: 0,
                    totalProducts: 0
                },
                period: `${days} days`
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching product stats',
            error: error.message
        });
    }
};

// Get customer statistics
const getCustomerStats = async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period);
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        // Get top customers
        const topCustomers = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $ne: 'cancelled' },
                    customer: { $ne: null }
                }
            },
            {
                $group: {
                    _id: '$customer',
                    customerName: { $first: '$customerName' },
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$total' },
                    avgOrderValue: { $avg: '$total' }
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 10 }
        ]);
        
        // Get customer acquisition stats
        const newCustomers = await Customer.countDocuments({
            createdAt: { $gte: startDate }
        });
        
        const totalCustomers = await Customer.countDocuments();
        
        // Get customer order frequency
        const orderFrequency = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $ne: 'cancelled' },
                    customer: { $ne: null }
                }
            },
            {
                $group: {
                    _id: '$customer',
                    orderCount: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$orderCount',
                    customerCount: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);
        
        res.json({
            success: true,
            data: {
                topCustomers,
                newCustomers,
                totalCustomers,
                orderFrequency,
                period: `${days} days`
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching customer stats',
            error: error.message
        });
    }
};

// Get revenue statistics with forecasting
const getRevenueStats = async (req, res) => {
    try {
        const { period = '30', forecast = false } = req.query;
        const days = parseInt(period);
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        // Get daily revenue for the period
        const dailyRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);
        
        // Get monthly comparison
        const monthlyComparison = await Order.aggregate([
            {
                $match: {
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { '_id': -1 } },
            { $limit: 12 }
        ]);
        
        // Calculate growth trends
        const totalRevenue = dailyRevenue.reduce((sum, day) => sum + day.revenue, 0);
        const avgDailyRevenue = dailyRevenue.length > 0 ? totalRevenue / dailyRevenue.length : 0;
        
        // Simple forecast based on average (if requested)
        let forecastData = null;
        if (forecast === 'true') {
            const forecastDays = 7;
            forecastData = Array.from({ length: forecastDays }, (_, i) => {
                const forecastDate = new Date();
                forecastDate.setDate(forecastDate.getDate() + i + 1);
                return {
                    date: forecastDate.toISOString().split('T')[0],
                    predictedRevenue: Math.round(avgDailyRevenue * (0.9 + Math.random() * 0.2) * 100) / 100
                };
            });
        }
        
        res.json({
            success: true,
            data: {
                dailyRevenue,
                monthlyComparison,
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                avgDailyRevenue: Math.round(avgDailyRevenue * 100) / 100,
                forecastData,
                period: `${days} days`
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching revenue stats',
            error: error.message
        });
    }
};

module.exports = {
    getOverviewStats,
    getSalesStats,
    getProductStats,
    getCustomerStats,
    getRevenueStats
};