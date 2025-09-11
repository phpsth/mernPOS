import { ordersAPI } from './api';

export const orderService = {
  // Get all orders with enhanced filtering
  getAllOrders: async (params = {}) => {
    try {
      console.log('🔄 Fetching orders...');
      const response = await ordersAPI.getAll(params);
      console.log('✅ Orders fetched successfully');
      
      return {
        success: true,
        data: response.data || response || [],
        message: 'Orders fetched successfully'
      };
    } catch (error) {
      console.error('❌ Failed to fetch orders:', error.message);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch orders. Please check your connection and try again.',
        error: error.response?.data
      };
    }
  },

  // Backward compatibility
  getOrders: async () => {
    const result = await orderService.getAllOrders();
    return result.data;
  },

  // Get order by ID
  getOrderById: async (id) => {
    try {
      console.log(`🔄 Fetching order ${id}...`);
      const response = await ordersAPI.getById(id);
      console.log('✅ Order fetched successfully');
      
      return {
        success: true,
        data: response.data || response,
        message: 'Order fetched successfully'
      };
    } catch (error) {
      console.error(`❌ Failed to fetch order ${id}:`, error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch order',
        error: error.response?.data
      };
    }
  },

  // Create order with enhanced validation and calculations
  createOrder: async (orderData) => {
    try {
      console.log('🔄 Creating new order...', orderData);
      
      // Calculate totals if not provided
      const processedOrderData = {
        ...orderData,
        ...orderService.calculateOrderTotals(orderData)
      };
      
      const response = await ordersAPI.create(processedOrderData);
      console.log('✅ Order created successfully');
      
      return {
        success: true,
        data: response.data || response,
        message: 'Order created successfully'
      };
    } catch (error) {
      console.error('❌ Failed to create order:', error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create order',
        error: error.response?.data
      };
    }
  },

  // Update order
  updateOrder: async (id, orderData) => {
    try {
      console.log(`🔄 Updating order ${id}...`, orderData);
      const response = await ordersAPI.update(id, orderData);
      console.log('✅ Order updated successfully');
      
      return {
        success: true,
        data: response.data || response,
        message: 'Order updated successfully'
      };
    } catch (error) {
      console.error(`❌ Failed to update order ${id}:`, error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update order',
        error: error.response?.data
      };
    }
  },

  // Update order status
  updateOrderStatus: async (id, status) => {
    try {
      console.log(`🔄 Updating order status ${id} to ${status}...`);
      const response = await ordersAPI.updateStatus(id, status);
      console.log('✅ Order status updated successfully');
      
      return {
        success: true,
        data: response.data || response,
        message: 'Order status updated successfully'
      };
    } catch (error) {
      console.error(`❌ Failed to update order status ${id}:`, error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update order status',
        error: error.response?.data
      };
    }
  },

  // Calculate order totals
  calculateOrderTotals: (orderData) => {
    const { items = [], tax = 0, discount = 0 } = orderData;
    
    // Calculate subtotal from items
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    // Calculate tax amount (can be percentage or fixed amount)
    let taxAmount = tax;
    if (orderData.taxRate) {
      taxAmount = subtotal * (orderData.taxRate / 100);
    }
    
    // Calculate discount amount (can be percentage or fixed amount)
    let discountAmount = discount;
    if (orderData.discountRate) {
      discountAmount = subtotal * (orderData.discountRate / 100);
    }
    
    // Calculate final total
    const total = subtotal + taxAmount - discountAmount;
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(taxAmount * 100) / 100,
      discount: Math.round(discountAmount * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  },

  // Validate order data
  validateOrder: (orderData) => {
    const errors = {};
    
    // Check required fields
    if (!orderData.customerName || !orderData.customerName.trim()) {
      errors.customerName = 'Customer name is required';
    }
    
    if (!orderData.items || orderData.items.length === 0) {
      errors.items = 'At least one item is required';
    }
    
    if (!orderData.paymentMethod) {
      errors.paymentMethod = 'Payment method is required';
    }
    
    // Validate items
    if (orderData.items) {
      orderData.items.forEach((item, index) => {
        if (!item.product || !item.name) {
          errors[`item_${index}`] = 'Invalid item data';
        }
        if (item.quantity <= 0) {
          errors[`item_${index}_quantity`] = 'Item quantity must be greater than 0';
        }
        if (item.price < 0) {
          errors[`item_${index}_price`] = 'Item price cannot be negative';
        }
      });
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Process payment (simulation)
  processPayment: async (orderData) => {
    try {
      console.log('🔄 Processing payment...', orderData.paymentMethod);
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate payment success/failure
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        console.log('✅ Payment processed successfully');
        return {
          success: true,
          data: {
            transactionId: `TXN-${Date.now()}`,
            paymentMethod: orderData.paymentMethod,
            amount: orderData.total,
            status: 'completed'
          },
          message: 'Payment processed successfully'
        };
      } else {
        console.log('❌ Payment failed');
        return {
          success: false,
          message: 'Payment processing failed. Please try again.',
          error: 'Payment gateway error'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Payment processing error',
        error: error.message
      };
    }
  },

  // Generate receipt data
  generateReceipt: (order) => {
    return {
      ...order,
      receiptNumber: `RCP-${order.orderNumber}`,
      printedAt: new Date().toISOString(),
      cashier: JSON.parse(localStorage.getItem('user') || '{}'),
      store: {
        name: 'POS Store',
        address: '123 Main Street',
        phone: '+1 (555) 123-4567',
        taxId: 'TAX123456789'
      }
    };
  }
};