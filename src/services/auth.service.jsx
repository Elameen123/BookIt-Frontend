import axios from 'axios';

/**
 * Auth service for handling authentication-related API calls
 */
const AuthService = {
  /**
   * API base URL from environment variable
   */
  API_URL: process.env.REACT_APP_API_URL,

  /**
   * Login user with email and password
   * @param {string} email - User email address
   * @param {string} password - User password
   * @returns {Promise} Promise with response data containing token and user info
   */
  login: async (email, password) => {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
      email,
      password
    });
    return response.data;
  },

  /**
   * Log out current user
   * @returns {Promise} Promise with logout result
   */
  logout: async () => {
    return await axios.post(`${process.env.REACT_APP_API_URL}/auth/logout`);
  },

  /**
   * Refresh authentication token
   * @returns {Promise} Promise with new token
   */
  refreshToken: async () => {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/refresh`);
    return response.data;
  },

  /**
   * Verify token validity
   * @param {string} token - JWT token to verify
   * @returns {Promise} Promise with verification result
   */
  verifyToken: async (token) => {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Get current user profile
   * @returns {Promise} Promise with user profile data
   */
  getUserProfile: async () => {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/profile`);
    return response.data;
  },

  /**
   * Initialize password reset process
   * @param {string} email - User email address
   * @returns {Promise} Promise with reset initialization result
   */
  forgotPassword: async (email) => {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/forgot-password`, { email });
    return response.data;
  },

  /**
   * Reset password with token
   * @param {string} token - Password reset token
   * @param {string} password - New password
   * @returns {Promise} Promise with password reset result
   */
  resetPassword: async (token, password) => {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/reset-password`, {
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
  }
};

export default AuthService;