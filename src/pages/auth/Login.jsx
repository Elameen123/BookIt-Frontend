import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.jpeg';
import './Login.css';

/**
 * Login Component
 * 
 * Handles user authentication through the login process:
 * - Email and password validation
 * - Authentication with backend API
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

  // Get authentication context and navigation
  const { login } = useAuth();
  const navigate = useNavigate();

  // console.log('Backend API URL:', process.env.REACT_APP_API_URL);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // Verify token validity with backend
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/verify`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.isValid) {
            // Redirect to appropriate dashboard based on user role
            navigate(response.data.role === 'admin' ? '/admin/dashboard' : '/dashboard');
          }
        } catch (error) {
          // Token invalid or expired, clear it
          localStorage.removeItem('authToken');
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
    // Check if it's a PAU email
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
      // Attempt login with backend
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
        email,
        password
      });
      
      // Handle successful login
      const { token, user } = response.data;
      
      // Store token in localStorage (will be better handled by httpOnly cookies in production)
      localStorage.setItem('authToken', token);
      
      // Update auth context
      login(user);
      
      // Show success message
      setMessage({
        text: 'Login successful! Redirecting to dashboard...',
        type: 'success'
      });
      
      // Redirect based on user role after short delay
      setTimeout(() => {
        navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      }, 1500);
      
    } catch (error) {
      setIsLoading(false);
      
      // Handle different error cases
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 401:
            // Unauthorized - wrong credentials
            setErrors({ password: data.message || 'Invalid credentials' });
            break;
          case 404:
            // User not found
            setMessage({
              text: 'Account not found. Please contact your administrator.',
              type: 'error'
            });
            break;
          case 403:
            // Account not activated
            setMessage({
              text: data.message || 'Your account is not activated yet.',
              type: 'error'
            });
            break;
          default:
            // Other server errors
            setMessage({
              text: data.message || 'An error occurred during login. Please try again.',
              type: 'error'
            });
        }
      } else {
        // Network or other errors
        setMessage({
          text: 'Unable to connect to the server. Please check your connection.',
          type: 'error'
        });
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
      {/* Sidebar with logo and welcome message */}
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
        </div>
      </div>
      
      {/* Login form */}
      <div className="form-container">
        <form id="loginForm" className="form active" onSubmit={handleSubmit}>
          {/* Email input */}
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
          
          {/* Password input */}
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
           {/* Signup Link */}
          <div className="forgot-pass">
            <a href="/#" onClick={handleSignup}>Signup</a>
          </div>
          
          {/* Forgot password link */}
          <div className="forgot-pass">
            <a href="/#" onClick={handleForgotPassword}>Forgot password?</a>
          </div>
         </div>
          
          {/* Submit button */}
          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
          
          {/* Loading spinner */}
          {isLoading && (
            <div className="loading visible">
              <div className="spinner"></div>
            </div>
          )}
        </form>
      </div>
      
      {/* Message container for notifications */}
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