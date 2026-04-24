export interface Issue {
  id: string;
  title: string;
  type: 'task' | 'user_story' | 'requirement' | 'bug';
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  assigneeId: string;
  projectId: string;
  parentId?: string;
  rootId: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  progress: number;
  leaderId: string;
  leaderName: string;
  issueCount: number;
  openIssues: number;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  leadName: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const mockIssues: Issue[] = [
  {
    id: '1',
    title: 'Fix login bug',
    type: 'bug',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2026-04-24',
    assigneeId: '1',
    projectId: '1',
    rootId: '1',
  },
  {
    id: '2',
    title: 'Review API design document',
    type: 'task',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-04-25',
    assigneeId: '1',
    projectId: '1',
    rootId: '2',
  },
  {
    id: '3',
    title: 'Implement payment flow',
    type: 'user_story',
    status: 'backlog',
    priority: 'high',
    dueDate: '2026-04-30',
    assigneeId: '1',
    projectId: '2',
    rootId: '3',
  },
  {
    id: '4',
    title: 'Create database schema',
    type: 'requirement',
    status: 'approved',
    priority: 'critical',
    dueDate: '2026-04-22',
    assigneeId: '1',
    projectId: '1',
    rootId: '4',
  },
];

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Redesign the company website',
    progress: 85,
    leaderId: '1',
    leaderName: 'John Doe',
    issueCount: 12,
    openIssues: 3,
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Develop native mobile applications',
    progress: 60,
    leaderId: '2',
    leaderName: 'Sarah Smith',
    issueCount: 20,
    openIssues: 5,
  },
  {
    id: '3',
    name: 'API Gateway',
    description: 'Build RESTful API gateway',
    progress: 90,
    leaderId: '1',
    leaderName: 'John Doe',
    issueCount: 8,
    openIssues: 1,
  },
];

export const mockTeams: Team[] = [
  {
    id: '1',
    name: 'Engineering Team',
    description: 'Core development team',
    memberCount: 12,
    leadName: 'Mike Johnson',
  },
  {
    id: '2',
    name: 'QA Team',
    description: 'Quality assurance team',
    memberCount: 5,
    leadName: 'Lisa Anderson',
  },
  {
    id: '3',
    name: 'Product Team',
    description: 'Product management team',
    memberCount: 4,
    leadName: 'Emily Davis',
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
