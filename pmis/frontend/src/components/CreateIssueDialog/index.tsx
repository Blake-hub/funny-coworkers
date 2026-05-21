'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, FileText, AlertCircle, User, FolderKanban, Tag, Calendar, Paperclip, SlidersHorizontal } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import type { IssueStatusResponse, UserResponse, ProjectResponse, LabelResponse } from '@/services/api';

interface CreateIssueDialogProps {
  show: boolean;
  onClose: () => void;
  statuses: IssueStatusResponse[];
  users: UserResponse[];
  projects: ProjectResponse[];
  labels: LabelResponse[];
  onCreate: (data: CreateIssueData) => void;
}

export interface CreateIssueData {
  title: string;
  description: string;
  statusId: number;
  priorityId: number;
  assigneeId: number | null;
  projectId: number | null;
  labelIds: number[];
  dueDate: string;
}

const priorityOptions = [
  { id: 0, label: 'No priority', icon: SlidersHorizontal },
  { id: 1, label: 'Urgent', icon: AlertCircle, color: 'text-red-500' },
  { id: 2, label: 'High', icon: AlertCircle, color: 'text-orange-500' },
  { id: 3, label: 'Medium', icon: AlertCircle, color: 'text-yellow-500' },
  { id: 4, label: 'Low', icon: AlertCircle, color: 'text-gray-500' },
];

export default function CreateIssueDialog({
  show,
  onClose,
  statuses,
  users,
  projects,
  labels,
  onCreate,
}: CreateIssueDialogProps) {
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    statusId: 1,
    priorityId: 0,
    assigneeId: null as number | null,
    projectId: null as number | null,
    labelIds: [] as number[],
    dueDate: '',
  });
  const [createMore, setCreateMore] = useState(false);

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showLabelsDropdown, setShowLabelsDropdown] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [dialogHeight, setDialogHeight] = useState(300);

  const MIN_HEIGHT = 300;
  const MAX_HEIGHT = 0.8;

  useEffect(() => {
    if (!show) {
      setDialogHeight(MIN_HEIGHT);
      return;
    }

    const viewportHeight = window.innerHeight;
    const maxDialogHeight = viewportHeight * MAX_HEIGHT;

    if (!newIssue.description || newIssue.description.trim() === '') {
      setDialogHeight(MIN_HEIGHT);
      return;
    }

    const editorContent = document.querySelector('.ProseMirror');
    if (editorContent) {
      const editorHeight = editorContent.scrollHeight;
      
      const headerHeight = 56;
      const titleHeight = 48;
      const chipsHeight = 40;
      const footerHeight = 56;
      const padding = 16;
      
      const totalStaticHeight = headerHeight + titleHeight + chipsHeight + footerHeight + padding;
      const availableEditorHeight = editorHeight + 32;
      
      const newHeight = Math.min(
        Math.max(MIN_HEIGHT, totalStaticHeight + availableEditorHeight),
        maxDialogHeight
      );
      
      if (newHeight !== dialogHeight) {
        setDialogHeight(newHeight);
      }
    }
  }, [show, newIssue.description]);

  const handleSubmit = () => {
    if (!newIssue.title.trim()) return;
    onCreate({ ...newIssue });
    
    if (!createMore) {
      onClose();
    } else {
      setNewIssue({
        title: '',
        description: '',
        statusId: 1,
        priorityId: 0,
        assigneeId: null,
        projectId: null,
        labelIds: [],
        dueDate: '',
      });
    }
  };

  if (!show) return null;

  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
  const maxDialogHeight = viewportHeight * MAX_HEIGHT;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        ref={dialogRef}
        data-testid="create-issue-dialog"
        className="bg-white rounded-lg shadow-xl flex flex-col"
        style={{ 
          width: '50vw',
          height: `${dialogHeight}px`,
          maxHeight: `${maxDialogHeight}px`,
          minHeight: `${MIN_HEIGHT}px`
        }}
      >
        <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-800">New issue</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            data-testid="close-dialog-button"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-4 py-1.5 pb-1 flex-shrink-0">
          <input
            type="text"
            placeholder="Issue title"
            value={newIssue.title}
            onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
            className="w-full text-lg font-semibold border-0 px-0 py-0 focus:ring-0 focus:outline-none placeholder-gray-400"
            autoFocus
            data-testid="issue-title-input"
          />
        </div>

        <div 
          ref={editorContainerRef}
          className="px-4 pt-1 py-1"
          data-testid="issue-description-editor"
          style={{ 
            flex: '1 1 auto',
            overflowY: dialogHeight >= maxDialogHeight - 20 ? 'auto' : 'hidden',
            maxHeight: dialogHeight >= maxDialogHeight - 20 ? `${dialogHeight - 200}px` : 'none'
          }}
        >
          <RichTextEditor
            value={newIssue.description}
            onChange={(content) => setNewIssue({ ...newIssue, description: content })}
            placeholder="Description..."
            className="w-full"
          />
        </div>

        <div className="px-4 py-1.5 flex flex-wrap gap-1.5 flex-shrink-0">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowStatusDropdown(!showStatusDropdown);
                setShowPriorityDropdown(false);
                setShowAssigneeDropdown(false);
                setShowProjectDropdown(false);
                setShowLabelsDropdown(false);
                setShowDueDatePicker(false);
              }}
              className="flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              <FileText className="w-3 h-3 text-gray-500" />
              {statuses.find(s => s.id === newIssue.statusId)?.name || 'Status'}
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-48">
                {statuses.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => {
                      setNewIssue({ ...newIssue, statusId: status.id });
                      setShowStatusDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 text-sm ${newIssue.statusId === status.id ? 'bg-gray-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      {status.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPriorityDropdown(!showPriorityDropdown);
                setShowStatusDropdown(false);
                setShowAssigneeDropdown(false);
                setShowProjectDropdown(false);
                setShowLabelsDropdown(false);
                setShowDueDatePicker(false);
              }}
              className="flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              <AlertCircle className={`w-3 h-3 ${priorityOptions.find(p => p.id === newIssue.priorityId)?.color || 'text-gray-500'}`} />
              {priorityOptions.find(p => p.id === newIssue.priorityId)?.label || 'Priority'}
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            {showPriorityDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-48">
                {priorityOptions.map((priority) => (
                  <button
                    key={priority.id}
                    onClick={() => {
                      setNewIssue({ ...newIssue, priorityId: priority.id });
                      setShowPriorityDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 text-sm ${newIssue.priorityId === priority.id ? 'bg-gray-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <priority.icon className={`w-4 h-4 ${priority.color || 'text-gray-500'}`} />
                      {priority.label}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAssigneeDropdown(!showAssigneeDropdown);
                setShowStatusDropdown(false);
                setShowPriorityDropdown(false);
                setShowProjectDropdown(false);
                setShowLabelsDropdown(false);
                setShowDueDatePicker(false);
              }}
              className="flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              <User className="w-3 h-3 text-gray-500" />
              {users.find(u => u.id === newIssue.assigneeId)?.name || 'Assignee'}
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            {showAssigneeDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-48 max-h-64 overflow-y-auto">
                <button
                  onClick={() => {
                    setNewIssue({ ...newIssue, assigneeId: null });
                    setShowAssigneeDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 text-sm ${newIssue.assigneeId === null ? 'bg-gray-50' : ''}`}
                >
                  No assignee
                </button>
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setNewIssue({ ...newIssue, assigneeId: user.id });
                      setShowAssigneeDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 text-sm ${newIssue.assigneeId === user.id ? 'bg-gray-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      {user.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowProjectDropdown(!showProjectDropdown);
                setShowStatusDropdown(false);
                setShowPriorityDropdown(false);
                setShowAssigneeDropdown(false);
                setShowLabelsDropdown(false);
                setShowDueDatePicker(false);
              }}
              className="flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              <FolderKanban className="w-3 h-3 text-gray-500" />
              {projects.find(p => p.id === newIssue.projectId)?.name || 'Project'}
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            {showProjectDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-48 max-h-64 overflow-y-auto">
                <button
                  onClick={() => {
                    setNewIssue({ ...newIssue, projectId: null });
                    setShowProjectDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 text-sm ${newIssue.projectId === null ? 'bg-gray-50' : ''}`}
                >
                  No project
                </button>
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setNewIssue({ ...newIssue, projectId: project.id });
                      setShowProjectDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 text-sm ${newIssue.projectId === project.id ? 'bg-gray-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-gray-400" />
                      {project.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLabelsDropdown(!showLabelsDropdown);
                setShowStatusDropdown(false);
                setShowPriorityDropdown(false);
                setShowAssigneeDropdown(false);
                setShowProjectDropdown(false);
                setShowDueDatePicker(false);
              }}
              className="flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              <Tag className="w-3 h-3 text-gray-500" />
              {newIssue.labelIds.length > 0 ? `${newIssue.labelIds.length} label${newIssue.labelIds.length > 1 ? 's' : ''}` : 'Labels'}
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            {showLabelsDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-64 max-h-64 overflow-y-auto">
                {labels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => {
                      const newLabelIds = newIssue.labelIds.includes(label.id)
                        ? newIssue.labelIds.filter(id => id !== label.id)
                        : [...newIssue.labelIds, label.id];
                      setNewIssue({ ...newIssue, labelIds: newLabelIds });
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm ${newIssue.labelIds.includes(label.id) ? 'bg-gray-50' : ''}`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                    {newIssue.labelIds.includes(label.id) && (
                      <span className="ml-auto text-green-500 text-sm">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDueDatePicker(!showDueDatePicker);
                setShowStatusDropdown(false);
                setShowPriorityDropdown(false);
                setShowAssigneeDropdown(false);
                setShowProjectDropdown(false);
                setShowLabelsDropdown(false);
              }}
              className="flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              <Calendar className="w-3 h-3 text-gray-500" />
              {newIssue.dueDate || 'Due date'}
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            {showDueDatePicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
                <input
                  type="date"
                  value={newIssue.dueDate}
                  onChange={(e) => setNewIssue({ ...newIssue, dueDate: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                />
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
            <Paperclip className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createMore}
                onChange={(e) => setCreateMore(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600">Create more</span>
            </label>
            <button
              onClick={handleSubmit}
              disabled={!newIssue.title.trim()}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Create issue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}