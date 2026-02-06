// API service with centralized configuration

// Use relative URL for API requests
const API_BASE_URL = process.env.NODE_ENV === 'test' ? 'http://localhost:8081' : 'http://10.0.24.110:8081';

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
  userId?: number;
}

// Generic fetch function with error handling
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config: RequestInit = {
    ...options,
    headers: defaultHeaders,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = null;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // If no JSON error data, use status text
      }
      
      // Check if this request has an Authorization header (not login/register)
      const hasAuthHeader = config.headers && (config.headers as any)['Authorization'];
      
      // Handle specific HTTP status codes
      if (response.status === 400) {
        throw new Error(errorMessage || 'Invalid input data');
      } else if (response.status === 401) {
        // Only redirect if this is not a login/register request
        if (hasAuthHeader) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          window.location.href = '/login';
        }
        throw new Error(errorMessage || 'Invalid credentials');
      } else if (response.status === 409) {
        throw new Error(errorMessage || 'Username or email already exists');
      }
      
      throw new Error(errorMessage || `API error: ${response.status} ${response.statusText}`);
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

// Team-related API calls
export const teamApi = {
  // Get all teams
  getAllTeams: async (): Promise<any[]> => {
    return fetchApi<any[]>('/api/teams', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },

  // Create a new team
  createTeam: async (teamData: { name: string; ownerId: number }): Promise<any> => {
    return fetchApi<any>('/api/teams', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(teamData),
    });
  },

  // Delete a team
  deleteTeam: async (teamId: number): Promise<void> => {
    return fetchApi<void>(`/api/teams/${teamId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },

  // Update a team
  updateTeam: async (teamId: number, teamData: any): Promise<any> => {
    return fetchApi<any>(`/api/teams/${teamId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(teamData),
    });
  },
};

// Export base URL for reference
export { API_BASE_URL };
