// API service with centralized configuration

const API_BASE_URL = 'http://localhost:8081';

interface RegisterData {
  username: string;
  password: string;
  email: string;
}

interface LoginData {
  username: string;
  password: string;
}

interface AuthResponse {
  token: string;
  username: string;
}

// Generic fetch function with error handling
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Try to get error details from response
      try {
        const errorData = await response.json();
        if (errorData.message) {
          throw new Error(errorData.message);
        }
      } catch (e) {
        // If no JSON error data, use status text
      }
      
      // Handle specific HTTP status codes
      if (response.status === 400) {
        throw new Error('Invalid input data');
      } else if (response.status === 401) {
        throw new Error('Invalid credentials');
      } else if (response.status === 409) {
        throw new Error('Username or email already exists');
      }
      
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Auth-related API calls
export const authApi = {
  // Register a new user
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    return fetchApi<AuthResponse>('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Login user
  login: async (credentials: LoginData): Promise<AuthResponse> => {
    return fetchApi<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
};

// Example: Add more API services as needed
export const userApi = {
  // Get user profile
  getProfile: async (): Promise<any> => {
    return fetchApi<any>('/profile', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },
};

// Export base URL for reference
export { API_BASE_URL };
