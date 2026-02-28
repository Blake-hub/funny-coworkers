import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginForm from './LoginForm';
import * as authApiModule from '../../services/api';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
}));

// Mock the authApi
const mockLogin = jest.spyOn(authApiModule.authApi, 'login');

// Mock localStorage
const mockLocalStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

jest.mock('../../services/api', () => ({
  authApi: {
    login: jest.fn(),
  },
}));

describe('LoginForm', () => {
  beforeEach(() => {
    mockLogin.mockClear();
    window.location.href = '';
    mockLocalStorage.setItem.mockClear();
  });

  it('should render the form correctly', () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText('auth.login.username')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.login.password')).toBeInTheDocument();
    expect(screen.getByText('auth.login.signIn')).toBeInTheDocument();
  });

  it('should submit the form successfully', async () => {
    mockLogin.mockResolvedValue({ token: 'testToken', username: 'testuser' });
    
    render(<LoginForm />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText('auth.login.username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('auth.login.password'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByText('auth.login.signIn'));
    
    // Wait for loading state
    expect(await screen.findByText('auth.login.signingIn')).toBeInTheDocument();
    
    // Wait for token to be stored in localStorage
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'testToken');
    });
    
    // Verify API call
    expect(mockLogin).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123',
    });
  });

  it('should show error for invalid credentials', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid username or password'));
    
    render(<LoginForm />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText('auth.login.username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('auth.login.password'), { target: { value: 'wrongpassword' } });
    
    // Submit form
    fireEvent.click(screen.getByText('auth.login.signIn'));
    
    // Wait for error message
    expect(await screen.findByText('Invalid username or password')).toBeInTheDocument();
  });

  it('should show generic error for other failures', async () => {
    mockLogin.mockRejectedValue(new Error('Login failed'));
    
    render(<LoginForm />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText('auth.login.username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('auth.login.password'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByText('auth.login.signIn'));
    
    // Wait for error message
    expect(await screen.findByText('Login failed')).toBeInTheDocument();
  });

  it('should handle non-Error exceptions', async () => {
    // Mock with a non-Error object
    mockLogin.mockRejectedValue('Non-error rejection');
    
    render(<LoginForm />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText('auth.login.username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('auth.login.password'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByText('auth.login.signIn'));
    
    // Wait for error message (should use the generic error message)
    expect(await screen.findByText('auth.login.invalidCredentials')).toBeInTheDocument();
  });

  it('should store userId in localStorage when provided', async () => {
    // Mock with userId
    mockLogin.mockResolvedValue({ token: 'testToken', username: 'testuser', userId: 123 });
    
    render(<LoginForm />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText('auth.login.username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('auth.login.password'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByText('auth.login.signIn'));
    
    // Wait for token to be stored in localStorage
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'testToken');
      expect(localStorage.setItem).toHaveBeenCalledWith('username', 'testuser');
      expect(localStorage.setItem).toHaveBeenCalledWith('userId', '123');
    });
  });

  it('should have remember me checkbox', () => {
    render(<LoginForm />);
    
    const checkbox = screen.getByLabelText('auth.login.rememberMe');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
    
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('should have forgot password link', () => {
    render(<LoginForm />);
    
    const forgotPasswordLink = screen.getByText('auth.login.forgotPassword');
    expect(forgotPasswordLink).toBeInTheDocument();
  });

  it('should have register link', () => {
    render(<LoginForm />);
    
    const registerLink = screen.getByText('auth.login.register');
    expect(registerLink).toBeInTheDocument();
  });
});
