// Role-based authorization middleware
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            
            // Check if user role is in allowed roles
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions',
                    required: allowedRoles,
                    current: req.user.role
                });
            }
            
            next();
            
        } catch (error) {
            console.error('Authorization error:', error);
            res.status(500).json({
                success: false,
                message: 'Authorization failed'
            });
        }
    };
};

// Permission-based authorization
const authorizePermissions = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            
            // Get user permissions based on role
            const userPermissions = getRolePermissions(req.user.role);
            
            // Check if user has all required permissions
            const hasPermissions = requiredPermissions.every(
                permission => userPermissions.includes(permission)
            );
            
            if (!hasPermissions) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions',
                    required: requiredPermissions,
                    available: userPermissions
                });
            }
            
            next();
            
        } catch (error) {
            console.error('Permission authorization error:', error);
            res.status(500).json({
                success: false,
                message: 'Authorization failed'
            });
        }
    };
};

// Resource ownership check
const authorizeOwnership = (resourceParam = 'id') => {
    return (req, res, next) => {
        try {
            const resourceId = req.params[resourceParam];
            const userId = req.user.userId;
            
            // Admin and managers can access any resource
            if (['admin', 'manager'].includes(req.user.role)) {
                return next();
            }
            
            // For other roles, check if they own the resource
            // This would need to be implemented per resource type
            // For now, we'll just pass through
            next();
            
        } catch (error) {
            console.error('Ownership authorization error:', error);
            res.status(500).json({
                success: false,
                message: 'Authorization failed'
            });
        }
    };
};

// Get permissions for a role
const getRolePermissions = (role) => {
    const rolePermissions = {
        admin: [
            'users.create', 'users.read', 'users.update', 'users.delete',
            'products.create', 'products.read', 'products.update', 'products.delete',
            'categories.create', 'categories.read', 'categories.update', 'categories.delete',
            'customers.create', 'customers.read', 'customers.update', 'customers.delete',
            'orders.create', 'orders.read', 'orders.update', 'orders.delete',
            'reports.read', 'system.manage'
        ],
        manager: [
            'products.create', 'products.read', 'products.update', 'products.delete',
            'categories.create', 'categories.read', 'categories.update', 'categories.delete',
            'customers.create', 'customers.read', 'customers.update', 'customers.delete',
            'orders.create', 'orders.read', 'orders.update',
            'reports.read', 'inventory.manage'
        ],
        cashier: [
            'products.read',
            'categories.read',
            'customers.create', 'customers.read', 'customers.update',
            'orders.create', 'orders.read', 'orders.update',
            'inventory.update'
        ],
        staff: [
            'products.read',
            'categories.read',
            'customers.read',
            'orders.read'
        ]
    };
    
    return rolePermissions[role] || [];
};

module.exports = {
    authorize,
    authorizePermissions,
    authorizeOwnership,
    getRolePermissions
};