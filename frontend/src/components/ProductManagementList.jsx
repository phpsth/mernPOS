import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';

const ProductManagementList = ({ onEdit, onDelete, onStockUpdate, onRefresh = null }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'low', 'out'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'

  // Barcode search
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [barcodeSearching, setBarcodeSearching] = useState(false);

  // Fetch products and categories
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [productsResult, categoriesResult] = await Promise.all([
        productService.getAllProducts({
          search: searchTerm,
          category: selectedCategory,
          isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
        }),
        categoryService.getAllCategories()
      ]);
      
      if (productsResult.success) {
        setProducts(productsResult.data);
      } else {
        setError(productsResult.message);
      }
      
      if (categoriesResult.success) {
        setCategories(categoriesResult.data);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, [searchTerm, selectedCategory, statusFilter]);

  // Refresh when parent requests it
  useEffect(() => {
    if (onRefresh) {
      fetchData();
    }
  }, [onRefresh]);

  // Handle barcode search
  const handleBarcodeSearch = async () => {
    if (!barcodeSearch.trim()) return;
    
    setBarcodeSearching(true);
    try {
      const result = await productService.searchByBarcode(barcodeSearch.trim());
      if (result.success) {
        setProducts([result.data]);
        setSearchTerm('');
        setSelectedCategory('');
        setStatusFilter('all');
      } else {
        setError(`No product found with barcode: ${barcodeSearch}`);
        setTimeout(() => setError(null), 3000);
      }
    } catch (error) {
      setError('Failed to search by barcode');
      setTimeout(() => setError(null), 3000);
    } finally {
      setBarcodeSearching(false);
    }
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      // Stock filter
      if (stockFilter === 'low' && product.stock > 10) return false;
      if (stockFilter === 'out' && product.stock > 0) return false;
      return true;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'category') {
        aValue = a.category?.name || '';
        bValue = b.category?.name || '';
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
    });

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (stock <= 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading products...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <div className="flex justify-between items-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchData}
            className="text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        {/* Top Row - Search and Barcode */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search products by name, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Scan/Enter barcode"
              value={barcodeSearch}
              onChange={(e) => setBarcodeSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleBarcodeSearch}
              disabled={barcodeSearching || !barcodeSearch.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {barcodeSearching ? '🔍' : '📷'}
            </button>
          </div>
        </div>

        {/* Bottom Row - Filters and Sort */}
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Stock Levels</option>
              <option value="low">Low Stock (≤10)</option>
              <option value="out">Out of Stock</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Sort and View Controls */}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => handleSortChange('name')}
              className={`px-3 py-2 rounded-lg border text-sm ${
                sortBy === 'name'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            
            <button
              onClick={() => handleSortChange('price')}
              className={`px-3 py-2 rounded-lg border text-sm ${
                sortBy === 'price'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            
            <button
              onClick={() => handleSortChange('stock')}
              className={`px-3 py-2 rounded-lg border text-sm ${
                sortBy === 'stock'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Stock {sortBy === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>

            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
                }`}
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm border-l ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
                }`}
              >
                ☰
              </button>
            </div>

            <button
              onClick={fetchData}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* Products Display */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-5xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">
            {searchTerm || selectedCategory || stockFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters' 
              : 'Start by adding your first product'
            }
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onEdit={() => onEdit && onEdit(product)}
                  onDelete={() => onDelete && onDelete(product)}
                  onStockUpdate={() => onStockUpdate && onStockUpdate(product)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <ProductRow
                      key={product._id}
                      product={product}
                      onEdit={() => onEdit && onEdit(product)}
                      onDelete={() => onDelete && onDelete(product)}
                      onStockUpdate={() => onStockUpdate && onStockUpdate(product)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Results Summary */}
      <div className="text-sm text-gray-500 text-center">
        Showing {filteredProducts.length} of {products.length} products
      </div>
    </div>
  );
};

// Product Card Component for Grid View
const ProductCard = ({ product, onEdit, onDelete, onStockUpdate }) => {
  const stockStatus = product.stock <= 0 ? 'out' : product.stock <= 10 ? 'low' : 'normal';
  const statusColors = {
    out: 'bg-red-100 text-red-800',
    low: 'bg-yellow-100 text-yellow-800',
    normal: 'bg-green-100 text-green-800'
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="p-4">
        {/* Product Image */}
        <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
          {product.image && (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover rounded-lg"
            />
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[stockStatus]}`}>
              {product.stock} left
            </span>
          </div>

          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
            {product.category && (
              <span 
                className="px-2 py-1 rounded-full text-xs text-white"
                style={{ backgroundColor: product.category.color || '#6B7280' }}
              >
                {product.category.name}
              </span>
            )}
          </div>

          {product.barcode && (
            <div className="text-xs text-gray-500">
              Barcode: {product.barcode}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4">
          <div className="flex space-x-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                Edit
              </button>
            )}
            {onStockUpdate && (
              <button
                onClick={onStockUpdate}
                className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
              >
                Stock
              </button>
            )}
          </div>
          
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Product Row Component for List View
const ProductRow = ({ product, onEdit, onDelete, onStockUpdate }) => {
  const stockStatus = product.stock <= 0 
    ? { label: 'Out of Stock', color: 'bg-red-100 text-red-800' }
    : product.stock <= 10 
    ? { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' }
    : { label: 'In Stock', color: 'bg-green-100 text-green-800' };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-12 w-12 flex-shrink-0">
            <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-12 w-12 object-cover rounded-lg"
                />
              )}
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{product.name}</div>
            <div className="text-sm text-gray-500">{product.barcode}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {product.category && (
          <span 
            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
            style={{ backgroundColor: product.category.color || '#6B7280' }}
          >
            {product.category.name}
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        ${product.price.toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
          {product.stock} units
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {product.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-900"
            >
              Edit
            </button>
          )}
          {onStockUpdate && (
            <button
              onClick={onStockUpdate}
              className="text-purple-600 hover:text-purple-900"
            >
              Stock
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-900"
            >
              Delete
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default ProductManagementList;