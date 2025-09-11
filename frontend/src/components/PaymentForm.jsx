import React, { useState, useEffect } from 'react';

const PaymentForm = ({ 
  total = 0, 
  onPaymentDataChange, 
  initialData = {},
  disabled = false 
}) => {
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'cash',
    amountReceived: '',
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    digitalWallet: 'paypal',
    notes: '',
    ...initialData
  });

  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Payment methods configuration
  const paymentMethods = [
    {
      id: 'cash',
      name: 'Cash',
      icon: '💵',
      description: 'Cash payment'
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: '💳',
      description: 'Card payment'
    },
    {
      id: 'digital',
      name: 'Digital Wallet',
      icon: '📱',
      description: 'PayPal, Apple Pay, etc.'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: '🏦',
      description: 'Direct bank transfer'
    }
  ];

  const digitalWallets = [
    { id: 'paypal', name: 'PayPal', icon: '🅿️' },
    { id: 'apple_pay', name: 'Apple Pay', icon: '🍎' },
    { id: 'google_pay', name: 'Google Pay', icon: '🅖' },
    { id: 'alipay', name: 'Alipay', icon: '🅰️' },
    { id: 'wechat_pay', name: 'WeChat Pay', icon: '💬' }
  ];

  // Update parent component when payment data changes
  useEffect(() => {
    if (onPaymentDataChange) {
      onPaymentDataChange(paymentData);
    }
  }, [paymentData, onPaymentDataChange]);

  // Validate payment data
  const validatePaymentData = () => {
    const newErrors = {};

    switch (paymentData.paymentMethod) {
      case 'cash':
        if (!paymentData.amountReceived || parseFloat(paymentData.amountReceived) < total) {
          newErrors.amountReceived = 'Amount received must be at least the total amount';
        }
        break;

      case 'card':
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
        break;

      case 'digital':
        if (!paymentData.digitalWallet) {
          newErrors.digitalWallet = 'Please select a digital wallet';
        }
        break;

      case 'bank_transfer':
        // Bank transfer typically requires external verification
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setPaymentData(prev => ({
      ...prev,
      paymentMethod: method,
      // Reset method-specific fields
      amountReceived: method === 'cash' ? '' : prev.amountReceived,
      cardNumber: method === 'card' ? prev.cardNumber : '',
      cardHolder: method === 'card' ? prev.cardHolder : '',
      expiryDate: method === 'card' ? prev.expiryDate : '',
      cvv: method === 'card' ? prev.cvv : '',
      digitalWallet: method === 'digital' ? prev.digitalWallet : 'paypal'
    }));
    
    setErrors({});
  };

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Format expiry date
  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Calculate change for cash payments
  const calculateChange = () => {
    if (paymentData.paymentMethod === 'cash' && paymentData.amountReceived) {
      const received = parseFloat(paymentData.amountReceived) || 0;
      return Math.max(0, received - total);
    }
    return 0;
  };

  const change = calculateChange();

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Payment Method *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => handlePaymentMethodChange(method.id)}
              disabled={disabled}
              className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                paymentData.paymentMethod === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{method.icon}</span>
                <div>
                  <div className="font-medium text-gray-900">{method.name}</div>
                  <div className="text-sm text-gray-500">{method.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Method Specific Forms */}
      {paymentData.paymentMethod === 'cash' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="amountReceived" className="block text-sm font-medium text-gray-700 mb-2">
              Amount Received *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="amountReceived"
                step="0.01"
                min={total}
                value={paymentData.amountReceived}
                onChange={(e) => handleInputChange('amountReceived', e.target.value)}
                placeholder={total.toFixed(2)}
                disabled={disabled}
                className={`block w-full pl-8 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.amountReceived ? 'border-red-300' : 'border-gray-300'
                } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
            </div>
            {errors.amountReceived && (
              <p className="mt-1 text-sm text-red-600">{errors.amountReceived}</p>
            )}
            
            {/* Change Calculation */}
            {paymentData.amountReceived && (
              <div className="mt-2 p-3 bg-green-50 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-800">Change:</span>
                  <span className="text-lg font-bold text-green-900">
                    ${change.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {paymentData.paymentMethod === 'card' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Card Number *
            </label>
            <input
              type="text"
              id="cardNumber"
              value={paymentData.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              maxLength="19"
              disabled={disabled}
              className={`block w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.cardNumber ? 'border-red-300' : 'border-gray-300'
              } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {errors.cardNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
            )}
          </div>

          <div>
            <label htmlFor="cardHolder" className="block text-sm font-medium text-gray-700 mb-2">
              Cardholder Name *
            </label>
            <input
              type="text"
              id="cardHolder"
              value={paymentData.cardHolder}
              onChange={(e) => handleInputChange('cardHolder', e.target.value)}
              placeholder="John Doe"
              disabled={disabled}
              className={`block w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.cardHolder ? 'border-red-300' : 'border-gray-300'
              } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {errors.cardHolder && (
              <p className="mt-1 text-sm text-red-600">{errors.cardHolder}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date *
              </label>
              <input
                type="text"
                id="expiryDate"
                value={paymentData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', formatExpiryDate(e.target.value))}
                placeholder="MM/YY"
                maxLength="5"
                disabled={disabled}
                className={`block w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.expiryDate ? 'border-red-300' : 'border-gray-300'
                } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              {errors.expiryDate && (
                <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>
              )}
            </div>

            <div>
              <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-2">
                CVV *
              </label>
              <input
                type="text"
                id="cvv"
                value={paymentData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                maxLength="4"
                disabled={disabled}
                className={`block w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.cvv ? 'border-red-300' : 'border-gray-300'
                } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              {errors.cvv && (
                <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {paymentData.paymentMethod === 'digital' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Digital Wallet *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {digitalWallets.map((wallet) => (
              <button
                key={wallet.id}
                type="button"
                onClick={() => handleInputChange('digitalWallet', wallet.id)}
                disabled={disabled}
                className={`p-3 border-2 rounded-lg text-center transition-all duration-200 ${
                  paymentData.digitalWallet === wallet.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="text-2xl mb-1">{wallet.icon}</div>
                <div className="text-sm font-medium text-gray-900">{wallet.name}</div>
              </button>
            ))}
          </div>
          {errors.digitalWallet && (
            <p className="mt-2 text-sm text-red-600">{errors.digitalWallet}</p>
          )}
        </div>
      )}

      {paymentData.paymentMethod === 'bank_transfer' && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="text-blue-500 text-xl">ℹ️</div>
            <div>
              <h4 className="text-sm font-medium text-blue-900">Bank Transfer Instructions</h4>
              <p className="text-sm text-blue-700 mt-1">
                Please transfer ${total.toFixed(2)} to our bank account. Order will be processed upon payment confirmation.
              </p>
              <div className="mt-2 text-xs text-blue-600">
                <div>Bank: Example Bank</div>
                <div>Account: 1234567890</div>
                <div>Reference: {`ORD-${Date.now()}`}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Payment Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          value={paymentData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Any additional notes about the payment..."
          disabled={disabled}
          className={`block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        />
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Payment Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Method:</span>
            <span className="font-medium">
              {paymentMethods.find(m => m.id === paymentData.paymentMethod)?.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount Due:</span>
            <span className="font-medium">${total.toFixed(2)}</span>
          </div>
          {paymentData.paymentMethod === 'cash' && paymentData.amountReceived && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Received:</span>
                <span className="font-medium">${parseFloat(paymentData.amountReceived || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Change:</span>
                <span className="font-medium text-green-600">${change.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Validation Status */}
      <div className="text-right">
        <button
          type="button"
          onClick={validatePaymentData}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Validate Payment Data
        </button>
      </div>
    </div>
  );
};

export default PaymentForm;