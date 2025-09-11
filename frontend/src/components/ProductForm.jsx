import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';

const ProductForm = ({ product = null, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    barcode: '',
    image: '',
    isActive: true
  });

  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Load categories and initialize form
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await categoryService.getAllCategories();
        if (result.success) {
          setCategories(result.data);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Initialize form with product data if editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        stock: product.stock?.toString() || '',
        category: product.category?._id || '',
        barcode: product.barcode || '',
        image: product.image || '',
        isActive: product.isActive !== undefined ? product.isActive : true
      });
    }
  }, [product]);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Product name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Product name must be less than 100 characters';
    }

    // Price validation
    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price < 0) {
        newErrors.price = 'Price must be a valid positive number';
      } else if (price > 999999.99) {
        newErrors.price = 'Price cannot exceed $999,999.99';
      }
    }

    // Stock validation
    if (!formData.stock.trim()) {
      newErrors.stock = 'Stock quantity is required';
    } else {
      const stock = parseInt(formData.stock);
      if (isNaN(stock) || stock < 0) {
        newErrors.stock = 'Stock must be a valid positive number';
      } else if (stock > 999999) {
        newErrors.stock = 'Stock cannot exceed 999,999 units';
      }
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    // Barcode validation (optional)
    if (formData.barcode && (formData.barcode.length < 8 || formData.barcode.length > 20)) {
      newErrors.barcode = 'Barcode must be between 8-20 characters';
    }

    // Description validation (optional)
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    // Image URL validation (optional)
    if (formData.image && !isValidUrl(formData.image)) {
      newErrors.image = 'Please enter a valid image URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear submit status
    if (submitStatus) {
      setSubmitStatus(null);
    }
  };

  const generateBarcode = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const barcode = timestamp.slice(-8) + random;
    setFormData(prev => ({ ...prev, barcode }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrors({});

    try {
      // Prepare data for API
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      };

      let result;
      if (product) {
        // Update existing product
        result = await productService.updateProduct(product._id, submitData);
      } else {
        // Create new product
        result = await productService.createProduct(submitData);
      }

      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: result.message || `Product ${product ? 'updated' : 'created'} successfully!`
        });
        
        // Call success callback after a short delay
        setTimeout(() => {
          onSuccess && onSuccess(result.data);
        }, 1000);
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.message || `Failed to ${product ? 'update' : 'create'} product`
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'An unexpected error occurred'
      });
      console.error('Form submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        stock: product.stock?.toString() || '',
        category: product.category?._id || '',
        barcode: product.barcode || '',
        image: product.image || '',
        isActive: product.isActive !== undefined ? product.isActive : true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        barcode: '',
        image: '',
        isActive: true
      });
    }
    setErrors({});
    setSubmitStatus(null);
  };

  const isFormChanged = () => {
    if (!product) {
      return Object.values(formData).some(value => 
        typeof value === 'string' ? value.trim() : value !== true
      );
    }
    
    return (
      formData.name !== (product.name || '') ||
      formData.description !== (product.description || '') ||
      parseFloat(formData.price) !== (product.price || 0) ||
      parseInt(formData.stock) !== (product.stock || 0) ||
      formData.category !== (product.category?._id || '') ||
      formData.barcode !== (product.barcode || '') ||
      formData.image !== (product.image || '') ||
      formData.isActive !== (product.isActive !== undefined ? product.isActive : true)
    );
  };

  const selectedCategory = categories.find(cat => cat._id === formData.category);

  return (
    <div className="bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          {product ? 'Edit Product' : 'Create New Product'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {product ? 'Update product information' : 'Fill in the details to create a new product'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Product Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter product description (optional)"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.description ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              <p className="mt-1 text-xs text-gray-500">
                {formData.description.length}/1000 characters
              </p>
            </div>

            {/* Price and Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.price ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
              </div>

              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.stock ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              {loadingCategories ? (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  Loading categories...
                </div>
              ) : (
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.category ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
              
              {selectedCategory && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: selectedCategory.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{selectedCategory.description}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Image URL */}
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                Product Image URL
              </label>
              <input
                type="url"
                id="image"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.image ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
            </div>

            {/* Image Preview */}
            {formData.image && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Preview
                </label>
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="text-gray-400 text-lg hidden">
                    Invalid image URL
                  </div>
                </div>
              </div>
            )}

            {/* Barcode */}
            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
                Barcode
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="barcode"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  placeholder="Enter barcode or generate one"
                  className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.barcode ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={generateBarcode}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate
                </button>
              </div>
              {errors.barcode && <p className="mt-1 text-sm text-red-600">{errors.barcode}</p>}
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Product is active and available for sale
                </span>
              </label>
            </div>

            {/* Product Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Summary
              </label>
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      {formData.image && (
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">
                      {formData.name || 'Product Name'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.description || 'No description provided'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold text-gray-900">
                        ${formData.price || '0.00'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formData.stock || '0'} units
                      </span>
                    </div>
                    {selectedCategory && (
                      <span 
                        className="inline-block px-2 py-1 text-xs text-white rounded-full mt-2"
                        style={{ backgroundColor: selectedCategory.color }}
                      >
                        {selectedCategory.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Status */}
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

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
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
            disabled={isSubmitting || !isFormChanged()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {product ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;