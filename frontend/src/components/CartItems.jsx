import React, { useState } from 'react';

const CartItems = ({ 
  items = [], 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart,
  readOnly = false,
  showActions = true 
}) => {
  const [quantities, setQuantities] = useState({});

  // Handle quantity change with local state for immediate feedback
  const handleQuantityChange = (productId, newQuantity, item) => {
    const quantity = Math.max(0, parseInt(newQuantity) || 0);
    
    // Update local state immediately for responsive UI
    setQuantities(prev => ({
      ...prev,
      [productId]: quantity
    }));

    // Call parent update function
    if (onUpdateQuantity) {
      onUpdateQuantity(productId, quantity, item);
    }
  };

  // Get current quantity (local state or item quantity)
  const getCurrentQuantity = (productId, itemQuantity) => {
    return quantities[productId] !== undefined ? quantities[productId] : itemQuantity;
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      const quantity = getCurrentQuantity(item.id || item._id, item.quantity);
      return sum + (item.price * quantity);
    }, 0);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      itemCount: items.reduce((sum, item) => {
        const quantity = getCurrentQuantity(item.id || item._id, item.quantity);
        return sum + quantity;
      }, 0)
    };
  };

  const { subtotal, itemCount } = calculateTotals();

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-5xl mb-4">🛒</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Cart is empty</h3>
        <p className="text-gray-500">Add some products to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cart Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Cart Items ({itemCount})
        </h3>
        {showActions && onClearCart && !readOnly && (
          <button
            onClick={onClearCart}
            disabled={items.length === 0}
            className="text-sm text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {items.map((item) => (
          <CartItem
            key={item.id || item._id}
            item={item}
            quantity={getCurrentQuantity(item.id || item._id, item.quantity)}
            onQuantityChange={handleQuantityChange}
            onRemove={onRemoveItem}
            readOnly={readOnly}
            showActions={showActions}
          />
        ))}
      </div>

      {/* Cart Summary */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center text-lg font-semibold text-gray-900">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {itemCount > 0 && (
          <div className="text-sm text-gray-500 text-right mt-1">
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

// Individual Cart Item Component
const CartItem = ({ 
  item, 
  quantity, 
  onQuantityChange, 
  onRemove,
  readOnly = false,
  showActions = true
}) => {
  const [localQuantity, setLocalQuantity] = useState(quantity.toString());

  // Handle quantity input change
  const handleQuantityInputChange = (e) => {
    const value = e.target.value;
    setLocalQuantity(value);
    
    // Only update parent if it's a valid number
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onQuantityChange && onQuantityChange(item.id || item._id, numValue, item);
    }
  };

  // Handle quantity button changes
  const handleQuantityButtonChange = (delta) => {
    const newQuantity = Math.max(0, quantity + delta);
    setLocalQuantity(newQuantity.toString());
    onQuantityChange && onQuantityChange(item.id || item._id, newQuantity, item);
  };

  // Handle remove item
  const handleRemove = () => {
    onRemove && onRemove(item.id || item._id, item);
  };

  // Calculate item total
  const itemTotal = (item.price * quantity).toFixed(2);

  // Get stock status
  const getStockStatus = () => {
    if (!item.stock && item.stock !== 0) return null;
    
    if (item.stock <= 0) return { label: 'Out of Stock', color: 'text-red-600' };
    if (quantity > item.stock) return { label: 'Exceeds Stock', color: 'text-red-600' };
    if (item.stock <= 10) return { label: `${item.stock} left`, color: 'text-yellow-600' };
    return null;
  };

  const stockStatus = getStockStatus();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start space-x-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <span className="text-gray-400 text-2xl">📦</span>
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {item.name}
              </h4>
              {item.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {item.description}
                </p>
              )}
              <div className="flex items-center mt-2 space-x-4">
                <span className="text-sm font-medium text-gray-900">
                  ${item.price.toFixed(2)}
                </span>
                {item.category && (
                  <span 
                    className="text-xs px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: item.category.color || '#6B7280' }}
                  >
                    {item.category.name}
                  </span>
                )}
              </div>
              {stockStatus && (
                <div className={`text-xs mt-1 ${stockStatus.color}`}>
                  {stockStatus.label}
                </div>
              )}
            </div>

            {/* Item Total */}
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                ${itemTotal}
              </div>
              {quantity > 1 && (
                <div className="text-xs text-gray-500">
                  ${item.price.toFixed(2)} each
                </div>
              )}
            </div>
          </div>

          {/* Quantity Controls */}
          {!readOnly && showActions && (
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleQuantityButtonChange(-1)}
                  disabled={quantity <= 0}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  −
                </button>
                
                <input
                  type="number"
                  min="0"
                  value={localQuantity}
                  onChange={handleQuantityInputChange}
                  className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <button
                  onClick={() => handleQuantityButtonChange(1)}
                  disabled={item.stock !== undefined && quantity >= item.stock}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>

              {onRemove && (
                <button
                  onClick={handleRemove}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Remove item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Read-only quantity display */}
          {readOnly && (
            <div className="mt-3">
              <span className="text-sm text-gray-600">
                Quantity: <span className="font-medium">{quantity}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItems;