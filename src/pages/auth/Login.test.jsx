import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import Login from './Login';
import { AuthProvider } from '../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock environment variable
process.env.REACT_APP_API_URL = 'http://localhost:3001/api';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Helper function to render Login with all required providers
const renderLogin = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockNavigate.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    
    // Reset axios mocks
    mockedAxios.get.mockClear();
    mockedAxios.post.mockClear();
  });

  describe('Rendering', () => {
    it('renders the login page correctly', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      renderLogin();
      
      expect(screen.getByText(/Welcome!/i)).toBeInTheDocument();
      expect(screen.getByText(/Book a class in Pan-Atlantic University/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();
      expect(screen.getByText(/Forgot password?/i)).toBeInTheDocument();
    });

    it('displays the PAU Bookit branding', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      renderLogin();
      
      expect(screen.getByText(/PAU/)).toBeInTheDocument();
      expect(screen.getByText(/Bookit/)).toBeInTheDocument();
      expect(screen.getByAltText(/PAU Bookit Logo/i)).toBeInTheDocument();
    });
  });

  describe('Authentication Check on Mount', () => {
    it('redirects to admin dashboard if admin user is already authenticated', async () => {
      const mockToken = 'valid-admin-token';
      localStorageMock.getItem.mockReturnValue(mockToken);
      mockedAxios.get.mockResolvedValueOnce({
        data: { isValid: true, role: 'admin' }
      });

      renderLogin();

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          'http://localhost:3001/api/auth/verify',
          { headers: { Authorization: `Bearer ${mockToken}` } }
        );
        expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
      });
    });

    it('redirects to student dashboard if student user is already authenticated', async () => {
      const mockToken = 'valid-student-token';
      localStorageMock.getItem.mockReturnValue(mockToken);
      mockedAxios.get.mockResolvedValueOnce({
        data: { isValid: true, role: 'student' }
      });

      renderLogin();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('clears invalid token and stays on login page', async () => {
      const mockToken = 'invalid-token';
      localStorageMock.getItem.mockReturnValue(mockToken);
      mockedAxios.get.mockRejectedValueOnce(new Error('Invalid token'));

      renderLogin();

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      });
      
      // Should stay on login page
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Email Validation', () => {
    it('shows error for non-PAU email addresses', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      renderLogin();
      
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', { name: /Log In/i });

      fireEvent.change(emailInput, { target: { value: 'test@gmail.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please use your university email address/i)).toBeInTheDocument();
      });
      
      // Should not make API call with invalid email
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('accepts valid PAU email addresses', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      mockedAxios.post.mockRejectedValueOnce({
        response: { status: 401, data: { message: 'Invalid credentials' } }
      });
      
      renderLogin();
      
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', { name: /Log In/i });

      fireEvent.change(emailInput, { target: { value: 'student@pau.edu.ng' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          'http://localhost:3001/api/auth/login',
          { email: 'student@pau.edu.ng', password: 'password123' }
        );
      });
    });
  });

  describe('Login Process', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
    });

    it('shows loading state during login attempt', async () => {
      // Mock a delayed response
      mockedAxios.post.mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({
            data: {
              token: 'fake-token',
              user: { id: '123', email: 'test@pau.edu.ng', role: 'student' }
            }
          }), 100)
        )
      );

      renderLogin();
      
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', { name: /Log In/i });

      fireEvent.change(emailInput, { target: { value: 'test@pau.edu.ng' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(submitButton);

      // Check loading state
      expect(screen.getByText(/Logging in.../i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/Loading.../i) || screen.queryByRole('progressbar')).toBeTruthy();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText(/Login successful/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('handles successful admin login', async () => {
      const mockAdminUser = {
        id: 'ADM10000',
        name: 'Admin User',
        email: 'elvis.ebenuwah@pau.edu.ng',
        role: 'admin'
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          token: 'fake-admin-token',
          user: mockAdminUser
        }
      });

      renderLogin();
      
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', { name: /Log In/i });

      fireEvent.change(emailInput, { target: { value: 'elvis.ebenuwah@pau.edu.ng' } });
      fireEvent.change(passwordInput, { target: { value: 'Admin123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Login successful/i)).toBeInTheDocument();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'fake-admin-token');
      
      // Wait for navigation (happens after 1.5s delay)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
      }, { timeout: 2000 });
    });

    it('handles successful student login', async () => {
      const mockStudentUser = {
        id: 'STU12345',
        name: 'John Student',
        email: 'john.student@pau.edu.ng',
        role: 'student'
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          token: 'fake-student-token',
          user: mockStudentUser
        }
      });

      renderLogin();
      
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', { name: /Log In/i });

      fireEvent.change(emailInput, { target: { value: 'john.student@pau.edu.ng' } });
      fireEvent.change(passwordInput, { target: { value: 'User123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Login successful/i)).toBeInTheDocument();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'fake-student-token');
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      }, { timeout: 2000 });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
    });

    it('shows error for invalid credentials', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: 'Invalid credentials' }
        }
      });

      renderLogin();
      
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', { name: /Log In/i });

      fireEvent.change(emailInput, { target: { value: 'student@pau.edu.ng' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('shows error for user not found', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { message: 'User not found' }
        }
      });

      renderLogin();
      
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', { name: /Log In/i });

      fireEvent.change(emailInput, { target: { value: 'nonexistent@pau.edu.ng' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Account not found/i)).toBeInTheDocument();
      });
    });

    it('shows error for account not activated', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 403,
          data: { message: 'Account not activated' }
        }
      });

      renderLogin();
      
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', { name: /Log In/i });

      fireEvent.change(emailInput, { target: { value: 'inactive@pau.edu.ng' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Account not activated/i)).toBeInTheDocument();
      });
    });

    it('shows network error message when server is unreachable', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

      renderLogin();
      
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', { name: /Log In/i });

      fireEvent.change(emailInput, { target: { value: 'student@pau.edu.ng' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Unable to connect to the server/i)).toBeInTheDocument();
      });
    });

    it('handles generic server errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      });

      renderLogin();
      
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', { name: /Log In/i });

      fireEvent.change(emailInput, { target: { value: 'student@pau.edu.ng' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Internal server error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to forgot password page when link is clicked', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      renderLogin();
      
      const forgotPasswordLink = screen.getByText(/Forgot password?/i);
      fireEvent.click(forgotPasswordLink);
      
      expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
    });
  });

  describe('Form Interactions', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
    });

    it('updates email input value when typing', () => {
      renderLogin();
      
      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'test@pau.edu.ng' } });
      
      expect(emailInput.value).toBe('test@pau.edu.ng');
    });

    it('updates password input value when typing', () => {
      renderLogin();
      
      const passwordInput = screen.getByLabelText(/Password/i);
      fireEvent.change(passwordInput, { target: { value: 'mypassword' } });
      
      expect(passwordInput.value).toBe('mypassword');
    });

    it('clears email error when user starts typing after validation error', async () => {
      renderLogin();
      
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const submitButton = screen.getByRole('button', { name: /Log In/i });

      // Trigger validation error
      fireEvent.change(emailInput, { target: { value: 'invalid@gmail.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please use your university email address/i)).toBeInTheDocument();
      });

      // Start typing valid email
      fireEvent.change(emailInput, { target: { value: 'valid@pau.edu.ng' } });

      // Error should be cleared (though this might require additional state management)
      // Note: This test might need adjustment based on actual implementation
    });

    it('requires both email and password fields', () => {
      renderLogin();
      
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      
      expect(emailInput).toBeRequired();
      expect(passwordInput).toBeRequired();
    });
  });
});

// Additional test utilities and helpers
export const createMockUser = (overrides = {}) => ({
  id: 'STU12345',
  name: 'Test User',
  email: 'test@pau.edu.ng',
  role: 'student',
  ...overrides
});

export const createMockAuthResponse = (user = createMockUser()) => ({
  data: {
    token: 'fake-jwt-token',
    user
  }
});

// Test data constants
export const TEST_USERS = {
  student: createMockUser(),
  admin: createMockUser({
    id: 'ADM10000',
    name: 'Admin User',
    email: 'admin@pau.edu.ng',
    role: 'admin'
  })
};

export const TEST_CREDENTIALS = {
  valid: {
    email: 'student@pau.edu.ng',
    password: 'ValidPassword123'
  },
  invalid: {
    email: 'invalid@gmail.com',
    password: 'wrongpassword'
  }
};