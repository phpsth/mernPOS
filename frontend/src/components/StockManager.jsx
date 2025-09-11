import React, { useState } from 'react';
import { productService } from '../services/productService';

const StockManager = ({ product, onSuccess, onCancel }) => {
  const [stockOperation, setStockOperation] = useState('set'); // 'set', 'add', 'subtract'
  const [stockAmount, setStockAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const operations = [
    { value: 'set', label: 'Set Stock Level', description: 'Set the exact stock quantity' },
    { value: 'add', label: 'Add Stock', description: 'Increase stock by the specified amount' },
    { value: 'subtract', label: 'Remove Stock', description: 'Decrease stock by the specified amount' }
  ];

  const reasons = {
    set: [
      'Initial stock count',
      'Inventory audit adjustment',
      'System correction',
      'Other'
    ],
    add: [
      'New stock received',
      'Purchase order received',
      'Return from customer',
      'Transfer from other location',
      'Other'
    ],
    subtract: [
      'Sold at external location',
      'Damaged goods',
      'Expired items',
      'Transfer to other location',
      'Inventory shrinkage',
      'Other'
    ]
  };

  const calculateNewStock = () => {
    const amount = parseInt(stockAmount) || 0;
    const currentStock = product?.stock || 0;
    
    switch (stockOperation) {
      case 'set':
        return amount;
      case 'add':
        return currentStock + amount;
      case 'subtract':
        return Math.max(0, currentStock - amount);
      default:
        return currentStock;
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!stockAmount.trim()) {
      errors.stockAmount = 'Stock amount is required';
    } else {
      const amount = parseInt(stockAmount);
      if (isNaN(amount) || amount < 0) {
        errors.stockAmount = 'Stock amount must be a positive number';
      } else if (amount > 999999) {
        errors.stockAmount = 'Stock amount cannot exceed 999,999';
      }
    }
    
    if (!reason.trim()) {
      errors.reason = 'Please select or specify a reason';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setSubmitStatus({
        type: 'error',
        message: Object.values(errors)[0]
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const stockData = {
        operation: stockOperation,
        stock: parseInt(stockAmount),
        reason: reason,
        timestamp: new Date().toISOString()
      };

      const result = await productService.updateStock(product._id, stockData);

      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: result.message || 'Stock updated successfully!'
        });
        
        // Call success callback after a short delay
        setTimeout(() => {
          onSuccess && onSuccess(result.data);
        }, 1000);
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.message || 'Failed to update stock'
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'An unexpected error occurred'
      });
      console.error('Stock update error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStockOperation('set');
    setStockAmount('');
    setReason('');
    setSubmitStatus(null);
  };

  if (!product) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        <p className="text-red-600">No product selected for stock management.</p>
      </div>
    );
  }

  const newStock = calculateNewStock();
  const stockDifference = newStock - (product?.stock || 0);

  return (
    <div className="bg-white rounded-lg shadow-md max-w-2xl mx-auto">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Stock Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Update inventory levels for "{product.name}"
        </p>
      </div>

      <div className="p-6">
        {/* Current Product Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span className="text-gray-400">📦</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{product.description}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-lg font-bold text-gray-900">
                  Current Stock: {product.stock} units
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  product.stock <= 0 
                    ? 'bg-red-100 text-red-800'
                    : product.stock <= 10
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {product.stock <= 0 ? 'Out of Stock' : product.stock <= 10 ? 'Low Stock' : 'In Stock'}
                </span>
              </div>
              {product.category && (
                <span 
                  className="inline-block px-2 py-1 text-xs text-white rounded-full mt-2"
                  style={{ backgroundColor: product.category.color }}
                >
                  {product.category.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Stock Operation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Stock Operation *
            </label>
            <div className="space-y-2">
              {operations.map((operation) => (
                <label key={operation.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="stockOperation"
                    value={operation.value}
                    checked={stockOperation === operation.value}
                    onChange={(e) => setStockOperation(e.target.value)}
                    disabled={isSubmitting}
                    className="mt-1 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{operation.label}</div>
                    <div className="text-xs text-gray-500">{operation.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Stock Amount */}
          <div>
            <label htmlFor="stockAmount" className="block text-sm font-medium text-gray-700 mb-2">
              {stockOperation === 'set' ? 'New Stock Level' : 
               stockOperation === 'add' ? 'Amount to Add' : 'Amount to Remove'} *
            </label>
            <input
              type="number"
              id="stockAmount"
              value={stockAmount}
              onChange={(e) => setStockAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              max="999999"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Stock Change *
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="">Select a reason</option>
              {reasons[stockOperation]?.map((reasonOption) => (
                <option key={reasonOption} value={reasonOption}>
                  {reasonOption}
                </option>
              ))}
            </select>
            
            {reason === 'Other' && (
              <input
                type="text"
                placeholder="Please specify the reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            )}
          </div>

          {/* Stock Change Preview */}
          {stockAmount && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Stock Change Preview</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Current Stock</div>
                  <div className="font-semibold text-gray-900">{product.stock} units</div>
                </div>
                <div>
                  <div className="text-gray-600">Change</div>
                  <div className={`font-semibold ${
                    stockDifference > 0 ? 'text-green-600' : 
                    stockDifference < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stockDifference > 0 ? '+' : ''}{stockDifference} units
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">New Stock</div>
                  <div className={`font-semibold ${
                    newStock <= 0 ? 'text-red-600' : 
                    newStock <= 10 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {newStock} units
                  </div>
                </div>
              </div>
              
              {newStock <= 0 && (
                <div className="mt-3 p-2 bg-red-100 rounded text-red-700 text-sm">
                  ⚠️ Warning: This will result in out-of-stock status
                </div>
              )}
              {newStock > 0 && newStock <= 10 && (
                <div className="mt-3 p-2 bg-yellow-100 rounded text-yellow-700 text-sm">
                  ⚠️ Warning: This will result in low stock status
                </div>
              )}
            </div>
          )}

          {/* Submit Status */}
          {submitStatus && (
            <div className={`p-4 rounded-md ${
              submitStatus.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={submitStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}>
                {submitStatus.message}
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Reset
            </button>
            
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || !stockAmount || !reason}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              Update Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockManager;