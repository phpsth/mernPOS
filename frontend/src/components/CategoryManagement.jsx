import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/categoryService';
import CategoryList from './CategoryList';
import CategoryForm from './CategoryForm';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async (search = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await categoryService.getAllCategories({ search });
      
      if (result.success) {
        setCategories(result.data || []);
      } else {
        throw new Error(result.message || 'Failed to load categories');
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    loadCategories(term);
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      setLoading(true);
      const result = await categoryService.deleteCategory(categoryId);
      
      if (result.success) {
        await loadCategories(searchTerm);
        alert('Category deleted successfully!');
      } else {
        throw new Error(result.message || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (categoryData) => {
    try {
      setLoading(true);
      let result;

      if (editingCategory) {
        result = await categoryService.updateCategory(editingCategory._id, categoryData);
      } else {
        result = await categoryService.createCategory(categoryData);
      }

      if (result.success) {
        await loadCategories(searchTerm);
        setShowForm(false);
        setEditingCategory(null);
        alert(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
      } else {
        throw new Error(result.message || 'Failed to save category');
      }
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Failed to save category: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
            <p className="mt-1 text-gray-600">Organize your products into categories</p>
          </div>
          <button
            onClick={handleCreateCategory}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Add New Category
          </button>
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

      {/* Category Form Modal */}
      {showForm && (
        <CategoryForm
          category={editingCategory}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={loading}
        />
      )}

      {/* Category List */}
      <CategoryList
        categories={categories}
        loading={loading}
        searchTerm={searchTerm}
        onSearch={handleSearch}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
      />
    </div>
  );
};

export default CategoryManagement;