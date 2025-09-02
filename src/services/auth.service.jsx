import axios from 'axios';

// Default users for development phase
const DEFAULT_USERS = [
  {
    id: 1,
    email: 'admin@pau.edu.ng',
    password: 'Admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    studentId: 'ADM12345',
    isActive: true
  },
  {
    id: 2,
    email: 'student@pau.edu.ng',
    password: 'Student123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'student',
    studentId: 'STU12345',
    isActive: true
  },
  {
    id: 3,
    email: 'jane.smith@pau.edu.ng',
    password: 'Student456',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'student',
    studentId: 'STU12346',
    isActive: true
  },
  {
    id:4,
    email: 'facility@pau.edu.ng',
    password: 'Facility123',
    firstName: 'Facility',
    lastName: 'Staff',
    role: 'facility',
    studentId: 'FAC12345',
    isActive: true
  }
];

/**
 * Auth service for handling authentication-related API calls
 * Includes fallback to default users for development phase
 */
const AuthService = {
  /**
   * API base URL from environment variable
   */
  API_URL: process.env.REACT_APP_API_URL,

  /**
   * Check if we're in development mode (backend unavailable)
   */
  isDevMode: false,

  /**
   * Authenticate with default users (dev mode)
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object|null} - Authentication result or null
   */
  authenticateWithDefaults: (email, password) => {
    const user = DEFAULT_USERS.find(u => u.email === email && u.password === password);
    if (user) {
      return {
        access_token: `dev_token_${user.id}_${Date.now()}`,
        user: { ...user, isDevMode: true }
      };
    }
    return null;
  },

  /**
   * Login user with email and password
   * @param {string} email - User email address
   * @param {string} password - User password
   * @returns {Promise} Promise with response data containing token and user info
   */
  login: async (email, password) => {
    try {
      // Try backend first
      const response = await axios.post(`${AuthService.API_URL}/auth/login`, {
        email,
        password
      });
      AuthService.isDevMode = false;
      return response.data;
    } catch (error) {
      // If backend fails, try default authentication
      console.warn('Backend login failed, trying default users...', error.message);
      
      const defaultAuth = AuthService.authenticateWithDefaults(email, password);
      if (defaultAuth) {
        AuthService.isDevMode = true;
        return defaultAuth;
      }
      
      // If both fail, throw error
      throw new Error('Invalid credentials');
    }
  },

  /**
   * Log out current user
   * @returns {Promise} Promise with logout result
   */
  logout: async () => {
    if (!AuthService.isDevMode) {
      try {
        return await axios.post(`${AuthService.API_URL}/auth/logout`);
      } catch (error) {
        console.warn('Backend logout failed:', error.message);
      }
    }
    // For dev mode, just resolve
    return Promise.resolve();
  },

  /**
   * Refresh authentication token (backend only)
   * @returns {Promise} Promise with new token
   */
  refreshToken: async () => {
    if (AuthService.isDevMode) {
      throw new Error('Token refresh not available in dev mode');
    }
    
    const response = await axios.post(`${AuthService.API_URL}/auth/refresh`);
    return response.data;
  },

  /**
   * Verify token validity
   * @param {string} token - JWT token to verify
   * @returns {Promise} Promise with verification result
   */
  verifyToken: async (token) => {
    // Check if it's a dev mode token
    if (token.startsWith('dev_token_')) {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.isDevMode) {
            return { isValid: true, role: user.role, user };
          }
        } catch (error) {
          return { isValid: false };
        }
      }
      return { isValid: false };
    }
    
    // Try backend verification
    try {
      const response = await axios.get(`${AuthService.API_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      AuthService.isDevMode = false;
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get current user profile
   * @returns {Promise} Promise with user profile data
   */
  getUserProfile: async () => {
    if (AuthService.isDevMode) {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        return JSON.parse(userData);
      }
      throw new Error('No user data found');
    }
    
    const response = await axios.get(`${AuthService.API_URL}/auth/profile`);
    return response.data;
  },

  /**
   * Initialize password reset process
   * @param {string} email - User email address
   * @returns {Promise} Promise with reset initialization result
   */
  forgotPassword: async (email) => {
    if (AuthService.isDevMode) {
      // Simulate password reset in dev mode
      const user = DEFAULT_USERS.find(u => u.email === email);
      if (user) {
        return { 
          message: 'Password reset email sent (simulated in dev mode)',
          success: true 
        };
      } else {
        throw new Error('Email not found');
      }
    }
    
    const response = await axios.post(`${AuthService.API_URL}/auth/forgot-password`, { email });
    return response.data;
  },

  /**
   * Reset password with token
   * @param {string} token - Password reset token
   * @param {string} password - New password
   * @returns {Promise} Promise with password reset result
   */
  resetPassword: async (token, password) => {
    if (AuthService.isDevMode) {
      // Simulate password reset in dev mode
      return { 
        message: 'Password reset successful (simulated in dev mode)',
        success: true 
      };
    }
    
    const response = await axios.post(`${AuthService.API_URL}/auth/reset-password`, {
      token,
      password
    });
    return response.data;
  },

  /**
   * Set up axios interceptors for authentication
   * - Add token to requests
   * - Handle authentication errors
   * @param {Function} logoutCallback - Function to call when auth fails
   */
  setupInterceptors: (logoutCallback) => {
    // Request interceptor - add auth token to requests
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle auth errors
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Skip retry for dev mode tokens
        if (AuthService.isDevMode) {
          return Promise.reject(error);
        }
        
        // If error is 401 Unauthorized and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Try to refresh token
            const response = await AuthService.refreshToken();
            const { token } = response;
            
            // Update stored token
            localStorage.setItem('authToken', token);
            
            // Update auth header and retry request
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            
            return axios(originalRequest);
          } catch (refreshError) {
            // Refresh failed, log out user
            if (logoutCallback) {
              logoutCallback();
            }
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  },

  /**
   * Get default users for development (useful for testing)
   * @returns {Array} Array of default users
   */
  getDefaultUsers: () => {
    return DEFAULT_USERS.map(user => ({
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    }));
  }
};

export default AuthService;