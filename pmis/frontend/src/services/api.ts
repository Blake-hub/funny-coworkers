const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088/api';

interface LoginData {
  email: string;
  password: string;
}

interface TokenResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  role: string;
  teamId: number;
  organizationId?: number;
  departmentId?: number;
}

interface AuthResponse {
  user: UserResponse;
  token: TokenResponse;
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {};
  
  if (options.body) {
    defaultHeaders['Content-Type'] = 'application/json';
  }
  
  let userHeaders: Record<string, string> = {};
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        userHeaders[key] = value;
      });
    } else {
      userHeaders = options.headers as Record<string, string>;
    }
  }
  
  const headers = {
    ...defaultHeaders,
    ...userHeaders,
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorMessage = null;
      try {
        const errorData = await response.json();
        if (errorData.message || errorData.error) {
          errorMessage = errorData.message || errorData.error;
        }
      } catch (e) {
      }
      
      const hasAuthHeader = !!Object.keys(headers).find(key => key.toLowerCase() === 'authorization');
      
      if (response.status === 400) {
        throw new Error(errorMessage || 'Invalid input data');
      } else if (response.status === 401) {
        throw new Error(errorMessage || 'Invalid credentials or token expired');
      } else if (response.status === 403) {
        throw new Error(errorMessage || 'Access denied: You don\'t have permission to perform this action');
      } else if (response.status === 409) {
        throw new Error(errorMessage || 'Resource already exists');
      }
      
      throw new Error(errorMessage || `API error: ${response.status} ${response.statusText}`);
    }

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

const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('pmis-token') || getCookie('pmis-token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const authApi = {
  login: async (credentials: LoginData): Promise<AuthResponse> => {
    return fetchApi<AuthResponse>('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
};

export const userApi = {
  getAllUsers: async (): Promise<UserResponse[]> => {
    return fetchApi<UserResponse[]>('/users', {
      headers: getAuthHeaders(),
    });
  },

  getUserById: async (id: number): Promise<UserResponse> => {
    return fetchApi<UserResponse>(`/users/${id}`, {
      headers: getAuthHeaders(),
    });
  },

  createUser: async (userData: { email: string; password: string; name: string; role: string; teamId: number }): Promise<UserResponse> => {
    return fetchApi<UserResponse>('/users', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
  },

  updateUser: async (id: number, userData: { email?: string; password?: string; name?: string; role?: string; teamId?: number }): Promise<UserResponse> => {
    return fetchApi<UserResponse>(`/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
  },

  deleteUser: async (id: number): Promise<void> => {
    return fetchApi<void>(`/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },
};

export interface TeamResponse {
  id: number;
  identifier: string;
  name: string;
  description: string;
  memberCount: number;
  leadName: string;
}

export const teamApi = {
  getAllTeams: async (): Promise<TeamResponse[]> => {
    return fetchApi<TeamResponse[]>('/teams', {
      headers: getAuthHeaders(),
    });
  },

  getTeamById: async (id: number): Promise<TeamResponse> => {
    return fetchApi<TeamResponse>(`/teams/${id}`, {
      headers: getAuthHeaders(),
    });
  },

  createTeam: async (teamData: { identifier: string; name: string; description: string; memberCount: number; leadName: string }): Promise<TeamResponse> => {
    return fetchApi<TeamResponse>('/teams', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(teamData),
    });
  },

  updateTeam: async (id: number, teamData: { identifier?: string; name?: string; description?: string; memberCount?: number; leadName?: string }): Promise<TeamResponse> => {
    return fetchApi<TeamResponse>(`/teams/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(teamData),
    });
  },

  deleteTeam: async (id: number): Promise<void> => {
    return fetchApi<void>(`/teams/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },
};

export interface ProjectResponse {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  leaderId: number;
}

export const projectApi = {
  getAllProjects: async (): Promise<ProjectResponse[]> => {
    return fetchApi<ProjectResponse[]>('/projects', {
      headers: getAuthHeaders(),
    });
  },

  getProjectById: async (id: number): Promise<ProjectResponse> => {
    return fetchApi<ProjectResponse>(`/projects/${id}`, {
      headers: getAuthHeaders(),
    });
  },

  createProject: async (projectData: { name: string; description: string; startDate: string; endDate: string; status: string; leaderId: number }): Promise<ProjectResponse> => {
    return fetchApi<ProjectResponse>('/projects', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData),
    });
  },

  updateProject: async (id: number, projectData: { name?: string; description?: string; startDate?: string; endDate?: string; status?: string; leaderId?: number }): Promise<ProjectResponse> => {
    return fetchApi<ProjectResponse>(`/projects/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData),
    });
  },

  deleteProject: async (id: number): Promise<void> => {
    return fetchApi<void>(`/projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },
};

export interface IssueResponse {
  id: number;
  type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assigneeId: number;
  projectId: number;
  parentId: number | null;
  rootId: number;
  labels: string[];
  storyPoints: number | null;
  severity: string | null;
  acceptanceCriteria: string | null;
}

export const issueApi = {
  getAllIssues: async (): Promise<IssueResponse[]> => {
    return fetchApi<IssueResponse[]>('/issues', {
      headers: getAuthHeaders(),
    });
  },

  getIssueById: async (id: number): Promise<IssueResponse> => {
    return fetchApi<IssueResponse>(`/issues/${id}`, {
      headers: getAuthHeaders(),
    });
  },

  createIssue: async (issueData: { type: string; title: string; description: string; status: string; priority: string; dueDate: string; assigneeId: number; projectId: number; parentId?: number; rootId: number; labels: string[]; storyPoints?: number; severity?: string; acceptanceCriteria?: string }): Promise<IssueResponse> => {
    return fetchApi<IssueResponse>('/issues', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(issueData),
    });
  },

  updateIssue: async (id: number, issueData: { type?: string; title?: string; description?: string; status?: string; priority?: string; dueDate?: string; assigneeId?: number; projectId?: number; parentId?: number; rootId?: number; labels?: string[]; storyPoints?: number; severity?: string; acceptanceCriteria?: string }): Promise<IssueResponse> => {
    return fetchApi<IssueResponse>(`/issues/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(issueData),
    });
  },

  deleteIssue: async (id: number): Promise<void> => {
    return fetchApi<void>(`/issues/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },
};

export interface OrganizationResponse {
  id: number;
  name: string;
  description: string;
  website: string;
  logoUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentResponse {
  id: number;
  organizationId: number;
  name: string;
  description: string;
  parentDepartmentId: number | null;
  parentDepartmentName: string | null;
  leadUserId: number | null;
  leadUserName: string | null;
  createdAt: string;
  updatedAt: string;
}

export const organizationApi = {
  getOrganization: async (id: number): Promise<OrganizationResponse> => {
    return fetchApi<OrganizationResponse>(`/organizations/${id}`, {
      headers: getAuthHeaders(),
    });
  },

  updateOrganization: async (id: number, orgData: { name?: string; description?: string; website?: string; logoUrl?: string }): Promise<OrganizationResponse> => {
    return fetchApi<OrganizationResponse>(`/organizations/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(orgData),
    });
  },

  getDepartments: async (organizationId: number): Promise<DepartmentResponse[]> => {
    return fetchApi<DepartmentResponse[]>(`/organizations/${organizationId}/departments`, {
      headers: getAuthHeaders(),
    });
  },

  createDepartment: async (organizationId: number, departmentData: { name: string; description: string; parentDepartmentId?: number; leadUserId?: number }): Promise<DepartmentResponse> => {
    return fetchApi<DepartmentResponse>(`/organizations/${organizationId}/departments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(departmentData),
    });
  },

  updateDepartment: async (id: number, departmentData: { name?: string; description?: string; parentDepartmentId?: number; leadUserId?: number }): Promise<DepartmentResponse> => {
    return fetchApi<DepartmentResponse>(`/organizations/departments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(departmentData),
    });
  },

  deleteDepartment: async (id: number): Promise<void> => {
    return fetchApi<void>(`/organizations/departments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  getEmployees: async (organizationId: number): Promise<UserResponse[]> => {
    return fetchApi<UserResponse[]>(`/organizations/${organizationId}/employees`, {
      headers: getAuthHeaders(),
    });
  },
};

export { API_BASE_URL };