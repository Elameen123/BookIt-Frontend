import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

// Auth Components
import Login from '../src/pages/auth/Login';
import Signup from '../src/pages/auth/SignUp';
import ForgotPassword from '../src/pages/auth/ForgotPassword';

// Dashboard Components
import UserDashboard from '../src/pages/dashboards/UserDashboard';
import AdminDashboard from '../src/pages/dashboards/AdminDashboard';
import FacilityDashboard from '../src/pages/dashboards/FacilityDashboard';

// Loading Component
import LoadingSpinner from '../src/components/common/LoadingSpinner';

/**
 * ProtectedRoute Component
 * 
 * Wrapper component that protects routes based on authentication and role
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {Array} props.allowedRoles - Array of roles allowed to access this route
 * @param {string} props.redirectTo - Path to redirect unauthorized users
 */
const ProtectedRoute = ({ children, allowedRoles = [], redirectTo = '/login' }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    const userDashboard = getUserDashboardPath(currentUser.role);
    return <Navigate to={userDashboard} replace />;
  }

  return children;
};

/**
 * PublicRoute Component
 * 
 * Wrapper component that redirects authenticated users away from auth pages
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if not authenticated
 */
const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (currentUser) {
    const userDashboard = getUserDashboardPath(currentUser.role);
    return <Navigate to={userDashboard} replace />;
  }

  return children;
};

/**
 * Get dashboard path based on user role
 * @param {string} role - User role
 * @returns {string} - Dashboard path
 */
const getUserDashboardPath = (role) => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'facility':
      return '/facility/dashboard';
    case 'student':
    case 'faculty':
    default:
      return '/dashboard';
  }
};

/**
 * Main App Component
 * 
 * Sets up routing for the entire application with authentication and role-based access
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public Routes - Redirect authenticated users */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              } 
            />
            <Route 
              path="/forgot-password" 
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              } 
            />

            {/* Protected Routes - Require Authentication */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['student', 'faculty']}>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/facility/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['facility']}>
                  <FacilityDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Root Route - Redirect based on authentication status */}
            <Route 
              path="/" 
              element={<RootRedirect />}
            />

            {/* Catch-all Route - 404 or redirect to appropriate dashboard */}
            <Route 
              path="*" 
              element={<NotFoundRedirect />}
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

/**
 * RootRedirect Component
 * 
 * Handles redirection for the root path based on authentication status
 */
const RootRedirect = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (currentUser) {
    const userDashboard = getUserDashboardPath(currentUser.role);
    return <Navigate to={userDashboard} replace />;
  }

  return <Navigate to="/login" replace />;
};

/**
 * NotFoundRedirect Component
 * 
 * Handles 404 errors by redirecting to appropriate page based on auth status
 */
const NotFoundRedirect = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (currentUser) {
    const userDashboard = getUserDashboardPath(currentUser.role);
    return <Navigate to={userDashboard} replace />;
  }

  return <Navigate to="/login" replace />;
};

export default App;
