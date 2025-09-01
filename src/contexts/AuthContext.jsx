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
 * - Auto-refreshes authentication tokens (backend only)
 * - Provides user information to components
 * - Falls back to dev mode when backend is unavailable
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components that will have access to auth context
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDevMode, setIsDevMode] = useState(false);

  // Initialize auth state on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('currentUser');
      
      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          
          // Check if it's a dev mode user
          if (user.isDevMode) {
            setCurrentUser(user);
            setIsDevMode(true);
            setLoading(false);
            return;
          }
          
          // Try to verify with backend
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/profile`);
          setCurrentUser(response.data);
          setupTokenRefresh();
        } catch (error) {
          console.error('Failed to initialize authentication:', error);
          // Check if stored user is from dev mode
          try {
            const user = JSON.parse(userData);
            if (user.isDevMode) {
              setCurrentUser(user);
              setIsDevMode(true);
            } else {
              logout();
            }
          } catch (parseError) {
            logout();
          }
        }
      }
      
      setLoading(false);
    };
    
    initializeAuth();
    
    return () => {
      if (window.refreshTimeout) {
        clearTimeout(window.refreshTimeout);
      }
    };
  }, []);

  /**
   * Set up token refresh before expiration (backend only)
   */
  const setupTokenRefresh = () => {
    if (window.refreshTimeout) {
      clearTimeout(window.refreshTimeout);
    }
    
    const token = localStorage.getItem('authToken');
    if (token && !isDevMode) {
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
   * Refresh authentication token (backend only)
   */
  const refreshToken = async () => {
    if (isDevMode) return; // Skip refresh in dev mode
    
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
   * Log in a user with user object (called from Login component)
   * @param {Object} user - User object from successful authentication
   */
  const login = async (user) => {
    try {
      setCurrentUser(user);
      setIsDevMode(user.isDevMode || false);
      
      if (!user.isDevMode) {
        setupTokenRefresh();
      }
    } catch (err) {
      setError('Login failed');
      throw err;
    }
  };

  /**
   * Sign up a new user (legacy method - now handled in components)
   * @param {Object} data - User registration data
   */
  const signup = async (data) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/signup`, data);
      const { access_token, user } = response.data;
      localStorage.setItem('authToken', access_token);
      localStorage.setItem('currentUser', JSON.stringify(user));
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
      if (currentUser && !isDevMode) {
        await axios.post(`${process.env.REACT_APP_API_URL}/auth/logout`);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      delete axios.defaults.headers.common['Authorization'];
      setCurrentUser(null);
      setIsDevMode(false);
      if (window.refreshTimeout) {
        clearTimeout(window.refreshTimeout);
      }
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    signup,
    logout,
    isAuthenticated: !!currentUser,
    isDevMode
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