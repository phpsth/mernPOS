import { categoriesAPI } from './api.js';

export const categoryService = {
  // Get all categories (Public endpoint)
  getAllCategories: async (params = {}) => {
    try {
      console.log('🔄 Fetching categories...');
      const response = await categoriesAPI.getAll(params);
      console.log('✅ Categories fetched successfully');
      
      return {
        success: true,
        data: response.data || response || [],
        message: 'Categories fetched successfully'
      };
    } catch (error) {
      console.error('❌ Failed to fetch categories:', error.message);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch categories. Please check your connection and try again.',
        error: error.response?.data
      };
    }
  },

  // Get category by ID
  getCategoryById: async (id) => {
    try {
      console.log(`🔄 Fetching category ${id}...`);
      const response = await categoriesAPI.getById(id);
      console.log('✅ Category fetched successfully');
      
      return {
        success: true,
        data: response.data || response,
        message: 'Category fetched successfully'
      };
    } catch (error) {
      console.error(`❌ Failed to fetch category ${id}:`, error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch category',
        error: error.response?.data
      };
    }
  },

  // Create new category (Admin only)
  createCategory: async (categoryData) => {
    try {
      console.log('🔄 Creating new category...', categoryData);
      const response = await categoriesAPI.create(categoryData);
      console.log('✅ Category created successfully');
      
      return {
        success: true,
        data: response.data || response,
        message: 'Category created successfully'
      };
    } catch (error) {
      console.error('❌ Failed to create category:', error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create category',
        error: error.response?.data
      };
    }
  },

  // Update category (Admin only)
  updateCategory: async (id, categoryData) => {
    try {
      console.log(`🔄 Updating category ${id}...`, categoryData);
      const response = await categoriesAPI.update(id, categoryData);
      console.log('✅ Category updated successfully');
      
      return {
        success: true,
        data: response.data || response,
        message: 'Category updated successfully'
      };
    } catch (error) {
      console.error(`❌ Failed to update category ${id}:`, error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update category',
        error: error.response?.data
      };
    }
  },

  // Delete category (Admin only)
  deleteCategory: async (id) => {
    try {
      console.log(`🔄 Deleting category ${id}...`);
      const response = await categoriesAPI.delete(id);
      console.log('✅ Category deleted successfully');
      
      return {
        success: true,
        data: response.data || response,
        message: 'Category deleted successfully'
      };
    } catch (error) {
      console.error(`❌ Failed to delete category ${id}:`, error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete category',
        error: error.response?.data
      };
    }
  }
};