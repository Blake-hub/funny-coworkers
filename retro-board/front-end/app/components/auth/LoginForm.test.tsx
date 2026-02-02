import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from './LoginForm';
import * as authApiModule from '../../services/api';

// Mock the authApi
const mockLogin = jest.spyOn(authApiModule.authApi, 'login');
// Mock window.location.href
delete window.location;
window.location = { href: '' } as Location;
// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
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
    (localStorage.setItem as jest.Mock).mockClear();
  });

  it('should render the form correctly', () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('should submit the form successfully', async () => {
    mockLogin.mockResolvedValue({ token: 'testToken', username: 'testuser' });
    
    render(<LoginForm />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByText('Sign in'));
    
    // Wait for loading state
    expect(await screen.findByText('Signing in...')).toBeInTheDocument();
    
    // Wait for redirect (simulated by checking localStorage and location.href)
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'testToken');
      expect(window.location.href).toBe('/dashboard');
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
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } });
    
    // Submit form
    fireEvent.click(screen.getByText('Sign in'));
    
    // Wait for error message
    expect(await screen.findByText('Invalid username or password')).toBeInTheDocument();
  });

  it('should show generic error for other failures', async () => {
    mockLogin.mockRejectedValue(new Error('Login failed'));
    
    render(<LoginForm />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByText('Sign in'));
    
    // Wait for error message
    expect(await screen.findByText('Login failed')).toBeInTheDocument();
  });

  it('should have remember me checkbox', () => {
    render(<LoginForm />);
    
    const checkbox = screen.getByLabelText('Remember me');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
    
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('should have forgot password link', () => {
    render(<LoginForm />);
    
    const forgotPasswordLink = screen.getByText('Forgot password?');
    expect(forgotPasswordLink).toBeInTheDocument();
  });

  it('should have register link', () => {
    render(<LoginForm />);
    
    const registerLink = screen.getByText('Register');
    expect(registerLink).toBeInTheDocument();
  });
});
