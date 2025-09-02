import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.jpeg';
import './Login.css';

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
 * Login Component
 * 
 * Handles user authentication through the login process:
 * - Email and password validation
 * - Authentication with backend API (with fallback to default users)
 * - Error handling and user feedback
 * - Redirects to appropriate dashboard based on user role
 */
const Login = () => {
  // State for form inputs and errors
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isDevMode, setIsDevMode] = useState(false);

  // Get authentication context and navigation
  const { login } = useAuth();
  const navigate = useNavigate();

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('currentUser');
      
      if (token && userData) {
        try {
          // Try to verify with backend first
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.isValid) {
            navigate(response.data.role === 'admin' ? '/admin/dashboard' : '/dashboard');
          }
        } catch (error) {
          // If backend fails, check if it's a dev mode token
          try {
            const user = JSON.parse(userData);
            if (user && user.isDevMode) {
              setIsDevMode(true);
              navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
              return;
            }
          } catch (parseError) {
            // Invalid stored data, clear it
          }
          
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
        }
      }
    };
    
    checkAuthStatus();
  }, [navigate]);

  /**
   * Validate email format
   * @param {string} email - User email to validate
   * @returns {boolean} - Whether email is valid
   */
  const validateEmail = (email) => {
    if (!email.endsWith('@pau.edu.ng')) {
      setErrors(prev => ({
        ...prev,
        email: 'Please use your university email address (@pau.edu.ng)'
      }));
      return false;
    }
    return true;
  };

  /**
   * Authenticate with default users (dev mode)
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object|null} - User object if found, null otherwise
   */
  const authenticateWithDefaults = (email, password) => {
    const user = DEFAULT_USERS.find(u => u.email === email && u.password === password);
    if (user) {
      return {
        access_token: `dev_token_${user.id}_${Date.now()}`,
        user: { ...user, isDevMode: true }
      };
    }
    return null;
  };

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors and messages
    setErrors({});
    setMessage({ text: '', type: '' });
    
    // Validate inputs
    if (!validateEmail(email)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare login data according to the exact backend requirements
      const loginData = {
        email: email.toLowerCase().trim(),
        password: password
      };

      // Additional validation to ensure all required fields are present
      if (!loginData.email || !loginData.password) {
        setIsLoading(false);
        setMessage({
          text: 'Please provide both email and password.',
          type: 'error'
        });
        return;
      }

      // Log the request data for debugging
      console.log('Sending login data to backend:', loginData);
      console.log('Backend URL:', `${process.env.REACT_APP_API_URL}/auth/login`);
      
      // First, try to authenticate with backend with proper headers
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/login`, 
        loginData,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      setIsLoading(false);
      
      // Handle successful backend login
      const { access_token: token, user } = response.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
      await login(user);
      
      console.log('Backend login successful:', response.data);
      setMessage({
        text: 'Login successful! Redirecting to dashboard...',
        type: 'success'
      });
      
      setTimeout(() => {
        navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      }, 1500);
      
    } catch (error) {
      // Log detailed error information
      console.error('Backend login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      // Handle specific backend authentication errors
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            'Invalid credentials provided.';
        
        setIsLoading(false);
        setMessage({
          text: errorMessage,
          type: 'error'
        });
        return; // Don't fallback to default users for validation errors
      }
      
      // If backend fails, try default authentication
      console.warn('Backend authentication failed, trying default users...', error.message);
      
      const defaultAuth = authenticateWithDefaults(email, password);
      
      if (defaultAuth) {
        // Handle successful default login
        setIsDevMode(true);
        localStorage.setItem('authToken', defaultAuth.access_token);
        localStorage.setItem('currentUser', JSON.stringify(defaultAuth.user));
        await login(defaultAuth.user);
        
        setMessage({
          text: 'Login successful (Dev Mode)! Redirecting to dashboard...',
          type: 'success'
        });
        
        setTimeout(() => {
          navigate(defaultAuth.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
        }, 1500);
        
      } else {
        // Handle authentication failure
        setIsLoading(false);
        
        if (error.response) {
          const { status, data } = error.response;
          
          switch (status) {
            case 401:
              setErrors({ password: data.message || 'Invalid credentials' });
              break;
            case 404:
              setMessage({
                text: 'Account not found. Please check your credentials or try default accounts.',
                type: 'error'
              });
              break;
            case 403:
              setMessage({
                text: data.message || 'Your account is not activated yet.',
                type: 'error'
              });
              break;
            default:
              setMessage({
                text: 'Invalid credentials. Try default accounts for dev mode.',
                type: 'error'
              });
          }
        } else {
          // Network error - suggest default credentials
          setMessage({
            text: 'Backend unavailable. Try: admin@pau.edu.ng / Admin123 or student@pau.edu.ng / Student123',
            type: 'info'
          });
          setIsLoading(false);
        }
      }
    }
  };

  /**
   * Handle forgot password request
   * @param {Event} e - Click event
   */
  const handleForgotPassword = (e) => {
    e.preventDefault();
    navigate('/forgot-password');
  };

  const handleSignup = (e) => {
    e.preventDefault();
    navigate('/signup');
  };

  return (
    <div className="container">
      <div className="sidebar">
        <div className="logo-container">
          <div className="logo">
            <img src={logo} alt="PAU Bookit Logo" />
          </div>
          <div className="app-name">
            <span className="app_name_differentiate">PAU</span> Bookit
          </div>
        </div>
        <div className="sidebar-content">
          <h1>Welcome!</h1>
          <p>Book a class in Pan-Atlantic University's SST or TYD.</p>
          {isDevMode && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.5rem', 
              backgroundColor: '#e8f4fd', 
              borderRadius: '4px',
              fontSize: '0.8rem',
              border: '1px solid #bee5eb'
            }}>
              <strong>Dev Mode Active</strong>
              <br />
              Admin: admin@pau.edu.ng / Admin123
              <br />
              Student: student@pau.edu.ng / Student123
            </div>
          )}
        </div>
      </div>
      
      <div className="form-container">
        <form id="loginForm" className="form active" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="login-email">Email Address</label>
            <input 
              type="email" 
              id="login-email" 
              placeholder="Enter your university email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
            {errors.email && <p className="error-message visible">{errors.email}</p>}
          </div>
          
          <div className="input-group">
            <label htmlFor="login-password">Password</label>
            <input 
              type="password" 
              id="login-password" 
              placeholder="Enter your password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            {errors.password && <p className="error-message visible">{errors.password}</p>}
          </div>

          <div className="links-div">
            <div className="forgot-pass">
              <a href="/#" onClick={handleSignup}>Signup</a>
            </div>
            <div className="forgot-pass">
              <a href="/#" onClick={handleForgotPassword}>Forgot password?</a>
            </div>
          </div>
          
          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
          
          {isLoading && (
            <div className="loading visible">
              <div className="spinner"></div>
            </div>
          )}
        </form>
      </div>
      
      {message.text && (
        <div className="message-container">
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;