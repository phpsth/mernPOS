import React, { useState } from 'react';

function ProductCard({ product, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleAddToCart = async () => {
    if (product.stock === 0) return;
    
    setIsAdding(true);
    
    // Add to cart with specified quantity
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product);
    }
    
    // Show success feedback
    setTimeout(() => {
      setIsAdding(false);
      setQuantity(1); // Reset quantity after adding
    }, 800);
  };

  const handleQuickAdd = (quickQuantity) => {
    if (product.stock === 0) return;
    
    setIsAdding(true);
    
    // Add multiple items quickly
    for (let i = 0; i < quickQuantity; i++) {
      onAddToCart(product);
    }
    
    setTimeout(() => {
      setIsAdding(false);
    }, 600);
  };

  // Get stock status
  const getStockStatus = () => {
    if (product.stock === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200', icon: '❌' };
    if (product.stock <= 5) return { text: `Only ${product.stock} left`, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⚠️' };
    if (product.stock <= 20) return { text: `${product.stock} available`, color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '📦' };
    return { text: 'In Stock', color: 'bg-green-100 text-green-800 border-green-200', icon: '✅' };
  };

  const stockStatus = getStockStatus();

  // Get category color
  const getCategoryColor = () => {
    if (product.category?.color) {
      return product.category.color;
    }
    return '#6B7280'; // Default gray
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1">
      {/* Image Container */}
      <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        {/* Fallback placeholder */}
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl" style={{ display: product.image ? 'none' : 'flex' }}>
          🍽️
        </div>

        {/* Stock Badge */}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium border ${stockStatus.color} flex items-center space-x-1`}>
          <span>{stockStatus.icon}</span>
          <span>{stockStatus.text}</span>
        </div>

        {/* Category Badge */}
        {product.category && (
          <div 
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: getCategoryColor() }}
          >
            {product.category.name}
          </div>
        )}

        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="bg-white text-gray-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Product Name & Description */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        {/* Product Details (expandable) */}
        {showDetails && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm space-y-1 animate-fadeIn">
            {product.barcode && (
              <div className="flex justify-between">
                <span className="text-gray-600">Barcode:</span>
                <span className="font-mono text-gray-800">{product.barcode}</span>
              </div>
            )}
            {product.sku && (
              <div className="flex justify-between">
                <span className="text-gray-600">SKU:</span>
                <span className="font-mono text-gray-800">{product.sku}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Stock:</span>
              <span className="font-medium text-gray-800">{product.stock} units</span>
            </div>
          </div>
        )}
        
        {/* Price Section */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-blue-600">
              ${product.price?.toFixed(2) || '0.00'}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through ml-2">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">per unit</div>
          </div>
        </div>

        {/* Quantity Selector */}
        {product.stock > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <div className="flex items-center space-x-3">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-l-lg transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(product.stock, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-16 px-2 py-2 text-center border-0 focus:ring-0 focus:outline-none"
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-r-lg transition-colors"
                >
                  +
                </button>
              </div>
              
              {/* Quick Add Buttons */}
              <div className="flex space-x-1">
                {[2, 5, 10].filter(num => num <= product.stock).map(num => (
                  <button
                    key={num}
                    onClick={() => handleQuickAdd(num)}
                    disabled={isAdding}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    +{num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add to Cart Button */}
        <button 
          onClick={handleAddToCart}
          disabled={product.stock === 0 || isAdding}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
            product.stock > 0
              ? isAdding
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg active:transform active:scale-95'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isAdding ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Adding...</span>
            </>
          ) : product.stock > 0 ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 0L3 3m4 10v6a1 1 0 001 1h12a1 1 0 001-1v-6m-6-4a1 1 0 11-2 0m2 0V7a1 1 0 00-1-1H9a1 1 0 00-1 1v2" />
              </svg>
              <span>Add {quantity > 1 ? `${quantity} ` : ''}to Cart</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Out of Stock</span>
            </>
          )}
        </button>

        {/* Additional Actions */}
        <div className="mt-3 flex justify-between items-center">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showDetails ? '▲ Less Info' : '▼ More Info'}
          </button>
          
          {product.stock > 0 && (
            <div className="text-xs text-gray-500">
              Total: ${(product.price * quantity).toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;