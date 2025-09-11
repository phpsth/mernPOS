import React, { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';

const OrderSummary = ({ 
  items = [],
  customerData = {},
  paymentData = {},
  taxRate = 10,
  discountType = 'fixed', // 'fixed' or 'percentage'
  discountValue = 0,
  onTotalsChange,
  editable = true,
  showPricing = true
}) => {
  const [localTaxRate, setLocalTaxRate] = useState(taxRate);
  const [localDiscountType, setLocalDiscountType] = useState(discountType);
  const [localDiscountValue, setLocalDiscountValue] = useState(discountValue);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  // Predefined promo codes for demonstration
  const promoCodes = {
    'SAVE10': { type: 'percentage', value: 10, description: '10% off' },
    'WELCOME5': { type: 'fixed', value: 5, description: '$5 off' },
    'NEWCUSTOMER': { type: 'percentage', value: 15, description: '15% off for new customers' },
    'LOYALTY20': { type: 'fixed', value: 20, description: '$20 off for loyal customers' }
  };

  // Calculate all totals
  const calculateTotals = () => {
    // Calculate subtotal from items
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Calculate tax
    const taxAmount = subtotal * (localTaxRate / 100);

    // Calculate discount
    let discountAmount = 0;
    if (localDiscountType === 'percentage') {
      discountAmount = subtotal * (localDiscountValue / 100);
    } else {
      discountAmount = localDiscountValue;
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    // Calculate final total
    const total = Math.max(0, subtotal + taxAmount - discountAmount);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(taxAmount * 100) / 100,
      discount: Math.round(discountAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    };
  };

  const totals = calculateTotals();

  // Notify parent of total changes
  useEffect(() => {
    if (onTotalsChange) {
      onTotalsChange({
        ...totals,
        taxRate: localTaxRate,
        discountType: localDiscountType,
        discountValue: localDiscountValue
      });
    }
  }, [totals.total, localTaxRate, localDiscountType, localDiscountValue, onTotalsChange]);

  // Handle tax rate change
  const handleTaxRateChange = (e) => {
    const rate = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
    setLocalTaxRate(rate);
  };

  // Handle discount changes
  const handleDiscountTypeChange = (type) => {
    setLocalDiscountType(type);
    if (type === 'percentage' && localDiscountValue > 100) {
      setLocalDiscountValue(100);
    }
  };

  const handleDiscountValueChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    if (localDiscountType === 'percentage') {
      setLocalDiscountValue(Math.max(0, Math.min(100, value)));
    } else {
      setLocalDiscountValue(Math.max(0, value));
    }
  };

  // Handle promo code
  const handleApplyPromoCode = () => {
    const promo = promoCodes[promoCode.toUpperCase()];
    if (promo) {
      setLocalDiscountType(promo.type);
      setLocalDiscountValue(promo.value);
      setPromoApplied(true);
      setTimeout(() => setPromoApplied(false), 3000);
    } else {
      // Show error or invalid promo message
      setPromoApplied(false);
    }
  };

  const handleRemovePromoCode = () => {
    setPromoCode('');
    setLocalDiscountType('fixed');
    setLocalDiscountValue(0);
  };

  // Get payment method display info
  const getPaymentMethodInfo = () => {
    if (!paymentData.paymentMethod) return null;

    const methods = {
      cash: { name: 'Cash Payment', icon: '💵' },
      card: { name: 'Card Payment', icon: '💳' },
      digital: { name: 'Digital Wallet', icon: '📱' },
      bank_transfer: { name: 'Bank Transfer', icon: '🏦' }
    };

    return methods[paymentData.paymentMethod] || null;
  };

  const paymentMethodInfo = getPaymentMethodInfo();

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Items Summary */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Items ({totals.itemCount})
          </h4>
          {items.length === 0 ? (
            <p className="text-gray-500 text-sm">No items added yet</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {items.map((item, index) => (
                <div key={item.id || item._id || index} className="flex justify-between items-center text-sm">
                  <div className="flex-1">
                    <span className="text-gray-900">{item.name}</span>
                    <span className="text-gray-500 ml-2">× {item.quantity}</span>
                  </div>
                  {showPricing && (
                    <span className="text-gray-900 font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Information */}
        {customerData.customerName && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Customer</h4>
            <div className="text-sm text-gray-900">
              <div>{customerData.customerName}</div>
              {customerData.phone && <div className="text-gray-500">{customerData.phone}</div>}
              {customerData.email && <div className="text-gray-500">{customerData.email}</div>}
            </div>
          </div>
        )}

        {showPricing && (
          <>
            {/* Pricing Calculations */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900 font-medium">${totals.subtotal.toFixed(2)}</span>
              </div>

              {/* Tax Settings */}
              {editable ? (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={localTaxRate}
                      onChange={handleTaxRateChange}
                      className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">%</span>
                    <span className="text-gray-900 font-medium">${totals.tax.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Tax ({localTaxRate}%):</span>
                  <span className="text-gray-900 font-medium">${totals.tax.toFixed(2)}</span>
                </div>
              )}

              {/* Discount Settings */}
              {editable ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <div className="flex items-center space-x-2">
                      <select
                        value={localDiscountType}
                        onChange={(e) => handleDiscountTypeChange(e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="fixed">$</option>
                        <option value="percentage">%</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        max={localDiscountType === 'percentage' ? 100 : totals.subtotal}
                        step={localDiscountType === 'percentage' ? 1 : 0.01}
                        value={localDiscountValue}
                        onChange={handleDiscountValueChange}
                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-gray-900 font-medium">-${totals.discount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Promo Code */}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromoCode}
                      disabled={!promoCode.trim()}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                    >
                      Apply
                    </button>
                    {(localDiscountValue > 0 || promoCode) && (
                      <button
                        type="button"
                        onClick={handleRemovePromoCode}
                        className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {promoApplied && (
                    <div className="text-sm text-green-600">
                      ✓ Promo code applied successfully!
                    </div>
                  )}

                  {/* Available Promo Codes Hint */}
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer hover:text-gray-700">
                      Available promo codes (demo)
                    </summary>
                    <div className="mt-1 pl-4">
                      {Object.entries(promoCodes).map(([code, promo]) => (
                        <div key={code} className="flex justify-between">
                          <span className="font-mono">{code}</span>
                          <span>{promo.description}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ) : (
                totals.discount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      Discount {localDiscountType === 'percentage' ? `(${localDiscountValue}%)` : ''}:
                    </span>
                    <span className="text-red-600 font-medium">-${totals.discount.toFixed(2)}</span>
                  </div>
                )
              )}

              {/* Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-gray-900">${totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Payment Information */}
        {paymentMethodInfo && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Method</h4>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-lg">{paymentMethodInfo.icon}</span>
              <span className="text-gray-900">{paymentMethodInfo.name}</span>
              
              {paymentData.paymentMethod === 'cash' && paymentData.amountReceived && (
                <div className="ml-auto text-right">
                  <div className="text-gray-600">Received: ${parseFloat(paymentData.amountReceived).toFixed(2)}</div>
                  <div className="text-green-600 font-medium">
                    Change: ${Math.max(0, parseFloat(paymentData.amountReceived) - totals.total).toFixed(2)}
                  </div>
                </div>
              )}

              {paymentData.paymentMethod === 'digital' && paymentData.digitalWallet && (
                <span className="text-gray-500">({paymentData.digitalWallet})</span>
              )}
            </div>
          </div>
        )}

        {/* Order Notes */}
        {(customerData.notes || paymentData.notes) && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
            <div className="text-sm text-gray-600 space-y-1">
              {customerData.notes && (
                <div><strong>Order:</strong> {customerData.notes}</div>
              )}
              {paymentData.notes && (
                <div><strong>Payment:</strong> {paymentData.notes}</div>
              )}
            </div>
          </div>
        )}

        {/* Order Status Indicators */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-1 ${
              items.length > 0 ? 'text-green-600' : 'text-gray-400'
            }`}>
              <span>{items.length > 0 ? '✓' : '○'}</span>
              <span>Items Added</span>
            </div>
            
            <div className={`flex items-center space-x-1 ${
              customerData.customerName ? 'text-green-600' : 'text-gray-400'
            }`}>
              <span>{customerData.customerName ? '✓' : '○'}</span>
              <span>Customer Info</span>
            </div>
            
            <div className={`flex items-center space-x-1 ${
              paymentData.paymentMethod ? 'text-green-600' : 'text-gray-400'
            }`}>
              <span>{paymentData.paymentMethod ? '✓' : '○'}</span>
              <span>Payment Method</span>
            </div>
          </div>

          {/* Order readiness indicator */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            items.length > 0 && customerData.customerName && paymentData.paymentMethod
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {items.length > 0 && customerData.customerName && paymentData.paymentMethod
              ? 'Ready to Process'
              : 'Incomplete'
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;