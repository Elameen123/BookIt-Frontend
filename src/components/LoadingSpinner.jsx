import React from 'react';
import './LoadingSpinner.css';

/**
 * LoadingSpinner Component
 * 
 * A reusable loading spinner component that can be used throughout the application
 * Provides consistent loading UI with the app's design system
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner ('small', 'medium', 'large')
 * @param {string} props.message - Optional loading message to display
 * @param {boolean} props.overlay - Whether to show as full-screen overlay
 * @param {string} props.color - Custom color for the spinner
 */
const LoadingSpinner = ({ 
  size = 'medium', 
  message = 'Loading...', 
  overlay = false,
  color = 'var(--color-medium-blue)'
}) => {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  };

  const spinnerClass = sizeClasses[size] || sizeClasses.medium;

  const content = (
    <div className="loading-container">
      <div 
        className={`loading-spinner ${spinnerClass}`}
        style={{ borderTopColor: color }}
      ></div>
      {message && (
        <p className="loading-message">{message}</p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-overlay">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;