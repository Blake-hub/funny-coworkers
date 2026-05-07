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

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}, token?: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: Record<string, string> = {};

  if (options.body) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  } else {
    const authToken = getAuthToken();
    if (authToken) {
      defaultHeaders['Authorization'] = `Bearer ${authToken}`;
    }
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

function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return getCookie('pmis-token') || localStorage.getItem('pmis-token');
}

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

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
    return fetchApi<UserResponse[]>('/users');
  },

  getUserById: async (id: number): Promise<UserResponse> => {
    return fetchApi<UserResponse>(`/users/${id}`);
  },

  createUser: async (userData: { email: string; password: string; name: string; role: string; teamId: number }): Promise<UserResponse> => {
    return fetchApi<UserResponse>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  updateUser: async (id: number, userData: { email?: string; password?: string; name?: string; role?: string; teamId?: number }): Promise<UserResponse> => {
    return fetchApi<UserResponse>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  deleteUser: async (id: number): Promise<void> => {
    return fetchApi<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  changePassword: async (id: number, currentPassword: string, newPassword: string): Promise<void> => {
    return fetchApi<void>(`/users/${id}/change-password`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
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
    return fetchApi<TeamResponse[]>('/teams');
  },

  getTeamById: async (id: number): Promise<TeamResponse> => {
    return fetchApi<TeamResponse>(`/teams/${id}`);
  },

  createTeam: async (teamData: { identifier: string; name: string; description: string; memberCount: number; leadName: string }): Promise<TeamResponse> => {
    return fetchApi<TeamResponse>('/teams', {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  },

  updateTeam: async (id: number, teamData: { identifier?: string; name?: string; description?: string; memberCount?: number; leadName?: string }): Promise<TeamResponse> => {
    return fetchApi<TeamResponse>(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(teamData),
    });
  },

  deleteTeam: async (id: number): Promise<void> => {
    return fetchApi<void>(`/teams/${id}`, {
      method: 'DELETE',
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
    return fetchApi<ProjectResponse[]>('/projects');
  },

  getProjectById: async (id: number): Promise<ProjectResponse> => {
    return fetchApi<ProjectResponse>(`/projects/${id}`);
  },

  createProject: async (projectData: { name: string; description: string; startDate: string; endDate: string; status: string; leaderId: number }): Promise<ProjectResponse> => {
    return fetchApi<ProjectResponse>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  updateProject: async (id: number, projectData: { name?: string; description?: string; startDate?: string; endDate?: string; status?: string; leaderId?: number }): Promise<ProjectResponse> => {
    return fetchApi<ProjectResponse>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  },

  deleteProject: async (id: number): Promise<void> => {
    return fetchApi<void>(`/projects/${id}`, {
      method: 'DELETE',
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
    return fetchApi<IssueResponse[]>('/issues');
  },

  getIssueById: async (id: number): Promise<IssueResponse> => {
    return fetchApi<IssueResponse>(`/issues/${id}`);
  },

  createIssue: async (issueData: { type: string; title: string; description: string; status: string; priority: string; dueDate: string; assigneeId: number; projectId: number; parentId?: number; rootId: number; labels: string[]; storyPoints?: number; severity?: string; acceptanceCriteria?: string }): Promise<IssueResponse> => {
    return fetchApi<IssueResponse>('/issues', {
      method: 'POST',
      body: JSON.stringify(issueData),
    });
  },

  updateIssue: async (id: number, issueData: { type?: string; title?: string; description?: string; status?: string; priority?: string; dueDate?: string; assigneeId?: number; projectId?: number; parentId?: number; rootId?: number; labels?: string[]; storyPoints?: number; severity?: string; acceptanceCriteria?: string }): Promise<IssueResponse> => {
    return fetchApi<IssueResponse>(`/issues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(issueData),
    });
  },

  deleteIssue: async (id: number): Promise<void> => {
    return fetchApi<void>(`/issues/${id}`, {
      method: 'DELETE',
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
    return fetchApi<OrganizationResponse>(`/organizations/${id}`);
  },

  updateOrganization: async (id: number, orgData: { name?: string; description?: string; website?: string; logoUrl?: string }): Promise<OrganizationResponse> => {
    return fetchApi<OrganizationResponse>(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orgData),
    });
  },

  getDepartments: async (organizationId: number): Promise<DepartmentResponse[]> => {
    return fetchApi<DepartmentResponse[]>(`/organizations/${organizationId}/departments`);
  },

  createDepartment: async (organizationId: number, departmentData: { name: string; description: string; parentDepartmentId?: number; leadUserId?: number }): Promise<DepartmentResponse> => {
    return fetchApi<DepartmentResponse>(`/organizations/${organizationId}/departments`, {
      method: 'POST',
      body: JSON.stringify(departmentData),
    });
  },

  updateDepartment: async (id: number, departmentData: { name?: string; description?: string; parentDepartmentId?: number; leadUserId?: number }): Promise<DepartmentResponse> => {
    return fetchApi<DepartmentResponse>(`/organizations/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(departmentData),
    });
  },

  deleteDepartment: async (id: number): Promise<void> => {
    return fetchApi<void>(`/organizations/departments/${id}`, {
      method: 'DELETE',
    });
  },

  getEmployees: async (organizationId: number): Promise<UserResponse[]> => {
    return fetchApi<UserResponse[]>(`/organizations/${organizationId}/employees`);
  },
};

export { API_BASE_URL };
