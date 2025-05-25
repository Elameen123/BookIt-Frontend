import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create Authentication Context
const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * 
 * Provides authentication state and functions to the application:
 * - Manages user authentication state
 * - Handles login and logout operations
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
          // Set default auth header for all requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch current user data
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/profile`);
          setCurrentUser(response.data);
          
          // Setup token refresh interval
          setupTokenRefresh();
        } catch (error) {
          console.error('Failed to initialize authentication:', error);
          logout(); // Clear invalid auth state
        }
      }
      
      setLoading(false);
    };
    
    initializeAuth();
    
    // Cleanup function
    return () => {
      clearTimeout(window.refreshTimeout);
    };
  }, []);

  /**
   * Set up token refresh before expiration
   */
  const setupTokenRefresh = () => {
    // Clear any existing refresh timeout
    if (window.refreshTimeout) {
      clearTimeout(window.refreshTimeout);
    }
    
    // Get token from storage
    const token = localStorage.getItem('authToken');
    
    if (token) {
      try {
        // Decode token to get expiration time (assumes JWT)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        // Calculate time until token expires (in milliseconds)
        const expiresIn = (payload.exp * 1000) - Date.now();
        
        // Refresh token 5 minutes before expiration
        const refreshTime = expiresIn - (5 * 60 * 1000);
        
        if (refreshTime > 0) {
          window.refreshTimeout = setTimeout(refreshToken, refreshTime);
        } else {
          // Token already expired or about to expire
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
      
      // Update stored token
      localStorage.setItem('authToken', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Setup next refresh
      setupTokenRefresh();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
    }
  };

  /**
   * Log in a user with credentials
   * @param {Object} userData - User data returned from login API
   */
  const login = (userData) => {
    setCurrentUser(userData);
    setupTokenRefresh();
  };

  /**
   * Log out the current user
   */
  const logout = async () => {
    try {
      // Call logout endpoint if user is logged in
      if (currentUser) {
        await axios.post(`${process.env.REACT_APP_API_URL}/auth/logout`);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear auth state regardless of API success
      localStorage.removeItem('authToken');
      delete axios.defaults.headers.common['Authorization'];
      setCurrentUser(null);
      clearTimeout(window.refreshTimeout);
    }
  };

  // Context value to be provided
  const value = {
    currentUser,
    loading,
    error,
    login,
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