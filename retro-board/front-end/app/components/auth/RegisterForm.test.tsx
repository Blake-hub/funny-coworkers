import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegisterForm from './RegisterForm';
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

// Mock the authApi
const mockRegister = jest.spyOn(authApiModule.authApi, 'register');

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
    
    expect(screen.getByLabelText('auth.register.username')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.register.email')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.register.password')).toBeInTheDocument();
    expect(screen.getByText('auth.register.register')).toBeInTheDocument();
  });

  it('should submit the form successfully', async () => {
    mockRegister.mockResolvedValue({ token: 'testToken', username: 'testuser' });
    
    render(<RegisterForm />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText('auth.register.username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('auth.register.email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('auth.register.password'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByText('auth.register.register'));
    
    // Wait for success message
    expect(await screen.findByText('auth.register.successTitle')).toBeInTheDocument();
    expect(screen.getByText('auth.register.successMessage')).toBeInTheDocument();
    expect(screen.getByText('auth.register.redirecting')).toBeInTheDocument();
    
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
    fireEvent.change(screen.getByLabelText('auth.register.username'), { target: { value: 'existinguser' } });
    fireEvent.change(screen.getByLabelText('auth.register.email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('auth.register.password'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByText('auth.register.register'));
    
    // Wait for error message
    expect(await screen.findByText('Username already exists')).toBeInTheDocument();
  });

  it('should show error for duplicate email', async () => {
    mockRegister.mockRejectedValue(new Error('Email already exists'));
    
    render(<RegisterForm />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText('auth.register.username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('auth.register.email'), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByLabelText('auth.register.password'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByText('auth.register.register'));
    
    // Wait for error message
    expect(await screen.findByText('Email already exists')).toBeInTheDocument();
  });

  it('should show generic error for other failures', async () => {
    mockRegister.mockRejectedValue(new Error('Registration failed'));
    
    render(<RegisterForm />);
    
    // Fill in form
    fireEvent.change(screen.getByLabelText('auth.register.username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('auth.register.email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('auth.register.password'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByText('auth.register.register'));
    
    // Wait for error message
    expect(await screen.findByText('Registration failed')).toBeInTheDocument();
  });
});
