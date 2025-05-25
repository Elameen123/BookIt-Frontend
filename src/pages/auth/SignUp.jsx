import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.jpeg';
import './Login.css'; // Reusing the same CSS styles

/**
 * Signup Component
 * 
 * Handles user registration through the signup process:
 * - Email, password, and personal information validation
 * - Registration with backend API
 * - Error handling and user feedback
 * - Email verification process
 */
const Signup = () => {
  // State for form inputs and errors
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    role: 'student' // Default role
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get authentication context and navigation
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (currentUser) {
      navigate(currentUser.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    }
  }, [currentUser, navigate]);

  /**
   * Handle input changes
   * @param {Event} e - Input change event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

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
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {boolean} - Whether password is valid
   */
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (password.length < minLength) {
      setErrors(prev => ({
        ...prev,
        password: 'Password must be at least 8 characters long'
      }));
      return false;
    }

    if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
      setErrors(prev => ({
        ...prev,
        password: 'Password must contain uppercase, lowercase, and numbers'
      }));
      return false;
    }

    return true;
  };

  /**
   * Validate student ID format
   * @param {string} studentId - Student ID to validate
   * @returns {boolean} - Whether student ID is valid
   */
  const validateStudentId = (studentId) => {
    // PAU student ID format: 3 letters + 5 numbers (e.g., STU12345)
    const studentIdPattern = /^[A-Z]{3}\d{5}$/;
    
    if (!studentIdPattern.test(studentId)) {
      setErrors(prev => ({
        ...prev,
        studentId: 'Student ID must be in format: ABC12345 (3 letters + 5 numbers)'
      }));
      return false;
    }
    return true;
  };

  /**
   * Validate form inputs
   * @returns {boolean} - Whether form is valid
   */
  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      return false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      return false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    } else if (!validateStudentId(formData.studentId.toUpperCase())) {
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setMessage({ text: '', type: '' });
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare signup data
      const signupData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        studentId: formData.studentId.toUpperCase().trim(),
        role: formData.role
      };

      // Attempt signup with backend
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/signup`, signupData);
      console.error('Signup response:', response.data);
      setIsLoading(false);
      
      // Handle successful signup
      setMessage({
        text: 'Account created successfully! Please check your email to verify your account.',
        type: 'success'
      });
      
      // Clear form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        studentId: '',
        role: 'student'
      });
      
      // Redirect to login after delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      setIsLoading(false);
      
      // Handle different error cases
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 400:
            // Bad request - validation errors
            if (data.errors) {
              setErrors(data.errors);
            } else {
              setMessage({
                text: data.message || 'Please check your input and try again.',
                type: 'error'
              });
            }
            break;
          case 409:
            // Conflict - user already exists
            setMessage({
              text: 'An account with this email or student ID already exists.',
              type: 'error'
            });
            break;
          case 422:
            // Unprocessable entity - validation failed
            setMessage({
              text: data.message || 'Please check your information and try again.',
              type: 'error'
            });
            break;
          default:
            // Other server errors
            setMessage({
              text: data.message || 'An error occurred during signup. Please try again.',
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
          <h1>Join Us!</h1>
          <p>Create your account to start booking classrooms at Pan-Atlantic University.</p>
        </div>
      </div>
      
      {/* Signup form */}
      <div className="form-container">
        <form id="signupForm" className="form active" onSubmit={handleSubmit}>
          {/* Name inputs */}
          <div className="input-group">
            <label htmlFor="firstName">First Name</label>
            <input 
              type="text" 
              id="firstName" 
              name="firstName"
              placeholder="Enter your first name" 
              value={formData.firstName}
              onChange={handleInputChange}
              required 
            />
            {errors.firstName && <p className="error-message visible">{errors.firstName}</p>}
          </div>

          <div className="input-group">
            <label htmlFor="lastName">Last Name</label>
            <input 
              type="text" 
              id="lastName" 
              name="lastName"
              placeholder="Enter your last name" 
              value={formData.lastName}
              onChange={handleInputChange}
              required 
            />
            {errors.lastName && <p className="error-message visible">{errors.lastName}</p>}
          </div>
          
          {/* Email input */}
          <div className="input-group">
            <label htmlFor="email">University Email</label>
            <input 
              type="email" 
              id="email" 
              name="email"
              placeholder="Enter your university email" 
              value={formData.email}
              onChange={handleInputChange}
              required 
            />
            {errors.email && <p className="error-message visible">{errors.email}</p>}
          </div>

          {/* Student ID input */}
          <div className="input-group">
            <label htmlFor="studentId">Student ID</label>
            <input 
              type="text" 
              id="studentId" 
              name="studentId"
              placeholder="e.g., STU12345" 
              value={formData.studentId}
              onChange={handleInputChange}
              maxLength="8"
              style={{ textTransform: 'uppercase' }}
              required 
            />
            {errors.studentId && <p className="error-message visible">{errors.studentId}</p>}
          </div>
          
          {/* Password input */}
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'}
                id="password" 
                name="password"
                placeholder="Create a strong password" 
                value={formData.password}
                onChange={handleInputChange}
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#666'
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && <p className="error-message visible">{errors.password}</p>}
          </div>

          {/* Confirm Password input */}
          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword" 
                name="confirmPassword"
                placeholder="Confirm your password" 
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required 
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#666'
                }}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.confirmPassword && <p className="error-message visible">{errors.confirmPassword}</p>}
          </div>
          
          {/* Submit button */}
          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
          
          {/* Login link */}
          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--color-medium-blue)', textDecoration: 'none' }}>Log in here</Link>
          </div>
          
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

export default Signup;