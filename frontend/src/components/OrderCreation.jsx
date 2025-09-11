import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import OrderForm from './OrderForm';

const OrderCreation = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  // Check user permissions
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || !['admin', 'manager', 'cashier'].includes(user.role)) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // Load products for order creation
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await productService.getAllProducts({
        status: 'active' // Only show active products
      });
      
      if (result.success) {
        setProducts(result.data || []);
      } else {
        throw new Error(result.message || 'Failed to load products');
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle order submission
  const handleOrderSubmit = async (orderData) => {
    try {
      setOrderSubmitting(true);
      console.log('🔄 Submitting order:', orderData);

      // Validate order data
      const validation = orderService.validateOrder(orderData);
      if (!validation.isValid) {
        console.log('❌ Order validation failed:', validation.errors);
        return {
          success: false,
          message: 'Please fix the following errors:\n' + Object.values(validation.errors).join('\n')
        };
      }

      // Process payment if payment method requires it
      if (['card', 'digital'].includes(orderData.paymentMethod)) {
        console.log('🔄 Processing payment...');
        const paymentResult = await orderService.processPayment(orderData);
        
        if (!paymentResult.success) {
          return {
            success: false,
            message: paymentResult.message || 'Payment processing failed'
          };
        }
        
        // Add transaction data to order
        orderData.transactionId = paymentResult.data.transactionId;
        orderData.paymentStatus = 'paid';
      } else if (orderData.paymentMethod === 'cash') {
        orderData.paymentStatus = 'paid';
      } else {
        orderData.paymentStatus = 'pending';
      }

      // Create the order
      console.log('🔄 Creating order...');
      const result = await orderService.createOrder(orderData);
      
      if (result.success) {
        console.log('✅ Order created successfully:', result.data);
        
        // Show success message and optionally navigate
        setTimeout(() => {
          const shouldStayOnPage = window.confirm(
            `Order created successfully!\n\nOrder Number: ${result.data.orderNumber}\nTotal: $${result.data.total.toFixed(2)}\n\nWould you like to create another order?`
          );
          
          if (!shouldStayOnPage) {
            navigate('/orders');
          }
        }, 500);
        
        return {
          success: true,
          data: result.data,
          message: 'Order created successfully!'
        };
      } else {
        throw new Error(result.message || 'Failed to create order');
      }
      
    } catch (err) {
      console.error('❌ Error submitting order:', err);
      return {
        success: false,
        message: err.message || 'Failed to submit order. Please try again.'
      };
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadProducts}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No products available
  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Order</h1>
                <p className="mt-2 text-gray-600">Process customer orders and payments</p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          {/* No Products Message */}
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Products Available</h2>
            <p className="text-gray-600 mb-6">
              You need to add products before creating orders.
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Manage Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main order creation interface
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Order</h1>
              <p className="mt-2 text-gray-600">
                Process customer orders and payments ({products.length} products available)
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/orders')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                View Orders
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Order Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <OrderForm
            products={products}
            onSubmit={handleOrderSubmit}
            isSubmitting={orderSubmitting}
          />
        </div>

        {/* Footer Information */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>💡 Tip: Use the barcode scanner or search to quickly find products</p>
        </div>
      </div>
    </div>
  );
};

export default OrderCreation;