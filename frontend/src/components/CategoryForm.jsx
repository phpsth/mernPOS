import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/categoryService';

const CategoryForm = ({ category = null, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6B7280'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Predefined color options
  const colorOptions = [
    '#EF4444', '#F97316', '#EAB308', '#22C55E', 
    '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
    '#6B7280', '#374151', '#1F2937', '#111827'
  ];

  // Initialize form with category data if editing
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        color: category.color || '#6B7280'
      });
    }
  }, [category]);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Category name must be less than 50 characters';
    }

    // Description validation
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  const handleColorSelect = (color) => {
    setFormData(prev => ({
      ...prev,
      color
    }));
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
      let result;
      if (category) {
        // Update existing category
        result = await categoryService.updateCategory(category._id, formData);
      } else {
        // Create new category
        result = await categoryService.createCategory(formData);
      }

      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: result.message || `Category ${category ? 'updated' : 'created'} successfully!`
        });
        
        // Call success callback after a short delay
        setTimeout(() => {
          onSuccess && onSuccess(result.data);
        }, 1000);
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.message || `Failed to ${category ? 'update' : 'create'} category`
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
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        color: category.color || '#6B7280'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#6B7280'
      });
    }
    setErrors({});
    setSubmitStatus(null);
  };

  const isFormChanged = () => {
    if (!category) {
      return formData.name || formData.description || formData.color !== '#6B7280';
    }
    return (
      formData.name !== category.name ||
      formData.description !== (category.description || '') ||
      formData.color !== (category.color || '#6B7280')
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md max-w-2xl mx-auto">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          {category ? 'Edit Category' : 'Create New Category'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {category ? 'Update category information' : 'Fill in the details to create a new category'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Category Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Category Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter category name"
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
            placeholder="Enter category description (optional)"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              errors.description ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          <p className="mt-1 text-xs text-gray-500">
            {formData.description.length}/500 characters
          </p>
        </div>

        {/* Color Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category Color
          </label>
          <div className="flex items-center space-x-4">
            <div className="grid grid-cols-6 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={`w-10 h-10 rounded-full border-2 hover:scale-110 transition-transform ${
                    formData.color === color ? 'border-gray-800 shadow-lg' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  disabled={isSubmitting}
                  title={color}
                />
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleColorSelect(e.target.value)}
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer disabled:cursor-not-allowed"
                disabled={isSubmitting}
                title="Custom color"
              />
              <span className="text-sm text-gray-600">Custom</span>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preview
          </label>
          <div className="flex items-center p-4 bg-gray-50 rounded-lg border">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
              style={{ backgroundColor: formData.color }}
            >
              {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="ml-4">
              <h3 className="font-medium text-gray-900">
                {formData.name || 'Category Name'}
              </h3>
              <p className="text-sm text-gray-500">
                {formData.description || 'No description provided'}
              </p>
            </div>
          </div>
        </div>

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
            disabled={isSubmitting || !isFormChanged()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {category ? 'Update Category' : 'Create Category'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;