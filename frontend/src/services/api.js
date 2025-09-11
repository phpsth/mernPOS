import axios from 'axios';

// Base API configuration (pos-backend runs on port 5000 to avoid conflict with React on 3000)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};
const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;
        setTokens(access_token, refresh_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Mock users for development (matches backend user structure)
const mockUsers = [
  { 
    _id: '1', 
    firstName: 'Admin', 
    lastName: 'User', 
    email: 'admin@pos.com', 
    username: 'admin',
    role: 'admin', 
    password: 'password123',
    isActive: true 
  },
  { 
    _id: '2', 
    firstName: 'Manager', 
    lastName: 'User', 
    email: 'manager@pos.com', 
    username: 'manager',
    role: 'manager', 
    password: 'password123',
    isActive: true 
  },
  { 
    _id: '3', 
    firstName: 'Cashier', 
    lastName: 'User', 
    email: 'cashier@pos.com', 
    username: 'cashier',
    role: 'cashier', 
    password: 'password123',
    isActive: true 
  }
];

// Mock authentication functions for development
const mockAuthAPI = {
  login: async (credentials) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Backend accepts 'login' field for email or username
    const user = mockUsers.find(u => 
      (u.email === credentials.login || u.username === credentials.login) && 
      u.password === credentials.password
    );
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    const { password, ...userWithoutPassword } = user;
    // Match backend response format
    return {
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        accessToken: `mock-token-${user._id}`,
        refreshToken: `mock-refresh-${user._id}`,
        expiresIn: '7d'
      }
    };
  },

  register: async (userData) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if user already exists
    if (mockUsers.find(u => u.email === userData.email || u.username === userData.username)) {
      throw new Error('User already exists');
    }
    
    const newUser = {
      _id: Date.now().toString(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      username: userData.username,
      role: userData.role || 'cashier',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    mockUsers.push({ ...newUser, password: userData.password });
    
    return {
      success: true,
      message: 'User registered successfully',
      data: {
        user: newUser,
        accessToken: `mock-token-${newUser._id}`,
        refreshToken: `mock-refresh-${newUser._id}`,
        expiresIn: '7d'
      }
    };
  },

  logout: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    clearTokens();
  },

  getProfile: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const token = getAccessToken();
    if (!token) {
      throw new Error('No token found');
    }
    
    // Extract user ID from token (mock implementation)
    const userId = token.split('-')[2];
    const user = mockUsers.find(u => u._id.toString() === userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const { password, ...userWithoutPassword } = user;
    return {
      success: true,
      data: userWithoutPassword
    };
  }
};

// Real Auth API calls
const realAuthAPI = {
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  }
};

// Auth API calls - Try real API first, fallback to mock
export const authAPI = {
  login: async (credentials) => {
    try {
      console.log('🔄 Trying real API login...');
      const response = await realAuthAPI.login(credentials);
      console.log('✅ Real API login successful');
      return response;
    } catch (error) {
      console.log('❌ Real API failed, using mock:', error.message);
      return await mockAuthAPI.login(credentials);
    }
  },

  register: async (userData) => {
    try {
      console.log('🔄 Trying real API registration...');
      const response = await realAuthAPI.register(userData);
      console.log('✅ Real API registration successful');
      return response;
    } catch (error) {
      console.log('❌ Real API failed, using mock:', error.message);
      return await mockAuthAPI.register(userData);
    }
  },

  logout: async () => {
    try {
      console.log('🔄 Trying real API logout...');
      const response = await realAuthAPI.logout();
      console.log('✅ Real API logout successful');
      return response;
    } catch (error) {
      console.log('❌ Real API failed, using mock:', error.message);
      return await mockAuthAPI.logout();
    }
  },

  getProfile: async () => {
    try {
      console.log('🔄 Trying real API profile...');
      const response = await realAuthAPI.getProfile();
      console.log('✅ Real API profile successful');
      return response;
    } catch (error) {
      console.log('❌ Real API failed, using mock:', error.message);
      return await mockAuthAPI.getProfile();
    }
  }
};

// Products API calls
export const productsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/products');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  create: async (productData) => {
    const response = await apiClient.post('/products', productData);
    return response.data;
  },

  update: async (id, productData) => {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  }
};

// Orders API calls
export const ordersAPI = {
  getAll: async () => {
    const response = await apiClient.get('/orders');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  create: async (orderData) => {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  },

  update: async (id, orderData) => {
    const response = await apiClient.put(`/orders/${id}`, orderData);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await apiClient.patch(`/orders/${id}/status`, { status });
    return response.data;
  }
};

// Reports API calls
export const reportsAPI = {
  getSalesReport: async (params) => {
    const response = await apiClient.get('/reports/sales', { params });
    return response.data;
  },

  getTopProducts: async (params) => {
    const response = await apiClient.get('/reports/top-products', { params });
    return response.data;
  },

  getDashboard: async () => {
    const response = await apiClient.get('/reports/dashboard');
    return response.data;
  }
};

// Categories API calls
export const categoriesAPI = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/categories', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },

  create: async (categoryData) => {
    const response = await apiClient.post('/categories', categoryData);
    return response.data;
  },

  update: async (id, categoryData) => {
    const response = await apiClient.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data;
  }
};

// Stats API calls
export const statsAPI = {
  getOverviewStats: async (period = '30') => {
    const response = await apiClient.get('/stats/overview', {
      params: { period }
    });
    return response.data;
  },

  getSalesStats: async (period = '30', groupBy = 'day') => {
    const response = await apiClient.get('/stats/sales', {
      params: { period, groupBy }
    });
    return response.data;
  },

  getProductStats: async (period = '30') => {
    const response = await apiClient.get('/stats/products', {
      params: { period }
    });
    return response.data;
  },

  getCustomerStats: async (period = '30') => {
    const response = await apiClient.get('/stats/customers', {
      params: { period }
    });
    return response.data;
  },

  getRevenueStats: async (period = '30', forecast = false) => {
    const response = await apiClient.get('/stats/revenue', {
      params: { period, forecast }
    });
    return response.data;
  }
};

// Utility functions
export { setTokens, clearTokens, getAccessToken };
export default apiClient;