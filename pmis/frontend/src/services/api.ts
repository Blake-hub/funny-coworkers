const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

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

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = new Promise(async (resolve) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const newToken = data.token?.token;
        if (newToken) {
          localStorage.setItem('pmis-token', newToken);
          setCookie('pmis-token', newToken);
          resolve(newToken);
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      resolve(null);
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  });

  return refreshPromise;
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}, token?: string, retryCount: number = 0): Promise<T> {
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
    } else {
      console.warn('No auth token found in cookies or localStorage');
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
    credentials: 'include',
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
        if (retryCount < 1) {
          const newToken = await refreshToken();
          if (newToken) {
            return fetchApi<T>(endpoint, options, newToken, retryCount + 1);
          }
        }
        throw new Error(errorMessage || 'Invalid credentials');
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
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') ||
          error.message.includes('ERR_CONNECTION') ||
          error.message.includes('ETIMEDOUT')) {
        throw new Error('Could not connect to server. Please check if the backend server is running.');
      }
    }
    throw error;
  }
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return getCookie('pmis-token') || localStorage.getItem('pmis-token');
}

function setCookie(name: string, value: string, days: number = 1) {
  if (typeof window === 'undefined') return;

  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
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

export interface MilestoneResponse {
  id: number;
  projectId: number;
  name: string;
  description: string;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LabelResponse {
  id: number;
  name: string;
  color: string;
  description: string;
  createdAt: string;
}

export interface ProjectResponse {
  id: number;
  name: string;
  summary: string;
  description: string;
  status: number;
  statusLabel: string;
  priority: number;
  priorityLabel: string;
  leaderId: number;
  leaderName: string;
  startDate: string | null;
  endDate: string | null;
  progress: number;
  memberCount: number;
  issueCount: number;
  openIssues: number;
  labels: LabelResponse[];
  milestones: MilestoneResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  summary: string;
  description: string;
  status: number;
  priority: number;
  leaderId: number;
  memberIds?: number[];
  startDate?: string;
  endDate?: string;
  labels?: Array<{ id?: number; name?: string; color?: string }>;
  milestones?: Array<{ name: string; description?: string; dueDate?: string }>;
}

export const projectApi = {
  getAllProjects: async (): Promise<ProjectResponse[]> => {
    return fetchApi<ProjectResponse[]>('/projects');
  },

  getProjectById: async (id: number): Promise<ProjectResponse> => {
    return fetchApi<ProjectResponse>(`/projects/${id}`);
  },

  createProject: async (projectData: CreateProjectRequest): Promise<ProjectResponse> => {
    return fetchApi<ProjectResponse>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  updateProject: async (id: number, projectData: { name?: string; summary?: string; description?: string; status?: number; priority?: number; leaderId?: number; startDate?: string; endDate?: string; progress?: number }): Promise<ProjectResponse> => {
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

  addMember: async (projectId: number, userId: number): Promise<void> => {
    return fetchApi<void>(`/projects/${projectId}/members?userId=${userId}`, {
      method: 'POST',
    });
  },

  removeMember: async (projectId: number, userId: number): Promise<void> => {
    return fetchApi<void>(`/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    });
  },

  assignLabel: async (projectId: number, labelId: number): Promise<void> => {
    return fetchApi<void>(`/projects/${projectId}/labels/${labelId}`, {
      method: 'POST',
    });
  },

  removeLabel: async (projectId: number, labelId: number): Promise<void> => {
    return fetchApi<void>(`/projects/${projectId}/labels/${labelId}`, {
      method: 'DELETE',
    });
  },

  updateLabels: async (projectId: number, labelIds: number[]): Promise<void> => {
    return fetchApi<void>(`/projects/${projectId}/labels`, {
      method: 'PUT',
      body: JSON.stringify({ labelIds }),
    });
  },
};

export const milestoneApi = {
  getMilestones: async (projectId: number): Promise<MilestoneResponse[]> => {
    return fetchApi<MilestoneResponse[]>(`/projects/${projectId}/milestones`);
  },

  getMilestoneById: async (projectId: number, milestoneId: number): Promise<MilestoneResponse> => {
    return fetchApi<MilestoneResponse>(`/projects/${projectId}/milestones/${milestoneId}`);
  },

  createMilestone: async (projectId: number, milestoneData: { name: string; description?: string; dueDate?: string }): Promise<MilestoneResponse> => {
    return fetchApi<MilestoneResponse>(`/projects/${projectId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(milestoneData),
    });
  },

  updateMilestone: async (projectId: number, milestoneId: number, milestoneData: { name: string; description?: string; dueDate?: string }): Promise<MilestoneResponse> => {
    return fetchApi<MilestoneResponse>(`/projects/${projectId}/milestones/${milestoneId}`, {
      method: 'PUT',
      body: JSON.stringify(milestoneData),
    });
  },

  deleteMilestone: async (projectId: number, milestoneId: number): Promise<void> => {
    return fetchApi<void>(`/projects/${projectId}/milestones/${milestoneId}`, {
      method: 'DELETE',
    });
  },

  completeMilestone: async (projectId: number, milestoneId: number): Promise<MilestoneResponse> => {
    return fetchApi<MilestoneResponse>(`/projects/${projectId}/milestones/${milestoneId}/complete`, {
      method: 'PUT',
    });
  },
};

export const labelApi = {
  getAllLabels: async (): Promise<LabelResponse[]> => {
    return fetchApi<LabelResponse[]>('/labels');
  },

  getLabelById: async (id: number): Promise<LabelResponse> => {
    return fetchApi<LabelResponse>(`/labels/${id}`);
  },

  createLabel: async (labelData: { name: string; color?: string; description?: string }): Promise<LabelResponse> => {
    return fetchApi<LabelResponse>('/labels', {
      method: 'POST',
      body: JSON.stringify(labelData),
    });
  },

  updateLabel: async (id: number, labelData: { name: string; color?: string; description?: string }): Promise<LabelResponse> => {
    return fetchApi<LabelResponse>(`/labels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(labelData),
    });
  },

  deleteLabel: async (id: number): Promise<void> => {
    return fetchApi<void>(`/labels/${id}`, {
      method: 'DELETE',
    });
  },

  assignLabelToProject: async (projectId: number, labelId: number): Promise<void> => {
    return fetchApi<void>(`/labels/${labelId}/projects/${projectId}`, {
      method: 'POST',
    });
  },

  removeLabelFromProject: async (projectId: number, labelId: number): Promise<void> => {
    return fetchApi<void>(`/labels/${labelId}/projects/${projectId}`, {
      method: 'DELETE',
    });
  },
};

export interface IssueResponse {
  id: number;
  projectId: number | null;
  title: string;
  description: string | null;
  statusId: number;
  sortOrder: number;
  assigneeId: number | null;
  assigneeName: string | null;
  reporterId: number | null;
  reporterName: string | null;
  priorityId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface IssueStatusResponse {
  id: number;
  name: string;
  color: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CreateIssueRequest {
  projectId?: number;
  title: string;
  description?: string;
  statusId?: number;
  assigneeId?: number;
  reporterId?: number;
  priorityId?: number;
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  statusId?: number;
  assigneeId?: number;
  priorityId?: number;
}

export const issueApi = {
  getAllIssues: async (projectId?: number): Promise<IssueResponse[]> => {
    const endpoint = projectId ? `/issues?projectId=${projectId}` : '/issues';
    return fetchApi<IssueResponse[]>(endpoint);
  },

  getIssueById: async (id: number): Promise<IssueResponse> => {
    return fetchApi<IssueResponse>(`/issues/${id}`);
  },

  createIssue: async (issueData: CreateIssueRequest): Promise<IssueResponse> => {
    return fetchApi<IssueResponse>('/issues', {
      method: 'POST',
      body: JSON.stringify(issueData),
    });
  },

  updateIssue: async (id: number, issueData: UpdateIssueRequest): Promise<IssueResponse> => {
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

  updateIssueStatus: async (id: number, statusId: number, sortOrder?: number): Promise<IssueResponse> => {
    const requestBody: { statusId: number; sortOrder?: number } = { statusId };
    if (sortOrder !== undefined) {
      requestBody.sortOrder = sortOrder;
    }
    return fetchApi<IssueResponse>(`/issues/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });
  },

  updateIssueSortOrder: async (id: number, sortOrder: number): Promise<IssueResponse> => {
    return fetchApi<IssueResponse>(`/issues/${id}/order`, {
      method: 'PUT',
      body: JSON.stringify({ sortOrder }),
    });
  },
};

export const issueStatusApi = {
  getAllStatuses: async (): Promise<IssueStatusResponse[]> => {
    return fetchApi<IssueStatusResponse[]>('/issue-statuses');
  },

  getActiveStatuses: async (): Promise<IssueStatusResponse[]> => {
    return fetchApi<IssueStatusResponse[]>('/issue-statuses/active');
  },

  createStatus: async (statusData: { name: string; color?: string; displayOrder?: number; isActive?: boolean }): Promise<IssueStatusResponse> => {
    return fetchApi<IssueStatusResponse>('/issue-statuses', {
      method: 'POST',
      body: JSON.stringify(statusData),
    });
  },

  updateStatus: async (id: number, statusData: { name?: string; color?: string; displayOrder?: number; isActive?: boolean }): Promise<IssueStatusResponse> => {
    return fetchApi<IssueStatusResponse>(`/issue-statuses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  },

  deleteStatus: async (id: number): Promise<void> => {
    return fetchApi<void>(`/issue-statuses/${id}`, {
      method: 'DELETE',
    });
  },

  reorderStatuses: async (statusIds: number[]): Promise<void> => {
    return fetchApi<void>('/issue-statuses/order', {
      method: 'PUT',
      body: JSON.stringify({ statusIds }),
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