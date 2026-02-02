import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterForm from './RegisterForm';
import * as authApiModule from '../../services/api';

// Mock the authApi
const mockRegister = jest.spyOn(authApiModule.authApi, 'register');
// Mock window.location.href
delete window.location;
window.location = { href: '' };

jest.mock('../../services/api', () => ({
  authApi: {
    register: jest.fn(),
  },
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    mockRegister.mockClear();
    window.location.href = '';
  });

  it('should render the form correctly', () => {
    render(<RegisterForm />);
    
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('should submit the form successfully', async () => {
    mockRegister.mockResolvedValue({ token: 'testToken', username: 'testuser' });
    
    render(<RegisterForm />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByText('Register'));
    
    // Wait for loading state
    expect(await screen.findByText('Registering...')).toBeInTheDocument();
    
    // Wait for success message
    expect(await screen.findByText('Registration Successful!')).toBeInTheDocument();
    expect(screen.getByText('Your account has been created successfully.')).toBeInTheDocument();
    expect(screen.getByText('Redirecting to login page...')).toBeInTheDocument();
    
    // Verify API call
    expect(mockRegister).toHaveBeenCalledWith({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should show error for duplicate username', async () => {
    mockRegister.mockRejectedValue(new Error('Username already exists'));
    
    render(<RegisterForm />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'existinguser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByText('Register'));
    
    // Wait for error message
    expect(await screen.findByText('Username already exists')).toBeInTheDocument();
  });

  it('should show error for duplicate email', async () => {
    mockRegister.mockRejectedValue(new Error('Email already exists'));
    
    render(<RegisterForm />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByText('Register'));
    
    // Wait for error message
    expect(await screen.findByText('Email already exists')).toBeInTheDocument();
  });

  it('should show generic error for other failures', async () => {
    mockRegister.mockRejectedValue(new Error('Registration failed'));
    
    render(<RegisterForm />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByText('Register'));
    
    // Wait for error message
    expect(await screen.findByText('Registration failed')).toBeInTheDocument();
  });
});
