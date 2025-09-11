import React, { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import OrderForm from './OrderForm';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeView, setActiveView] = useState('list'); // 'list', 'create', 'detail'
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  
  // Filter and search states
  const [filters, setFilters] = useState({
    status: 'all',
    paymentMethod: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Apply filters whenever orders or filters change
  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  // Load all required data
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [ordersResult, productsResult] = await Promise.all([
        orderService.getAllOrders(),
        productService.getAllProducts({ status: 'active' })
      ]);
      
      if (ordersResult.success) {
        setOrders(ordersResult.data || []);
      }
      
      if (productsResult.success) {
        setProducts(productsResult.data || []);
      }
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to orders
  const applyFilters = () => {
    let filtered = [...orders];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Payment method filter
    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter(order => order.paymentMethod === filters.paymentMethod);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(order => 
        new Date(order.createdAt) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(order => 
        new Date(order.createdAt) <= new Date(filters.dateTo + 'T23:59:59')
      );
    }

    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber?.toLowerCase().includes(searchTerm) ||
        order.customerName?.toLowerCase().includes(searchTerm) ||
        order._id?.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle order status update
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setLoading(true);
      const result = await orderService.updateOrderStatus(orderId, newStatus);
      
      if (result.success) {
        // Update local state
        setOrders(prev => prev.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
        
        // Update selected order if it's the one being modified
        if (selectedOrder?._id === orderId) {
          setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        throw new Error(result.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle order submission from OrderForm
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
        
        // Add the new order to the local state
        setOrders(prev => [result.data, ...prev]);
        
        // Show success message and switch back to list view
        setTimeout(() => {
          alert(`Order created successfully!\n\nOrder Number: ${result.data.orderNumber}\nTotal: $${result.data.total.toFixed(2)}`);
          setActiveView('list');
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

  // Get status badge styling
  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
      styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'
    }`;
  };

  // Get payment method icon
  const getPaymentIcon = (method) => {
    const icons = {
      cash: '💵',
      card: '💳',
      digital: '📱',
      bank_transfer: '🏦'
    };
    return icons[method] || '💰';
  };

  // Calculate order statistics
  const getOrderStats = () => {
    const stats = {
      total: filteredOrders.length,
      pending: filteredOrders.filter(o => o.status === 'pending').length,
      completed: filteredOrders.filter(o => o.status === 'completed').length,
      cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
      totalRevenue: filteredOrders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (o.total || 0), 0)
    };
    return stats;
  };

  // Pagination calculations
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const stats = getOrderStats();

  // Loading state
  if (loading && orders.length === 0 && products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
            <p className="mt-1 text-gray-600">Create new orders and manage existing orders</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* View Toggle Buttons */}
            <button
              onClick={() => setActiveView('list')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeView === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 View Orders
            </button>
            <button
              onClick={() => setActiveView('create')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeView === 'create'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ➕ Create Order
            </button>
            <button
              onClick={loadInitialData}
              disabled={loading}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {/* Statistics Cards - Only show on list view */}
        {activeView === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
              <div className="text-sm text-yellow-600">Pending</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-800">{stats.completed}</div>
              <div className="text-sm text-green-600">Completed</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-800">{stats.cancelled}</div>
              <div className="text-sm text-red-600">Cancelled</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-800">${stats.totalRevenue.toFixed(2)}</div>
              <div className="text-sm text-blue-600">Revenue</div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">❌</div>
            <div className="text-red-800">{error}</div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {activeView === 'create' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Products Available</h2>
              <p className="text-gray-600 mb-6">
                You need to add products before creating orders.
              </p>
            </div>
          ) : (
            <OrderForm
              products={products}
              onSubmit={handleOrderSubmit}
              isSubmitting={orderSubmitting}
            />
          )}
        </div>
      )}

      {activeView === 'list' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Orders</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Order #, customer..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Payment Method Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment</label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="digital">Digital</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Orders ({filteredOrders.length})
              </h3>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-500 mb-4">No orders match your current filters.</p>
                <button
                  onClick={() => setActiveView('create')}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Create First Order
                </button>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {order.orderNumber || order._id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {order.customerName || 'Walk-in Customer'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="mr-1">{getPaymentIcon(order.paymentMethod)}</span>
                              <span className="text-sm text-gray-900 capitalize">
                                {order.paymentMethod || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ${(order.total || 0).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={getStatusBadge(order.status)}>
                              {order.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setActiveView('detail');
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View
                              </button>
                              {order.status !== 'completed' && order.status !== 'cancelled' && (
                                <select
                                  value={order.status}
                                  onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                  className="text-sm border border-gray-300 rounded px-2 py-1"
                                  disabled={loading}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="processing">Processing</option>
                                  <option value="completed">Complete</option>
                                  <option value="cancelled">Cancel</option>
                                </select>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Order Detail View */}
      {activeView === 'detail' && selectedOrder && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Order Details: {selectedOrder.orderNumber || selectedOrder._id}
            </h3>
            <button
              onClick={() => setActiveView('list')}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              ← Back to Orders
            </button>
          </div>

          {/* Order Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedOrder.customerName || 'Walk-in Customer'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    <span className={getStatusBadge(selectedOrder.status)}>
                      {selectedOrder.status || 'pending'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <div className="mt-1 text-sm text-gray-900 flex items-center">
                    <span className="mr-2">{getPaymentIcon(selectedOrder.paymentMethod)}</span>
                    {selectedOrder.paymentMethod || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedOrder.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Order Totals */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Order Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${(selectedOrder.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>${(selectedOrder.tax || 0).toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount:</span>
                    <span>-${(selectedOrder.discount || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${(selectedOrder.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Order Items</label>
            <div className="border border-gray-200 rounded-lg">
              {selectedOrder.items?.map((item, index) => (
                <div key={item._id || index} className="flex justify-between items-center p-4 border-b border-gray-200 last:border-b-0">
                  <div>
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500">${item.price?.toFixed(2)} × {item.quantity}</div>
                  </div>
                  <div className="font-medium text-gray-900">
                    ${(item.subtotal || item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;