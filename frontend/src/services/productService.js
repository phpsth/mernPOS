import { productsAPI } from './api';

export const productService = {
  // Get all products with enhanced filtering and search
  getAllProducts: async (params = {}) => {
    try {
      console.log('🔄 Fetching products...');
      const response = await productsAPI.getAll(params);
      console.log('✅ Products fetched successfully');
      
      return {
        success: true,
        data: response.data || response || [],
        message: 'Products fetched successfully'
      };
    } catch (error) {
      console.error('❌ Failed to fetch products:', error.message);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch products. Please check your connection and try again.',
        error: error.response?.data
      };
    }
  },

  // Get products - backward compatibility
  getProducts: async () => {
    const result = await productService.getAllProducts();
    return result.data;
  },

  // Get product by ID
  getProductById: async (id) => {
    try {
      console.log(`🔄 Fetching product ${id}...`);
      const response = await productsAPI.getById(id);
      console.log('✅ Product fetched successfully');
      
      return {
        success: true,
        data: response.data || response,
        message: 'Product fetched successfully'
      };
    } catch (error) {
      console.error(`❌ Failed to fetch product ${id}:`, error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch product',
        error: error.response?.data
      };
    }
  },

  // Create product with enhanced validation
  createProduct: async (productData) => {
    try {
      console.log('🔄 Creating new product...', productData);
      const response = await productsAPI.create(productData);
      console.log('✅ Product created successfully');
      
      return {
        success: true,
        data: response.data || response,
        message: 'Product created successfully'
      };
    } catch (error) {
      console.error('❌ Failed to create product:', error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create product',
        error: error.response?.data
      };
    }
  },

  // Update product
  updateProduct: async (id, productData) => {
    try {
      console.log(`🔄 Updating product ${id}...`, productData);
      const response = await productsAPI.update(id, productData);
      console.log('✅ Product updated successfully');
      
      return {
        success: true,
        data: response.data || response,
        message: 'Product updated successfully'
      };
    } catch (error) {
      console.error(`❌ Failed to update product ${id}:`, error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update product',
        error: error.response?.data
      };
    }
  },

  // Delete product
  deleteProduct: async (id) => {
    try {
      console.log(`🔄 Deleting product ${id}...`);
      const response = await productsAPI.delete(id);
      console.log('✅ Product deleted successfully');
      
      return {
        success: true,
        data: response.data || response,
        message: 'Product deleted successfully'
      };
    } catch (error) {
      console.error(`❌ Failed to delete product ${id}:`, error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete product',
        error: error.response?.data
      };
    }
  },

  // Update stock levels
  updateStock: async (id, stockData) => {
    try {
      console.log(`🔄 Updating stock for product ${id}...`, stockData);
      
      // Use PATCH endpoint for stock updates if available
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/products/${id}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(stockData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Stock updated successfully');
      
      return {
        success: true,
        data: data.data || data,
        message: 'Stock updated successfully'
      };
    } catch (error) {
      console.error(`❌ Failed to update stock for product ${id}:`, error.message);
      return {
        success: false,
        message: 'Failed to update stock',
        error: error.message
      };
    }
  },

  // Search products by barcode
  searchByBarcode: async (barcode) => {
    try {
      console.log(`🔄 Searching for barcode: ${barcode}`);
      const result = await productService.getAllProducts({ search: barcode });
      
      if (result.success) {
        const product = result.data.find(p => p.barcode === barcode);
        if (product) {
          return {
            success: true,
            data: product,
            message: 'Product found by barcode'
          };
        }
      }
      
      return {
        success: false,
        message: 'No product found with this barcode',
        error: 'Not found'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to search by barcode',
        error: error.message
      };
    }
  }
};