const Customer = require('../models/Customer');

// Get all customers with search and filtering
const getAllCustomers = async (req, res) => {
    try {
        const { search, type, limit = 50, page = 1 } = req.query;
        let query = { isActive: true };
        
        // Search functionality
        if (search) {
            query.$text = { $search: search };
        }
        
        // Filter by customer type
        if (type) {
            query.customerType = type;
        }
        
        const skip = (page - 1) * limit;
        
        const customers = await Customer.find(query)
            .sort({ lastName: 1, firstName: 1 })
            .limit(parseInt(limit))
            .skip(skip);
        
        res.json({
            success: true,
            data: customers,
            count: customers.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching customers',
            error: error.message
        });
    }
};

// Get single customer
const getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        
        res.json({
            success: true,
            data: customer
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching customer',
            error: error.message
        });
    }
};

// Create new customer
const createCustomer = async (req, res) => {
    try {
        const customer = new Customer(req.body);
        const savedCustomer = await customer.save();
        
        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            data: savedCustomer
        });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                message: 'Email address already exists'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Error creating customer',
                error: error.message
            });
        }
    }
};

// Update customer
const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Customer updated successfully',
            data: customer
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating customer',
            error: error.message
        });
    }
};

// Delete customer (soft delete)
const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting customer',
            error: error.message
        });
    }
};

module.exports = {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
};