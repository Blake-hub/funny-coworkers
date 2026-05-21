'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import Layout from '@/components/Layout/Layout';
import StatusGroup from '@/components/StatusGroup';
import CreateIssueDialog, { CreateIssueData } from '@/components/CreateIssueDialog';
import { issueApi, issueStatusApi, userApi, projectApi, labelApi, CreateIssueRequest, IssueResponse, IssueStatusResponse, UserResponse, ProjectResponse, LabelResponse } from '@/services/api';
import { toast } from 'react-hot-toast';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Plus, Filter, ChevronDown, Settings, X } from 'lucide-react';

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<{}>> {
  const token = context.req.cookies['pmis-token'];

  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}

export default function IssuesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [issues, setIssues] = useState<IssueResponse[]>([]);
  const [statuses, setStatuses] = useState<IssueStatusResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [labels, setLabels] = useState<LabelResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingIssueId, setDraggingIssueId] = useState<number | null>(null);
  const [highlightedIssueId, setHighlightedIssueId] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  const [selectedChip, setSelectedChip] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);

  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [issuesData, statusesData, usersData, projectsData, labelsData] = await Promise.all([
        issueApi.getAllIssues(),
        issueStatusApi.getActiveStatuses(),
        userApi.getAllUsers(),
        projectApi.getAllProjects(),
        labelApi.getAllLabels(),
      ]);
      setIssues(issuesData);
      setStatuses(statusesData);
      setUsers(usersData);
      setProjects(projectsData);
      setLabels(labelsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchData();
    }
  }, [fetchData, isAuthenticated, authLoading]);

  useEffect(() => {
    let lastHighlightedIssueId: number | null = null;
    let lastDropPosition: 'before' | 'after' | null = null;

    const returnFn = monitorForElements({
      onDragStart: ({ source }) => {
        const data = source.data as { issueId?: number };
        if (data.issueId) {
          setDraggingIssueId(data.issueId);
        }
      },
      onDrag: ({ location }) => {
        const clientY = location.current.input.clientY;
        const container = document.querySelector('[data-issues-container]');
        if (!container) return;

        const issueCards = container.querySelectorAll('[data-issue-card]');
        let foundIssueId: number | null = null;
        let foundPosition: 'before' | 'after' | null = null;

        let lastIssueId: number | null = null;
        let lastCardBottom = 0;

        issueCards.forEach((card) => {
          const rect = card.getBoundingClientRect();
          const midpoint = rect.top + rect.height / 2;
          const issueId = parseInt(card.getAttribute('data-issue-card') || '0', 10);
          
          lastIssueId = issueId;
          lastCardBottom = rect.bottom;

          if (clientY >= rect.top && clientY <= rect.bottom) {
            foundIssueId = issueId;
            foundPosition = clientY < midpoint ? 'before' : 'after';
          }
        });

        if (!foundIssueId && lastIssueId && clientY > lastCardBottom) {
          foundIssueId = lastIssueId;
          foundPosition = 'after';
        }

        if (foundIssueId !== lastHighlightedIssueId || foundPosition !== lastDropPosition) {
          lastHighlightedIssueId = foundIssueId;
          lastDropPosition = foundPosition;
          setHighlightedIssueId(foundIssueId);
          setDropPosition(foundPosition);
        }
      },
      onDrop: () => {
        setDraggingIssueId(null);
        setHighlightedIssueId(null);
        setDropPosition(null);
        lastHighlightedIssueId = null;
        lastDropPosition = null;
      },
    });
    return returnFn;
  }, []);

  const handleIssueDrop = async (
    draggedIssueId: number,
    targetStatusId: number,
    targetIssueId: number,
    position: 'before' | 'after'
  ) => {
    const draggedIssue = issues.find(i => i.id === draggedIssueId);
    const targetIssue = issues.find(i => i.id === targetIssueId);
    if (!draggedIssue || !targetIssue) return;

    const isSameStatus = draggedIssue.statusId === targetStatusId;

    let newSortOrder: number;
    
    if (isSameStatus) {
      const sameStatusIssues = issues
        .filter(i => i.statusId === targetStatusId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      
      const targetIndex = sameStatusIssues.findIndex(i => i.id === targetIssueId);
      if (position === 'before') {
        newSortOrder = targetIndex > 0 
          ? (sameStatusIssues[targetIndex - 1].sortOrder + targetIssue.sortOrder) / 2 
          : targetIssue.sortOrder - 1;
      } else {
        const nextIssue = sameStatusIssues[targetIndex + 1];
        newSortOrder = nextIssue 
          ? (targetIssue.sortOrder + nextIssue.sortOrder) / 2 
          : targetIssue.sortOrder + 1;
      }
    } else {
      const targetStatusIssues = issues.filter(i => i.statusId === targetStatusId);
      const maxSortOrder = targetStatusIssues.length > 0
        ? Math.max(...targetStatusIssues.map(i => i.sortOrder))
        : -1;
      newSortOrder = maxSortOrder + 1;
    }

    const previousIssues = [...issues];
    const updatedIssues = issues.map(issue => {
      if (issue.id === draggedIssueId) {
        return { ...issue, statusId: targetStatusId, sortOrder: newSortOrder };
      }
      return issue;
    });

    setIssues(updatedIssues);

    try {
      await issueApi.updateIssueStatus(draggedIssueId, targetStatusId, newSortOrder);
      toast.success(isSameStatus ? 'Issue reordered' : 'Issue moved');
    } catch (error) {
      console.error('Failed to update issue:', error);
      setIssues(previousIssues);
      toast.error('Failed to move issue');
    }

    setDraggingIssueId(null);
    setHighlightedIssueId(null);
    setDropPosition(null);
  };

  const handleCreateIssue = async (data: CreateIssueData) => {
    if (!data.title.trim()) {
      toast.error('Please enter an issue title');
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem('pmis-user') || '{}');
    
    const issueData: CreateIssueRequest = {
      title: data.title,
      description: data.description || undefined,
      statusId: data.statusId,
      priorityId: data.priorityId,
      assigneeId: data.assigneeId || undefined,
      projectId: data.projectId || undefined,
      reporterId: currentUser.id,
    };

    try {
      await issueApi.createIssue(issueData);
      toast.success('Issue created');
      await fetchData();
    } catch (error) {
      console.error('Failed to create issue:', error);
      toast.error('Failed to create issue');
    }
  };

  const filteredIssues = issues.filter(issue => {
    if (selectedStatus && parseInt(selectedStatus) !== issue.statusId) {
      return false;
    }
    if (selectedAssignee && issue.assigneeId !== parseInt(selectedAssignee)) {
      return false;
    }
    if (selectedChip === 'mine') {
      const currentUser = JSON.parse(localStorage.getItem('pmis-user') || '{}');
      return issue.assigneeId === currentUser.id;
    }
    if (selectedChip === 'open') {
      return issue.statusId !== 4;
    }
    if (selectedChip === 'resolved') {
      return issue.statusId === 4;
    }
    return true;
  });

  const issuesByStatus = statuses.map(status => ({
    status,
    issues: filteredIssues
      .filter(issue => issue.statusId === status.id)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));

  if (authLoading || !isAuthenticated) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading issues...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-2 pb-2 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-800">Issues</h1>
          <div className="relative group">
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center justify-center w-6 h-6 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              data-testid="create-issue-button"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Create a new issue
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div ref={dropdownRef} className="mb-2 pb-2 border-b border-gray-200 flex items-center justify-between">
          {/* Chips Filters */}
          <div className="flex items-center gap-1">
            {[{ id: 'all', label: 'All' }, { id: 'mine', label: 'Mine' }, { id: 'open', label: 'Open' }, { id: 'resolved', label: 'Resolved' }].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setSelectedChip(chip.id)}
                className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  selectedChip === chip.id
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Filter Button with Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowFilterDropdown(!showFilterDropdown);
                  setShowColumnsDropdown(false);
                }}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors"
              >
                <Filter className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-600">Filter</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Filter Dropdown */}
              {showFilterDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  {/* Status Filter */}
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</p>
                      {selectedStatus && (
                        <button onClick={() => setSelectedStatus(null)} className="text-xs text-gray-400 hover:text-gray-600">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {statuses.map((status) => (
                        <label key={status.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                          <input
                            type="radio"
                            name="issueStatus"
                            value={status.id.toString()}
                            checked={selectedStatus === status.id.toString()}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-3 h-3 text-blue-600"
                          />
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                            <span className="text-sm text-gray-700">{status.name}</span>
                          </div>
                        </label>
                      ))}
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                        <input
                          type="radio"
                          name="issueStatus"
                          value=""
                          checked={selectedStatus === null}
                          onChange={() => setSelectedStatus(null)}
                          className="w-3 h-3 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">All</span>
                      </label>
                    </div>
                  </div>

                  {/* Assignee Filter */}
                  <div className="px-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assignee</p>
                      {selectedAssignee && (
                        <button onClick={() => setSelectedAssignee(null)} className="text-xs text-gray-400 hover:text-gray-600">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {users.map((user) => (
                        <label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                          <input
                            type="radio"
                            name="assignee"
                            value={user.id.toString()}
                            checked={selectedAssignee === user.id.toString()}
                            onChange={(e) => setSelectedAssignee(e.target.value)}
                            className="w-3 h-3 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{user.name}</span>
                        </label>
                      ))}
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                        <input
                          type="radio"
                          name="assignee"
                          value=""
                          checked={selectedAssignee === null}
                          onChange={() => setSelectedAssignee(null)}
                          className="w-3 h-3 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">All</span>
                      </label>
                    </div>
                  </div>

                  {/* Reset Button */}
                  <div className="px-4 pt-2">
                    <button
                      onClick={() => {
                        setSelectedStatus(null);
                        setSelectedAssignee(null);
                      }}
                      className="w-full text-left px-2 py-1 text-sm text-red-600 hover:bg-gray-50 rounded"
                    >
                      Reset filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Columns Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowColumnsDropdown(!showColumnsDropdown);
                  setShowFilterDropdown(false);
                }}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors"
              >
                <Settings className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-600">Columns</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showColumnsDropdown ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto" data-issues-container>
          <div className="space-y-1">
            {issuesByStatus
              .filter(({ issues }) => issues.length > 0)
              .map(({ status, issues: statusIssues }) => (
                <StatusGroup
                  key={status.id}
                  status={status}
                  issues={statusIssues}
                  draggingIssueId={draggingIssueId}
                  highlightedIssueId={highlightedIssueId}
                  dropPosition={dropPosition}
                  onIssueDrop={handleIssueDrop}
                  onHighlight={(issueId, position) => {
                    setHighlightedIssueId(issueId);
                    setDropPosition(position);
                  }}
                />
              ))}
          </div>

          {filteredIssues.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No issues match your filter criteria.
            </div>
          )}
        </div>
      </div>

      {/* Create Issue Dialog */}
      <CreateIssueDialog
        show={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        statuses={statuses}
        users={users}
        projects={projects}
        labels={labels}
        onCreate={handleCreateIssue}
      />
    </Layout>
  );
}