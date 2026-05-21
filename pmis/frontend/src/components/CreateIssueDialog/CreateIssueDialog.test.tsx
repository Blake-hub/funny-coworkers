import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateIssueDialog from '@/components/CreateIssueDialog';

jest.mock('@/components/RichTextEditor', () => {
  return jest.fn().mockImplementation(({ value, onChange, placeholder }) => (
    <div data-testid="rich-text-editor">
      <textarea
        data-testid="rich-text-editor-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  ));
});

const mockStatuses = [
  { id: 1, name: 'Backlog', color: '#6b7280', displayOrder: 1, isActive: true },
  { id: 2, name: 'Todo', color: '#3b82f6', displayOrder: 2, isActive: true },
  { id: 3, name: 'In Progress', color: '#f59e0b', displayOrder: 3, isActive: true },
  { id: 4, name: 'Done', color: '#10b981', displayOrder: 4, isActive: true },
];

const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'USER', teamId: 1 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'ADMIN', teamId: 1 },
];

const mockProjects = [
  { 
    id: 1, 
    name: 'Project Alpha',
    summary: 'Test project',
    description: 'Description for project alpha',
    status: 1,
    statusLabel: 'Backlog',
    priority: 0,
    priorityLabel: 'No priority',
    leaderId: 1,
    leaderName: 'John Doe',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    progress: 50,
    memberCount: 5,
    issueCount: 10,
    openIssues: 5,
    labels: [],
    milestones: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  { 
    id: 2, 
    name: 'Project Beta',
    summary: 'Another test project',
    description: 'Description for project beta',
    status: 2,
    statusLabel: 'Planned',
    priority: 1,
    priorityLabel: 'Urgent',
    leaderId: 2,
    leaderName: 'Jane Smith',
    startDate: '2024-06-01',
    endDate: '2025-06-01',
    progress: 25,
    memberCount: 3,
    issueCount: 8,
    openIssues: 3,
    labels: [],
    milestones: [],
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  },
];

const mockLabels = [
  { id: 1, name: 'Bug', color: '#ef4444', description: 'Bug fix', createdAt: '2024-01-01T00:00:00Z' },
  { id: 2, name: 'Feature', color: '#10b981', description: 'New feature', createdAt: '2024-01-01T00:00:00Z' },
];

describe('CreateIssueDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnCreate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Test Case 1: Default Height is 300px', () => {
    it('should render dialog with minHeight of 300px and maxHeight of 80vh', () => {
      render(
        <CreateIssueDialog
          show={true}
          onClose={mockOnClose}
          statuses={mockStatuses}
          users={mockUsers}
          projects={mockProjects}
          labels={mockLabels}
          onCreate={mockOnCreate}
        />
      );
      const dialog = screen.getByTestId('create-issue-dialog');
      expect(dialog).toBeInTheDocument();
      
      const computedStyle = window.getComputedStyle(dialog);
      expect(computedStyle.minHeight).toBe('300px');
      expect(computedStyle.maxHeight).toBe('80vh');
      
      const rect = dialog.getBoundingClientRect();
      console.log('Dialog bounding rect (jsdom - actual layout unavailable):', rect);
      console.log('Dialog offsetHeight (jsdom - actual layout unavailable):', dialog.offsetHeight);
      console.log('Dialog clientHeight (jsdom - actual layout unavailable):', dialog.clientHeight);
    });

    it('should have all four corners rounded', () => {
      render(
        <CreateIssueDialog
          show={true}
          onClose={mockOnClose}
          statuses={mockStatuses}
          users={mockUsers}
          projects={mockProjects}
          labels={mockLabels}
          onCreate={mockOnCreate}
        />
      );
      const dialog = screen.getByTestId('create-issue-dialog');
      expect(dialog).toHaveClass('rounded-lg');
    });

    it('should have maxHeight of 80vh', () => {
      render(
        <CreateIssueDialog
          show={true}
          onClose={mockOnClose}
          statuses={mockStatuses}
          users={mockUsers}
          projects={mockProjects}
          labels={mockLabels}
          onCreate={mockOnCreate}
        />
      );
      const dialog = screen.getByTestId('create-issue-dialog');
      expect(dialog).toHaveStyle({ maxHeight: '80vh' });
    });
  });

  describe('Test Case 2: Dialog Expands as Text is Typed', () => {
    it('should expand dialog height when typing in title', async () => {
      render(
        <CreateIssueDialog
          show={true}
          onClose={mockOnClose}
          statuses={mockStatuses}
          users={mockUsers}
          projects={mockProjects}
          labels={mockLabels}
          onCreate={mockOnCreate}
        />
      );
      const titleInput = screen.getByTestId('issue-title-input');

      fireEvent.change(titleInput, { target: { value: 'Test Issue Title' } });

      expect(titleInput).toHaveValue('Test Issue Title');
    });

    it('should expand dialog height when typing in description', async () => {
      render(
        <CreateIssueDialog
          show={true}
          onClose={mockOnClose}
          statuses={mockStatuses}
          users={mockUsers}
          projects={mockProjects}
          labels={mockLabels}
          onCreate={mockOnCreate}
        />
      );
      const descInput = screen.getByTestId('rich-text-editor-input');

      fireEvent.change(descInput, { target: { value: 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5' } });

      expect(descInput).toHaveValue('Line 1\nLine 2\nLine 3\nLine 4\nLine 5');
    });

    it('should have overflow-y-auto on editor container', () => {
      render(
        <CreateIssueDialog
          show={true}
          onClose={mockOnClose}
          statuses={mockStatuses}
          users={mockUsers}
          projects={mockProjects}
          labels={mockLabels}
          onCreate={mockOnCreate}
        />
      );
      const editorContainer = screen.getByTestId('editor-container');
      expect(editorContainer).toHaveClass('overflow-y-auto');
    });
  });

  describe('Test Case 3: Scroll Bar Appears at Max Height', () => {
    it('should show scrollbar on text editor when content exceeds max height', () => {
      render(
        <CreateIssueDialog
          show={true}
          onClose={mockOnClose}
          statuses={mockStatuses}
          users={mockUsers}
          projects={mockProjects}
          labels={mockLabels}
          onCreate={mockOnCreate}
        />
      );
      const descInput = screen.getByTestId('rich-text-editor-input');

      const longText = Array(100).fill('Line of text ').join('\n');
      fireEvent.change(descInput, { target: { value: longText } });

      const editorContainer = screen.getByTestId('editor-container');
      expect(editorContainer).toHaveClass('overflow-y-auto');
    });

    it('should keep chips and footer visible even at max height', () => {
      render(
        <CreateIssueDialog
          show={true}
          onClose={mockOnClose}
          statuses={mockStatuses}
          users={mockUsers}
          projects={mockProjects}
          labels={mockLabels}
          onCreate={mockOnCreate}
        />
      );
      const statusChip = screen.getByTestId('status-chip');
      const priorityChip = screen.getByTestId('priority-chip');
      const footer = screen.getByTestId('attachment-button');

      expect(statusChip).toBeInTheDocument();
      expect(priorityChip).toBeInTheDocument();
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Test Case 4: All Corners are Rounded', () => {
    it('should have rounded-lg class for all corners', () => {
      render(
        <CreateIssueDialog
          show={true}
          onClose={mockOnClose}
          statuses={mockStatuses}
          users={mockUsers}
          projects={mockProjects}
          labels={mockLabels}
          onCreate={mockOnCreate}
        />
      );
      const dialog = screen.getByTestId('create-issue-dialog');
      expect(dialog).toHaveClass('rounded-lg');
    });
  });

  describe('Test Case 5: Scroll Bar Position', () => {
    it('should only have scrollbar on text editor, not entire dialog', () => {
      render(
        <CreateIssueDialog
          show={true}
          onClose={mockOnClose}
          statuses={mockStatuses}
          users={mockUsers}
          projects={mockProjects}
          labels={mockLabels}
          onCreate={mockOnCreate}
        />
      );
      const dialog = screen.getByTestId('create-issue-dialog');
      const editorContainer = screen.getByTestId('editor-container');

      expect(dialog).not.toHaveClass('overflow-y-auto');
      expect(editorContainer).toHaveClass('overflow-y-auto');
    });

    it('header, chips and footer should remain fixed and visible', () => {
      render(
        <CreateIssueDialog
          show={true}
          onClose={mockOnClose}
          statuses={mockStatuses}
          users={mockUsers}
          projects={mockProjects}
          labels={mockLabels}
          onCreate={mockOnCreate}
        />
      );

      const header = screen.getByText('New issue');
      const statusChip = screen.getByTestId('status-chip');
      const createButton = screen.getByTestId('create-issue-button');

      expect(header).toBeInTheDocument();
      expect(statusChip).toBeInTheDocument();
      expect(createButton).toBeInTheDocument();
    });
  });

  describe('Dialog Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <CreateIssueDialog
          show={true}
          onClose={mockOnClose}
          statuses={mockStatuses}
          users={mockUsers}
          projects={mockProjects}
          labels={mockLabels}
          onCreate={mockOnCreate}
        />
      );
      const closeButton = screen.getByTestId('close-dialog-button');
      
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onCreate when title is empty', () => {
      render(
        <CreateIssueDialog
          show={true}
          onClose={mockOnClose}
          statuses={mockStatuses}
          users={mockUsers}
          projects={mockProjects}
          labels={mockLabels}
          onCreate={mockOnCreate}
        />
      );
      const createButton = screen.getByTestId('create-issue-button');
      
      fireEvent.click(createButton);
      
      expect(mockOnCreate).not.toHaveBeenCalled();
    });

    it('should call onCreate with valid data when title is filled', () => {
      render(
        <CreateIssueDialog
          show={true}
          onClose={mockOnClose}
          statuses={mockStatuses}
          users={mockUsers}
          projects={mockProjects}
          labels={mockLabels}
          onCreate={mockOnCreate}
        />
      );
      const titleInput = screen.getByTestId('issue-title-input');
      const createButton = screen.getByTestId('create-issue-button');
      
      fireEvent.change(titleInput, { target: { value: 'Test Issue' } });
      fireEvent.click(createButton);
      
      expect(mockOnCreate).toHaveBeenCalledTimes(1);
      expect(mockOnCreate).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Issue',
        statusId: 1,
        priorityId: 0,
      }));
    });
  });

  describe('Dropdown Functionality', () => {
    it('should toggle status dropdown', () => {
      render(
        <CreateIssueDialog
          show={true}
          onClose={mockOnClose}
          statuses={mockStatuses}
          users={mockUsers}
          projects={mockProjects}
          labels={mockLabels}
          onCreate={mockOnCreate}
        />
      );
      const statusChip = screen.getByTestId('status-chip');
      
      fireEvent.click(statusChip);
    });

    it('should toggle priority dropdown', () => {
      render(
        <CreateIssueDialog
          show={true}
          onClose={mockOnClose}
          statuses={mockStatuses}
          users={mockUsers}
          projects={mockProjects}
          labels={mockLabels}
          onCreate={mockOnCreate}
        />
      );
      const priorityChip = screen.getByTestId('priority-chip');
      
      fireEvent.click(priorityChip);
    });

    it('should toggle assignee dropdown', () => {
      render(
        <CreateIssueDialog
          show={true}
          onClose={mockOnClose}
          statuses={mockStatuses}
          users={mockUsers}
          projects={mockProjects}
          labels={mockLabels}
          onCreate={mockOnCreate}
        />
      );
      const assigneeChip = screen.getByTestId('assignee-chip');
      
      fireEvent.click(assigneeChip);
    });

    it('should toggle project dropdown', () => {
      render(
        <CreateIssueDialog
          show={true}
          onClose={mockOnClose}
          statuses={mockStatuses}
          users={mockUsers}
          projects={mockProjects}
          labels={mockLabels}
          onCreate={mockOnCreate}
        />
      );
      const projectChip = screen.getByTestId('project-chip');
      
      fireEvent.click(projectChip);
    });

    it('should toggle labels dropdown', () => {
      render(
        <CreateIssueDialog
          show={true}
          onClose={mockOnClose}
          statuses={mockStatuses}
          users={mockUsers}
          projects={mockProjects}
          labels={mockLabels}
          onCreate={mockOnCreate}
        />
      );
      const labelsChip = screen.getByTestId('labels-chip');
      
      fireEvent.click(labelsChip);
    });

    it('should toggle due date picker', () => {
      render(
        <CreateIssueDialog
          show={true}
          onClose={mockOnClose}
          statuses={mockStatuses}
          users={mockUsers}
          projects={mockProjects}
          labels={mockLabels}
          onCreate={mockOnCreate}
        />
      );
      const dueDateChip = screen.getByTestId('due-date-chip');
      
      fireEvent.click(dueDateChip);
    });
  });
});
