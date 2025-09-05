const Category = require('../models/Category');
const Product = require('../models/Product');

// Get all categories
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .sort({ name: 1 });
        
        res.json({
            success: true,
            data: categories,
            count: categories.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
};

// Get single category
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching category',
            error: error.message
        });
    }
};

// Get category with products
const getCategoryProducts = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        const products = await Product.find({ 
            category: req.params.id, 
            isActive: true 
        });
        
        res.json({
            success: true,
            data: {
                category,
                products,
                productCount: products.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching category products',
            error: error.message
        });
    }
};

// Create new category
const createCategory = async (req, res) => {
    try {
        const category = new Category(req.body);
        const savedCategory = await category.save();
        
        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: savedCategory
        });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                message: 'Category name already exists'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Error creating category',
                error: error.message
            });
        }
    }
};

// Update category
const updateCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating category',
            error: error.message
        });
    }
};

// Delete category
const deleteCategory = async (req, res) => {
    try {
        // Check if category has products
        const productCount = await Product.countDocuments({ 
            category: req.params.id, 
            isActive: true 
        });
        
        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. ${productCount} products are using this category.`
            });
        }
        
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            error: error.message
        });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    getCategoryProducts,
    createCategory,
    updateCategory,
    deleteCategory
};