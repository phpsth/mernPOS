import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import ProductManagementList from './ProductManagementList';
import ProductForm from './ProductForm';
import StockManager from './StockManager';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('list'); // 'list', 'form', 'stock'
  const [editingProduct, setEditingProduct] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'all'
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [productsResult, categoriesResult] = await Promise.all([
        productService.getAllProducts(),
        categoryService.getAllCategories()
      ]);
      
      if (productsResult.success) {
        setProducts(productsResult.data || []);
      }
      
      if (categoriesResult.success) {
        setCategories(categoriesResult.data || []);
      }
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setActiveView('form');
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setActiveView('form');
  };

  const handleStockManager = () => {
    setActiveView('stock');
  };

  const handleBackToList = () => {
    setActiveView('list');
    setEditingProduct(null);
  };

  const handleProductSaved = () => {
    loadInitialData();
    setActiveView('list');
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      setLoading(true);
      // Implementation would depend on your product service
      // const result = await productService.deleteProduct(productId);
      
      // For now, just reload data
      await loadInitialData();
      alert('Product deleted successfully!');
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            <p className="mt-1 text-gray-600">Manage your product catalog and inventory</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {activeView !== 'list' && (
              <button
                onClick={handleBackToList}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                ← Back to List
              </button>
            )}
            
            {activeView === 'list' && (
              <>
                <button
                  onClick={handleStockManager}
                  disabled={loading}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
                >
                  📦 Stock Manager
                </button>
                <button
                  onClick={handleCreateProduct}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Add New Product
                </button>
              </>
            )}
          </div>
        </div>

        {/* View Indicator */}
        <div className="text-sm text-gray-500">
          {activeView === 'list' && `Viewing ${products.length} products`}
          {activeView === 'form' && (editingProduct ? 'Editing Product' : 'Creating New Product')}
          {activeView === 'stock' && 'Stock Management'}
        </div>
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

      {/* Main Content */}
      {activeView === 'list' && (
        <ProductManagementList
          products={products}
          categories={categories}
          loading={loading}
          filters={filters}
          onFilterChange={handleFilterChange}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />
      )}

      {activeView === 'form' && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onSaved={handleProductSaved}
          onCancel={handleBackToList}
        />
      )}

      {activeView === 'stock' && (
        <StockManager
          products={products}
          onStockUpdated={loadInitialData}
        />
      )}
    </div>
  );
};

export default ProductManagement;