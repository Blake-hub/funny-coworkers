// API service with centralized configuration

// Use relative URL for API requests
const API_BASE_URL = process.env.NODE_ENV === 'test' ? 'http://localhost:8081' : 'http://localhost:8081';

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
      } else if (response.status === 401 || response.status === 403) {
        // Only redirect if this is not a login/register request
        if (hasAuthHeader) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          window.location.href = '/login';
        }
        throw new Error(errorMessage || 'Invalid credentials or token expired');
      } else if (response.status === 409) {
        throw new Error(errorMessage || 'Username or email already exists');
      }
      
      throw new Error(errorMessage || `API error: ${response.status} ${response.statusText}`);
    }

    // Handle 204 No Content responses (no body)
    if (response.status === 204) {
      return {} as T;
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

// User-related API calls
export const userApi = {
  // Get user profile
  getProfile: async (): Promise<any> => {
    return fetchApi<any>('/profile', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },
  
  // Search users
  searchUsers: async (query: string): Promise<any[]> => {
    return fetchApi<any[]>(`/api/users/search?query=${encodeURIComponent(query)}`, {
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
  
  // Get a team by ID
  getTeamById: async (teamId: number): Promise<any> => {
    return fetchApi<any>(`/api/teams/${teamId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },
  
  // Get team members by team ID
  getTeamMembers: async (teamId: number): Promise<any[]> => {
    return fetchApi<any[]>(`/api/teams/${teamId}/members`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },
};

// Board-related API calls
export const boardApi = {
  // Get all boards for a team
  getAllBoards: async (teamId: number): Promise<any[]> => {
    return fetchApi<any[]>(`/api/boards/team/${teamId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },

  // Create a new board
  createBoard: async (boardData: { name: string; description: string; teamId: number }): Promise<any> => {
    return fetchApi<any>('/api/boards', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(boardData),
    });
  },

  // Delete a board
  deleteBoard: async (boardId: number): Promise<void> => {
    return fetchApi<void>(`/api/boards/${boardId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },

  // Update a board
  updateBoard: async (boardId: number, boardData: { name: string; description: string }): Promise<any> => {
    return fetchApi<any>(`/api/boards/${boardId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(boardData),
    });
  },
  
  // Get a board by ID
  getBoardById: async (boardId: number): Promise<any> => {
    return fetchApi<any>(`/api/boards/${boardId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },
};

// Column-related API calls
export const columnApi = {
  // Get all columns for a board
  getAllColumns: async (boardId: number): Promise<any[]> => {
    return fetchApi<any[]>(`/api/columns/board/${boardId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },

  // Create a new column
  createColumn: async (columnData: { name: string; boardId: number; position: number }): Promise<any> => {
    return fetchApi<any>('/api/columns', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(columnData),
    });
  },

  // Delete a column
  deleteColumn: async (columnId: number): Promise<void> => {
    return fetchApi<void>(`/api/columns/${columnId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },

  // Update a column
  updateColumn: async (columnId: number, columnData: { name: string; position: number }): Promise<any> => {
    return fetchApi<any>(`/api/columns/${columnId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(columnData),
    });
  },
  
  // Get a column by ID
  getColumnById: async (columnId: number): Promise<any> => {
    return fetchApi<any>(`/api/columns/${columnId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },
};

// Card-related API calls
export const cardApi = {
  // Get all cards for a column
  getAllCards: async (columnId: number): Promise<any[]> => {
    return fetchApi<any[]>(`/api/cards/column/${columnId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },

  // Create a new card
  createCard: async (cardData: { title: string; description: string; columnId: number; position: number }): Promise<any> => {
    return fetchApi<any>('/api/cards', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(cardData),
    });
  },

  // Delete a card
  deleteCard: async (cardId: number): Promise<void> => {
    return fetchApi<void>(`/api/cards/${cardId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },

  // Update a card
  updateCard: async (cardId: number, cardData: { title: string; description: string; columnId: number; position: number }): Promise<any> => {
    return fetchApi<any>(`/api/cards/${cardId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(cardData),
    });
  },
  
  // Get a card by ID
  getCardById: async (cardId: number): Promise<any> => {
    return fetchApi<any>(`/api/cards/${cardId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
  },
};

// Export base URL for reference
export { API_BASE_URL };
