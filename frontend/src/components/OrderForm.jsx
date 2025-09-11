import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import CartItems from './CartItems';
import PaymentForm from './PaymentForm';
import OrderSummary from './OrderSummary';

const OrderForm = ({ onSuccess, onCancel, initialItems = [] }) => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Items, 2: Customer, 3: Payment, 4: Review
  const [cartItems, setCartItems] = useState(initialItems);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [customerData, setCustomerData] = useState({
    customerName: '',
    phone: '',
    email: '',
    notes: ''
  });

  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'cash',
    amountReceived: '',
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    digitalWallet: 'paypal',
    notes: ''
  });

  const [orderTotals, setOrderTotals] = useState({
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    taxRate: 10,
    discountType: 'fixed',
    discountValue: 0
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const result = await productService.getAllProducts();
      if (result.success) {
        setProducts(result.data.filter(product => product.isActive !== false));
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Filter products for search
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm);
    
    const matchesCategory = !selectedCategory || 
      product.category?._id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from products
  const categories = products.reduce((acc, product) => {
    if (product.category && !acc.find(cat => cat._id === product.category._id)) {
      acc.push(product.category);
    }
    return acc;
  }, []);

  // Add product to cart
  const addToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => (item.id || item._id) === (product.id || product._id));
      
      if (existingItem) {
        // Check stock limit
        if (product.stock !== undefined && existingItem.quantity >= product.stock) {
          setSubmitStatus({
            type: 'error',
            message: `Cannot add more ${product.name}. Stock limit reached.`
          });
          setTimeout(() => setSubmitStatus(null), 3000);
          return prevItems;
        }
        
        return prevItems.map(item =>
          (item.id || item._id) === (product.id || product._id)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        const cartItem = {
          id: product.id || product._id,
          _id: product.id || product._id,
          product: product.id || product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
          category: product.category,
          stock: product.stock
        };
        
        return [...prevItems, cartItem];
      }
    });
  };

  // Update cart item quantity
  const updateCartQuantity = (productId, newQuantity, item) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    // Check stock limit
    const product = products.find(p => (p.id || p._id) === productId);
    if (product && product.stock !== undefined && newQuantity > product.stock) {
      setSubmitStatus({
        type: 'error',
        message: `Cannot add more ${item.name}. Only ${product.stock} in stock.`
      });
      setTimeout(() => setSubmitStatus(null), 3000);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        (item.id || item._id) === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCartItems(prevItems =>
      prevItems.filter(item => (item.id || item._id) !== productId)
    );
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Handle step navigation
  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step) => {
    setCurrentStep(step);
  };

  // Validation for each step
  const validateCurrentStep = () => {
    const newErrors = {};

    switch (currentStep) {
      case 1: // Items
        if (cartItems.length === 0) {
          newErrors.items = 'Please add at least one item to the cart';
        }
        break;

      case 2: // Customer
        if (!customerData.customerName.trim()) {
          newErrors.customerName = 'Customer name is required';
        }
        if (customerData.email && !/\S+@\S+\.\S+/.test(customerData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
        break;

      case 3: // Payment
        if (!paymentData.paymentMethod) {
          newErrors.paymentMethod = 'Please select a payment method';
        }
        
        if (paymentData.paymentMethod === 'cash') {
          const received = parseFloat(paymentData.amountReceived);
          if (!received || received < orderTotals.total) {
            newErrors.amountReceived = 'Amount received must be at least the total amount';
          }
        }
        
        if (paymentData.paymentMethod === 'card') {
          if (!paymentData.cardNumber || paymentData.cardNumber.replace(/\s/g, '').length < 13) {
            newErrors.cardNumber = 'Please enter a valid card number';
          }
          if (!paymentData.cardHolder || paymentData.cardHolder.trim().length < 2) {
            newErrors.cardHolder = 'Please enter the cardholder name';
          }
          if (!paymentData.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) {
            newErrors.expiryDate = 'Please enter expiry date (MM/YY)';
          }
          if (!paymentData.cvv || paymentData.cvv.length < 3) {
            newErrors.cvv = 'Please enter a valid CVV';
          }
        }
        break;
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setSubmitStatus({
        type: 'error',
        message: Object.values(newErrors)[0]
      });
      setTimeout(() => setSubmitStatus(null), 3000);
    }

    return Object.keys(newErrors).length === 0;
  };

  // Submit order
  const handleSubmitOrder = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Prepare order data
      const orderData = {
        customerName: customerData.customerName,
        phone: customerData.phone,
        email: customerData.email,
        items: cartItems.map(item => ({
          product: item.product || item.id || item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        paymentMethod: paymentData.paymentMethod,
        taxRate: orderTotals.taxRate,
        discountType: orderTotals.discountType,
        discountValue: orderTotals.discountValue,
        notes: customerData.notes
      };

      // Validate order
      const validation = orderService.validateOrder(orderData);
      if (!validation.isValid) {
        setSubmitStatus({
          type: 'error',
          message: Object.values(validation.errors)[0]
        });
        return;
      }

      // Process payment first (simulation)
      const paymentResult = await orderService.processPayment({
        ...paymentData,
        total: orderTotals.total
      });

      if (!paymentResult.success) {
        setSubmitStatus({
          type: 'error',
          message: paymentResult.message
        });
        return;
      }

      // Create order
      const result = await orderService.createOrder(orderData);

      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: `Order ${result.data.orderNumber} created successfully!`
        });
        
        // Call success callback after a short delay
        setTimeout(() => {
          onSuccess && onSuccess(result.data);
        }, 1500);
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.message || 'Failed to create order'
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'An unexpected error occurred'
      });
      console.error('Order creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step indicator component
  const StepIndicator = () => {
    const steps = [
      { number: 1, title: 'Items', icon: '🛒' },
      { number: 2, title: 'Customer', icon: '👤' },
      { number: 3, title: 'Payment', icon: '💳' },
      { number: 4, title: 'Review', icon: '📋' }
    ];

    return (
      <div className="flex items-center justify-center space-x-4 mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <button
              onClick={() => goToStep(step.number)}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                currentStep === step.number
                  ? 'bg-blue-100 text-blue-700'
                  : currentStep > step.number
                  ? 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                currentStep > step.number ? 'bg-green-500 text-white' : ''
              }`}>
                {currentStep > step.number ? '✓' : step.icon}
              </div>
              <span className="text-xs font-medium">{step.title}</span>
            </button>
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${
                currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <StepIndicator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Step 1: Items */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Items to Order</h2>
                
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Grid */}
                {isLoadingProducts ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading products...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id || product._id}
                        product={product}
                        onAddToCart={() => addToCart(product)}
                      />
                    ))}
                  </div>
                )}

                {filteredProducts.length === 0 && !isLoadingProducts && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">📦</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-500">Try adjusting your search or filter</p>
                  </div>
                )}
              </div>

              {/* Cart Items */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <CartItems
                  items={cartItems}
                  onUpdateQuantity={updateCartQuantity}
                  onRemoveItem={removeFromCart}
                  onClearCart={clearCart}
                />
              </div>
            </div>
          )}

          {/* Step 2: Customer Information */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    value={customerData.customerName}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, customerName: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.customerName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.customerName && <p className="text-red-600 text-sm mt-1">{errors.customerName}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={customerData.phone}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={customerData.email}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Order Notes
                  </label>
                  <textarea
                    id="notes"
                    rows={4}
                    value={customerData.notes}
                    onChange={(e) => setCustomerData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special instructions or notes for this order..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Information</h2>
              
              <PaymentForm
                total={orderTotals.total}
                onPaymentDataChange={(data) => setPaymentData(data)}
                initialData={paymentData}
              />
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Order</h2>
                
                <CartItems
                  items={cartItems}
                  readOnly={true}
                  showActions={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Order Summary */}
        <div className="lg:col-span-1">
          <OrderSummary
            items={cartItems}
            customerData={customerData}
            paymentData={paymentData}
            onTotalsChange={setOrderTotals}
            editable={currentStep <= 3}
          />
        </div>
      </div>

      {/* Status Messages */}
      {submitStatus && (
        <div className={`mt-6 p-4 rounded-md ${
          submitStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <p className={submitStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}>
            {submitStatus.message}
          </p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <div className="flex space-x-4">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Previous
            </button>
          )}

          {currentStep < 4 && (
            <button
              type="button"
              onClick={nextStep}
              disabled={currentStep === 1 && cartItems.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          )}

          {currentStep === 4 && (
            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {isSubmitting ? 'Processing...' : 'Place Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, onAddToCart }) => {
  const stockStatus = product.stock <= 0 
    ? { color: 'bg-red-100 text-red-800', label: 'Out of Stock' }
    : product.stock <= 10 
    ? { color: 'bg-yellow-100 text-yellow-800', label: 'Low Stock' }
    : { color: 'bg-green-100 text-green-800', label: 'In Stock' };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <span className="text-gray-400 text-2xl">📦</span>
      </div>
      
      <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">{product.name}</h3>
      <p className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</p>
      
      <div className="flex items-center justify-between mt-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
          {stockStatus.label}
        </span>
        <button
          onClick={onAddToCart}
          disabled={product.stock <= 0}
          className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default OrderForm;