import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create Authentication Context
const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * 
 * Provides authentication state and functions to the application:
 * - Manages user authentication state
 * - Handles login, signup, and logout operations
 * - Auto-refreshes authentication tokens
 * - Provides user information to components
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components that will have access to auth context
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Initialize auth state on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/profile`);
          setCurrentUser(response.data);
          setupTokenRefresh();
        } catch (error) {
          console.error('Failed to initialize authentication:', error);
          logout();
        }
      }
      
      setLoading(false);
    };
    
    initializeAuth();
    
    return () => {
      clearTimeout(window.refreshTimeout);
    };
  }, []);

  /**
   * Set up token refresh before expiration
   */
  const setupTokenRefresh = () => {
    if (window.refreshTimeout) {
      clearTimeout(window.refreshTimeout);
    }
    
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        const expiresIn = (payload.exp * 1000) - Date.now();
        const refreshTime = expiresIn - (5 * 60 * 1000);
        
        if (refreshTime > 0) {
          window.refreshTimeout = setTimeout(refreshToken, refreshTime);
        } else {
          refreshToken();
        }
      } catch (error) {
        console.error('Error setting up token refresh:', error);
        logout();
      }
    }
  };

  /**
   * Refresh authentication token
   */
  const refreshToken = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/refresh`);
      const { token } = response.data;
      localStorage.setItem('authToken', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setupTokenRefresh();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
    }
  };

  /**
   * Log in a user with credentials
   * @param {string} email - User email
   * @param {string} password - User password
   */
  const login = async (email, password) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, { email, password });
      const { access_token, user } = response.data;
      localStorage.setItem('authToken', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setCurrentUser(user);
      setupTokenRefresh();
    } catch (err) {
      setError('Login failed');
      throw err;
    }
  };

  /**
   * Sign up a new user
   * @param {Object} data - User registration data
   * @param {string} data.role - User role ("admin" or "normal_user")
   * @param {string} [data.adminType] - Admin type (for role: "admin")
   * @param {string} [data.normalUserType] - Normal user type (for role: "normal_user")
   * @param {string} data.name - User name
   * @param {string} data.email - User email
   * @param {string} data.password - User password
   */
  const signup = async (data) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/signup`, data);
      const { access_token, user } = response.data;
      localStorage.setItem('authToken', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setCurrentUser(user);
      setupTokenRefresh();
    } catch (err) {
      setError('Signup failed');
      throw err;
    }
  };

  /**
   * Log out the current user
   */
  const logout = async () => {
    try {
      if (currentUser) {
        await axios.post(`${process.env.REACT_APP_API_URL}/auth/logout`);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      delete axios.defaults.headers.common['Authorization'];
      setCurrentUser(null);
      clearTimeout(window.refreshTimeout);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    signup,
    logout,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the auth context
 * @returns {Object} Auth context values and functions
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;