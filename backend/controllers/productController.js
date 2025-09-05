const Product = require('../models/Product.js');

// Get all products with search and filtering
const getAllProducts = async (req, res) => {
    try {
        const { search, category, lowStock, isActive = true, limit = 50, page = 1 } = req.query;
        
        let query = { isActive };
        
        // Search by name or description
        if (search) {
            query.$text = { $search: search };
        }
        
        // Filter by category
        if (category) {
            query.category = category;
        }
        
        // Filter for low stock products
        if (lowStock === 'true') {
            query.stock = { $lt: 10 };
        }
        
        const skip = (page - 1) * limit;
        
        const products = await Product.find(query)
            .populate('category', 'name color')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);
        
        res.json({
            success: true,
            data: products,
            count: products.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
};

// Get single product by ID
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name description');
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
};

// Create new product
const createProduct = async (req, res) => {
    try {
        const product = new Product(req.body);
        const savedProduct = await product.save();
        
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: savedProduct
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
};

// Update product
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
};

// Update product stock
const updateStock = async (req, res) => {
    try {
        const { stock, operation } = req.body; // operation: 'add' or 'set'
        
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        if (operation === 'add') {
            product.stock += parseInt(stock);
        } else {
            product.stock = parseInt(stock);
        }
        
        const updatedProduct = await product.save();
        
        res.json({
            success: true,
            message: 'Stock updated successfully',
            data: updatedProduct
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating stock',
            error: error.message
        });
    }
};

// Delete product (soft delete)
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
};

// Get low stock products
const getLowStockProducts = async (req, res) => {
    try {
        const threshold = req.query.threshold || 10;
        
        const lowStockProducts = await Product.find({
            stock: { $lt: parseInt(threshold) },
            isActive: true
        })
        .populate('category', 'name');
        
        res.json({
            success: true,
            data: lowStockProducts,
            count: lowStockProducts.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching low stock products',
            error: error.message
        });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    updateStock,
    deleteProduct,
    getLowStockProducts
};