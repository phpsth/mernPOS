import { useState } from "react";
import { orderService } from '../services/orderService';

function Cart({ cartItems = [], isOpen, onClose, onUpdateItem, onRemoveItem, onClearCart }) {
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Cart, 2: Customer, 3: Payment, 4: Review
  const [isProcessing, setIsProcessing] = useState(false);
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

  const tax = 0.1; // 10%
  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = Number(item.price) || 0;
    const itemQuantity = Number(item.quantity) || 1;
    return sum + (itemPrice * itemQuantity);
  }, 0);
  const taxAmount = subtotal * tax;
  const total = subtotal + taxAmount;

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity < 1) return;
    onUpdateItem(id, newQuantity);
  };

  const handleCustomerDataChange = (field, value) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePaymentDataChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetCheckout = () => {
    setCheckoutStep(1);
    setCustomerData({
      customerName: '',
      phone: '',
      email: '',
      notes: ''
    });
    setPaymentData({
      paymentMethod: 'cash',
      amountReceived: '',
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      cvv: '',
      digitalWallet: 'paypal',
      notes: ''
    });
  };

  const handleClose = () => {
    resetCheckout();
    onClose();
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) return;
    setCheckoutStep(2);
  };

  const handleCompleteOrder = async () => {
    try {
      setIsProcessing(true);

      // Validate cart items first
      const invalidItems = cartItems.filter(item => 
        !item.name || 
        !item.price || 
        item.price <= 0 || 
        !item.quantity || 
        item.quantity <= 0 ||
        (!item.id && !item._id)
      );

      if (invalidItems.length > 0) {
        console.error('Invalid cart items found:', invalidItems);
        alert('Some cart items have invalid data. Please refresh the page and try again.');
        setIsProcessing(false);
        return;
      }

      console.log('Cart items validation passed:', cartItems);

      // Prepare order data
      const orderData = {
        customerName: customerData.customerName || 'Walk-in Customer',
        phone: customerData.phone,
        email: customerData.email,
        notes: customerData.notes,
        items: cartItems.map(item => ({
          product: item.id || item._id, // Handle both id and _id
          name: item.name,
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          subtotal: (Number(item.price) || 0) * (Number(item.quantity) || 1)
        })),
        subtotal: Number(subtotal.toFixed(2)),
        tax: Number(taxAmount.toFixed(2)),
        discount: 0,
        total: Number(total.toFixed(2)),
        paymentMethod: paymentData.paymentMethod,
        amountReceived: paymentData.amountReceived ? Number(paymentData.amountReceived) : undefined,
        paymentNotes: paymentData.notes
      };

      // Validate order
      const validation = orderService.validateOrder(orderData);
      if (!validation.isValid) {
        alert('Please fill in all required fields:\n' + Object.values(validation.errors).join('\n'));
        return;
      }

      // Process payment if needed
      if (['card', 'digital'].includes(paymentData.paymentMethod)) {
        const paymentResult = await orderService.processPayment(orderData);
        if (!paymentResult.success) {
          alert('Payment failed: ' + paymentResult.message);
          return;
        }
        orderData.transactionId = paymentResult.data.transactionId;
      }

      // Create order
      const result = await orderService.createOrder(orderData);
      
      if (result.success) {
        alert(`Order created successfully!\n\nOrder Number: ${result.data.orderNumber}\nTotal: $${result.data.total.toFixed(2)}`);
        
        // Clear cart and close
        onClearCart();
        handleClose();
      } else {
        throw new Error(result.message || 'Failed to create order');
      }
      
    } catch (error) {
      console.error('Order creation failed:', error);
      alert('Failed to create order: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-2 mb-6">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step <= checkoutStep 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-300 text-gray-600'
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`w-8 h-0.5 ${
              step < checkoutStep ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderCartStep = () => (
    <div className="flex-1 overflow-y-auto p-6">
      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8l1.25 5.5h9.25M7 13v8a2 2 0 002 2h8a2 2 0 002-2v-8M7 13l-1.25-5.5" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">Cart is empty</p>
          <p className="text-gray-400 text-sm mt-1">Add some products to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cartItems.map((item) => {
            const itemId = item.id || item._id;
            const itemPrice = Number(item.price) || 0;
            const itemQuantity = Number(item.quantity) || 1;
            const itemName = item.name || 'Unknown Item';
            
            return (
              <div key={itemId} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 flex-1 pr-4">
                    {itemName}
                  </h4>
                  <button
                    onClick={() => onRemoveItem(itemId)}
                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center bg-white rounded-lg border border-gray-200">
                    <button
                      onClick={() => handleQuantityChange(itemId, itemQuantity - 1)}
                      className="p-2 hover:bg-gray-50 rounded-l-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="px-4 py-2 font-medium text-gray-900 min-w-[50px] text-center">
                      {itemQuantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(itemId, itemQuantity + 1)}
                      className="p-2 hover:bg-gray-50 rounded-r-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      ${(itemPrice * itemQuantity).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      ${itemPrice.toFixed(2)} each
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderCustomerStep = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
        <input
          type="text"
          value={customerData.customerName}
          onChange={(e) => handleCustomerDataChange('customerName', e.target.value)}
          placeholder="Enter customer name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
        <input
          type="tel"
          value={customerData.phone}
          onChange={(e) => handleCustomerDataChange('phone', e.target.value)}
          placeholder="Enter phone number"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
        <input
          type="email"
          value={customerData.email}
          onChange={(e) => handleCustomerDataChange('email', e.target.value)}
          placeholder="Enter email address"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
        <textarea
          value={customerData.notes}
          onChange={(e) => handleCustomerDataChange('notes', e.target.value)}
          placeholder="Any special instructions..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method *</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'cash', name: 'Cash', icon: '💵' },
            { id: 'card', name: 'Card', icon: '💳' },
            { id: 'digital', name: 'Digital', icon: '📱' },
            { id: 'bank_transfer', name: 'Bank', icon: '🏦' }
          ].map((method) => (
            <button
              key={method.id}
              onClick={() => handlePaymentDataChange('paymentMethod', method.id)}
              className={`p-3 border-2 rounded-lg text-left transition-all ${
                paymentData.paymentMethod === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-xl">{method.icon}</span>
                <span className="font-medium">{method.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {paymentData.paymentMethod === 'cash' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount Received *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">$</span>
            </div>
            <input
              type="number"
              step="0.01"
              min={total}
              value={paymentData.amountReceived}
              onChange={(e) => handlePaymentDataChange('amountReceived', e.target.value)}
              placeholder={total.toFixed(2)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {paymentData.amountReceived && (
            <div className="mt-2 p-3 bg-green-50 rounded-lg">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-green-800">Change:</span>
                <span className="text-lg font-bold text-green-900">
                  ${Math.max(0, parseFloat(paymentData.amountReceived || 0) - total).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {paymentData.paymentMethod === 'card' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Card Number *</label>
            <input
              type="text"
              value={paymentData.cardNumber}
              onChange={(e) => handlePaymentDataChange('cardNumber', e.target.value)}
              placeholder="1234 5678 9012 3456"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name *</label>
            <input
              type="text"
              value={paymentData.cardHolder}
              onChange={(e) => handlePaymentDataChange('cardHolder', e.target.value)}
              placeholder="John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expiry *</label>
              <input
                type="text"
                value={paymentData.expiryDate}
                onChange={(e) => handlePaymentDataChange('expiryDate', e.target.value)}
                placeholder="MM/YY"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CVV *</label>
              <input
                type="text"
                value={paymentData.cvv}
                onChange={(e) => handlePaymentDataChange('cvv', e.target.value)}
                placeholder="123"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {paymentData.paymentMethod === 'digital' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Digital Wallet *</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'paypal', name: 'PayPal', icon: '🅿️' },
              { id: 'apple_pay', name: 'Apple Pay', icon: '🍎' },
              { id: 'google_pay', name: 'Google Pay', icon: '🅖' },
              { id: 'alipay', name: 'Alipay', icon: '🅰️' }
            ].map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handlePaymentDataChange('digitalWallet', wallet.id)}
                className={`p-3 border-2 rounded-lg text-center transition-all ${
                  paymentData.digitalWallet === wallet.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-xl mb-1">{wallet.icon}</div>
                <div className="text-sm font-medium">{wallet.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderReviewStep = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Customer Info */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Customer Information</h4>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-900">
            <div><strong>Name:</strong> {customerData.customerName || 'Walk-in Customer'}</div>
            {customerData.phone && <div><strong>Phone:</strong> {customerData.phone}</div>}
            {customerData.email && <div><strong>Email:</strong> {customerData.email}</div>}
            {customerData.notes && <div><strong>Notes:</strong> {customerData.notes}</div>}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Order Items</h4>
        <div className="space-y-2">
          {cartItems.map((item) => {
            const itemId = item.id || item._id;
            const itemPrice = Number(item.price) || 0;
            const itemQuantity = Number(item.quantity) || 1;
            const itemName = item.name || 'Unknown Item';
            
            return (
              <div key={itemId} className="flex justify-between items-center py-2 border-b border-gray-200">
                <div>
                  <div className="font-medium text-gray-900">{itemName}</div>
                  <div className="text-sm text-gray-500">${itemPrice.toFixed(2)} × {itemQuantity}</div>
                </div>
                <div className="font-medium text-gray-900">
                  ${(itemPrice * itemQuantity).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Method</h4>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-900 capitalize">
            {paymentData.paymentMethod}
            {paymentData.paymentMethod === 'digital' && ` (${paymentData.digitalWallet})`}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleClose}
        />
      )}
      
      {/* Cart Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              {checkoutStep === 1 ? 'Shopping Cart' : 
               checkoutStep === 2 ? 'Customer Info' :
               checkoutStep === 3 ? 'Payment' : 'Review Order'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step Indicator */}
          {checkoutStep > 1 && (
            <div className="px-6 py-4 border-b border-gray-200">
              {renderStepIndicator()}
            </div>
          )}
          
          {/* Content */}
          {checkoutStep === 1 && renderCartStep()}
          {checkoutStep === 2 && renderCustomerStep()}
          {checkoutStep === 3 && renderPaymentStep()}
          {checkoutStep === 4 && renderReviewStep()}

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-gray-200 p-6">
              {checkoutStep === 1 && (
                <>
                  <button 
                    onClick={onClearCart}
                    className="w-full mb-4 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-300 hover:border-red-400 rounded-lg transition-colors"
                  >
                    Clear Cart
                  </button>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax (10%)</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
                      <span>Total</span>
                      <span className="text-blue-600">${total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={proceedToCheckout}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                  >
                    Proceed to Checkout
                  </button>
                </>
              )}

              {checkoutStep > 1 && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => setCheckoutStep(checkoutStep - 1)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  
                  {checkoutStep < 4 ? (
                    <button
                      onClick={() => setCheckoutStep(checkoutStep + 1)}
                      disabled={checkoutStep === 2 && !customerData.customerName.trim()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      onClick={handleCompleteOrder}
                      disabled={isProcessing}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <span>Complete Order</span>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Cart;