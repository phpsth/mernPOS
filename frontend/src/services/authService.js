import { authAPI } from "./api";

export const authService = {
     // Login with real JWT authentication
  login: async (login, password) => {
    // Call real pos-backend API
    const response = await authAPI.login({login, password});
    const { user, accessToken, refreshToken } = response.data;
    
    // Store real JWT tokens
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    console.log('✅ Authenticated with real JWT tokens');
    return user;
  },


  // Register with real API
  register: async (firstName, lastName, email, username, password, role = 'cashier') => {
    const response = await authAPI.register({ firstName, lastName, email, username, password, role });
    const { user, accessToken, refreshToken } = response.data;
    
    // Store real JWT tokens
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    console.log('✅ Registered with real JWT tokens');
    return user;
  },

  // Logout with real API call
  logout: async () => {
    try {
    //   await authAPI.log();
    } catch (error) {
      console.log('Logout API call failed:', error.message);
    }
    
    // Clear all auth data
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  isLoggedIn: () => {
    return localStorage.getItem('isLoggedIn') === 'true';
  }
};