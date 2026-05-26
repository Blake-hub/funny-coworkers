export interface Issue {
  id: number;
  title: string;
  type: 'task' | 'user_story' | 'requirement' | 'bug';
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  assigneeId: number;
  projectId: number;
  parentId: number | null;
  rootId: number;
  description: string;
  labels: string[];
  storyPoints: number | null;
  severity: string | null;
  acceptanceCriteria: string | null;
}

export interface Project {
  id: string;
  name: string;
  summary: string;
  description: string;
  progress: number;
  status: string;
  priority: string;
  leaderId: string;
  leaderName: string;
  memberIds: string[];
  startDate: string | null;
  endDate: string | null;
  labels: string[];
  milestones: string[];
  issueCount: number;
  openIssues: number;
}

export interface Team {
  id: string;
  identifier: string;
  name: string;
  description: string;
  memberCount: number;
  leadName: string;
  ownerName: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const mockIssues: Issue[] = [
  {
    id: 1,
    title: 'Fix login bug',
    type: 'bug',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2026-04-24',
    assigneeId: 1,
    projectId: 1,
    parentId: null,
    rootId: 1,
    description: 'Fix authentication bug in login page',
    labels: ['bug', 'auth'],
    storyPoints: 3,
    severity: 'high',
    acceptanceCriteria: 'Login should work with valid credentials',
  },
  {
    id: 2,
    title: 'Review API design document',
    type: 'task',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-04-25',
    assigneeId: 1,
    projectId: 1,
    parentId: null,
    rootId: 2,
    description: 'Review and approve API design',
    labels: ['review'],
    storyPoints: 2,
    severity: null,
    acceptanceCriteria: null,
  },
  {
    id: 3,
    title: 'Implement payment flow',
    type: 'user_story',
    status: 'backlog',
    priority: 'high',
    dueDate: '2026-04-30',
    assigneeId: 1,
    projectId: 2,
    parentId: null,
    rootId: 3,
    description: 'Implement payment processing flow',
    labels: ['feature', 'payment'],
    storyPoints: 8,
    severity: null,
    acceptanceCriteria: 'Payment should complete successfully',
  },
  {
    id: 4,
    title: 'Create database schema',
    type: 'requirement',
    status: 'approved',
    priority: 'critical',
    dueDate: '2026-04-22',
    assigneeId: 1,
    projectId: 1,
    parentId: null,
    rootId: 4,
    description: 'Design and create database schema',
    labels: ['database', 'architecture'],
    storyPoints: 5,
    severity: null,
    acceptanceCriteria: 'Schema should support all required entities',
  },
];

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'admin@pmis.com',
    role: 'Project Manager',
  },
  {
    id: '2',
    name: 'Sarah Smith',
    email: 'sarah@pmis.com',
    role: 'Senior Developer',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@pmis.com',
    role: 'Team Lead',
  },
  {
    id: '4',
    name: 'Lisa Anderson',
    email: 'lisa@pmis.com',
    role: 'QA Engineer',
  },
];

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    summary: 'Redesign the company website',
    description: 'Redesign the company website to improve user experience',
    progress: 85,
    status: 'in_progress',
    priority: 'high',
    leaderId: '1',
    leaderName: 'John Doe',
    memberIds: ['2', '3'],
    startDate: '2026-03-01',
    endDate: '2026-06-01',
    labels: ['web', 'design'],
    milestones: [],
    issueCount: 12,
    openIssues: 3,
  },
  {
    id: '2',
    name: 'Mobile App Development',
    summary: 'Develop native mobile applications',
    description: 'Develop native mobile applications for iOS and Android',
    progress: 60,
    status: 'in_progress',
    priority: 'medium',
    leaderId: '2',
    leaderName: 'Sarah Smith',
    memberIds: ['1', '4'],
    startDate: '2026-04-01',
    endDate: '2026-08-01',
    labels: ['mobile', 'native'],
    milestones: [],
    issueCount: 20,
    openIssues: 5,
  },
  {
    id: '3',
    name: 'API Gateway',
    summary: 'Build RESTful API gateway',
    description: 'Build RESTful API gateway to handle all API requests',
    progress: 90,
    status: 'in_progress',
    priority: 'critical',
    leaderId: '1',
    leaderName: 'John Doe',
    memberIds: ['3'],
    startDate: '2026-02-01',
    endDate: '2026-05-01',
    labels: ['api', 'infrastructure'],
    milestones: [],
    issueCount: 8,
    openIssues: 1,
  },
];

export const mockTeams: Team[] = [
  {
    id: '1',
    identifier: 'ENG',
    name: 'Engineering Team',
    description: 'Core development team',
    memberCount: 12,
    leadName: 'Mike Johnson',
    ownerName: 'Mike Johnson',
  },
  {
    id: '2',
    identifier: 'QA',
    name: 'QA Team',
    description: 'Quality assurance team',
    memberCount: 5,
    leadName: 'Lisa Anderson',
    ownerName: 'Lisa Anderson',
  },
  {
    id: '3',
    identifier: 'PROD',
    name: 'Product Team',
    description: 'Product management team',
    memberCount: 4,
    leadName: 'Emily Davis',
    ownerName: 'Emily Davis',
  },
];

export const currentUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'admin@pmis.com',
  role: 'Project Manager',
};

export const statusLabels: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In Progress',
  testing: 'Testing',
  done: 'Done',
  canceled: 'Canceled',
  duplicate: 'Duplicate',
  reported: 'Reported',
  triaged: 'Triaged',
  resolved: 'Resolved',
  draft: 'Draft',
  review: 'Review',
  approved: 'Approved',
  implemented: 'Implemented',
};

export const priorityLabels: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const typeLabels: Record<string, string> = {
  task: 'Task',
  user_story: 'User Story',
  requirement: 'Requirement',
  bug: 'Bug',
};

export const mockData = {
  mockIssues,
  mockProjects,
  mockTeams,
  currentUser,
};
