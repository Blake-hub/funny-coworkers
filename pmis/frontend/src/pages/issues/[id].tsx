import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Layout from '@/components/Layout/Layout';
import RichTextEditor from '@/components/RichTextEditor';
import { issueApi, issueStatusApi, projectApi, userApi, type IssueResponse, type IssueStatusResponse, type ProjectResponse, type UserResponse } from '@/services/api';
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, Calendar, User, Tag, Clock, AlertCircle, CheckCircle, AlertTriangle, Play, Pencil, Minus, Smile, Paperclip, Plus, Send } from 'lucide-react';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<{ issueId: string }>> {
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
    props: {
      issueId: context.params?.id as string || '',
    },
  };
}

const priorityConfig: Record<number, { label: string; color: string; icon: typeof AlertCircle }> = {
  0: { label: 'No Priority', color: '#808080', icon: Minus },
  1: { label: 'Urgent', color: '#dc2626', icon: AlertTriangle },
  2: { label: 'High', color: '#f59e0b', icon: AlertCircle },
  3: { label: 'Medium', color: '#3b82f6', icon: Clock },
  4: { label: 'Low', color: '#10b981', icon: CheckCircle },
};

export default function IssueDetail({ issueId }: { issueId: string }) {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { addToast } = useToast();

  const [issue, setIssue] = useState<IssueResponse | null>(null);
  const [statuses, setStatuses] = useState<IssueStatusResponse[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [cardExpandedStates, setCardExpandedStates] = useState({
    properties: true,
    updates: true,
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [initialValue, setInitialValue] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchIssue();
      fetchStatuses();
      fetchProjects();
      fetchUsers();
    }
  }, [issueId, authLoading, isAuthenticated]);

  const fetchIssue = async () => {
    try {
      setIsLoading(true);
      const data = await issueApi.getIssueById(parseInt(issueId));
      setIssue(data);
    } catch (error) {
      console.error('Failed to fetch issue:', error);
      if (error instanceof Error) {
        addToast('error', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      const data = await issueStatusApi.getAllStatuses();
      setStatuses(data);
    } catch (error) {
      console.error('Failed to fetch statuses:', error);
    }
  };

  const fetchProjects = async () => {
    if (!user?.id) return;
    
    try {
      const data = await projectApi.getProjectsForUser(Number(user.id));
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await userApi.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleStartEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
    setInitialValue(value);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
    setInitialValue('');
  };

  const handleSaveEdit = async () => {
    if (!issue || !editingField) {
      return;
    }

    const currentValue = (issue as unknown as Record<string, unknown>)[editingField];
    const newValue = editingField === 'description' ? editValue : editValue.trim();

    if (currentValue === newValue) {
      handleCancelEdit();
      return;
    }

    try {
      const result = await issueApi.updateIssue(issue.id, { [editingField]: newValue });
      setIssue(result);
      addToast('success', 'Changes saved');
    } catch (error) {
      console.error('Failed to update issue:', error);
      if (error instanceof Error) {
        addToast('error', error.message);
      }
    } finally {
      handleCancelEdit();
    }
  };

  const handleUpdateProperty = async (field: string, value: number | string | null) => {
    if (!issue) return;

    const currentValue = (issue as unknown as Record<string, unknown>)[field];
    if (currentValue === value) {
      return;
    }

    try {
      const result = await issueApi.updateIssue(issue.id, { [field]: value });
      setIssue(result);
      addToast('success', 'Changes saved');
    } catch (error) {
      console.error('Failed to update issue:', error);
      if (error instanceof Error) {
        addToast('error', error.message);
      }
    }
  };

  const toggleCard = (card: keyof typeof cardExpandedStates) => {
    setCardExpandedStates(prev => ({
      ...prev,
      [card]: !prev[card],
    }));
  };

  const getStatusById = (id: number) => statuses.find(s => s.id === id);
  const getProjectById = (id: number | null) => id ? projects.find(p => p.id === id) : null;
  const getUserById = (id: number | null) => id ? users.find(u => u.id === id) : null;
  const getPriorityConfig = (id: number | null) => id !== null ? priorityConfig[id] : null;

  if (authLoading || isLoading || !issue) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        </div>
      </Layout>
    );
  }

  const currentStatus = getStatusById(issue.statusId);
  const currentProject = getProjectById(issue.projectId);
  const assignee = getUserById(issue.assigneeId);
  const reporter = getUserById(issue.reporterId);
  const priority = getPriorityConfig(issue.priorityId);

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Header - Fixed at top, not scrollable */}
        <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/issues')}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Issues</span>
            </button>
          </div>
          <button
            onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
            className="flex items-center justify-center p-1.5 hover:bg-gray-100 rounded transition-colors"
          >
            {isRightPanelCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>

        {/* Content Area - Left panel scrolls, right panel is static */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Scrollable */}
          <div className={`flex-1 overflow-y-auto transition-all duration-300 ${isRightPanelCollapsed ? 'w-full' : 'w-[70%]'}`}>
            <div className="px-8 py-6 space-y-4">
              {/* Issue Title */}
              <div className="flex items-start gap-3">
                <span className="text-sm text-gray-400 font-mono mt-1">
                {issue.teamIdentifier && issue.teamIssueNumber ? `${issue.teamIdentifier}-${issue.teamIssueNumber}` : `#${issue.id}`}
              </span>
                {editingField === 'title' ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSaveEdit}
                    className="flex-1 text-lg font-semibold border-0 px-0 py-0 focus:ring-0 focus:outline-none bg-transparent"
                    placeholder="Add issue title"
                    autoFocus
                  />
                ) : (
                  <h2
                    className="flex-1 text-lg font-semibold text-gray-800 cursor-pointer hover:text-gray-600 transition-colors"
                    onClick={() => handleStartEdit('title', issue.title)}
                  >
                    {issue.title}
                  </h2>
                )}
              </div>

              {/* Description */}
              <div>
                <span
                  className="text-xs font-semibold text-gray-500 ">
                  Description
                </span>
                <div className="min-h-[80px] py-2">
                  {editingField === 'description' ? (
                    <RichTextEditor
                      value={editValue}
                      onChange={(content) => setEditValue(content)}
                      onBlur={() => handleSaveEdit()}
                      placeholder="Write a description for this issue..."
                      className="border-0"
                      data-testid="issue-description-editor"
                      showToolbar={false}
                    />
                  ) : (
                    <div
                      className="text-gray-700 min-h-[60px] [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_p]:mb-2 [&_p]:text-sm [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-2 [&_li]:mb-1 [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:mb-2 [&_code]:px-1 [&_code]:py-0.5 [&_code]:bg-gray-100 [&_code]:rounded [&_code]:text-sm [&_hr]:my-4 [&_hr]:border-gray-200 cursor-pointer hover:text-gray-800"
                      onClick={() => handleStartEdit('description', issue.description || '')}
                      dangerouslySetInnerHTML={{ __html: issue.description || '<p class="text-gray-400 text-sm">Write a description for this issue...</p>' }}
                    />
                  )}
                </div>
                {/* Action Icons */}
                <div className="flex items-center gap-4 mt-2">
                  <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    <Smile className="w-4 h-4" />
                    <span className="text-xs">Add reaction</span>
                  </button>
                  <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    <Paperclip className="w-4 h-4" />
                    <span className="text-xs">Attach files</span>
                  </button>
                </div>
              </div>

              {/* Add Sub-Issues Button */}
              <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors">
                <Plus className="w-4 h-4" />
                <span>Add sub-issues</span>
              </button>

              {/* Relation Dropdowns */}
              <div className="flex items-center gap-2">
                <select className="text-xs text-gray-700 border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-gray-300">
                  <option value="related">Related to</option>
                  <option value="blocked">Blocked by</option>
                  <option value="belong">Belong to</option>
                </select>
                <select className="flex-1 text-xs text-gray-700 border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-gray-300">
                  <option value="">Search issues...</option>
                  <option value="1">#1 - Issue One</option>
                  <option value="2">#2 - Issue Two</option>
                  <option value="3">#3 - Issue Three</option>
                </select>
              </div>

              {/* Activity/Updates Section */}
              <div className="pt-4 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Activity</span>
                <div className="mt-4 space-y-6">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{reporter?.name || 'Unknown'}</span>
                        <span className="text-sm text-gray-500">created this issue</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(issue.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="mt-6 space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="relative border border-gray-200 rounded-lg">
                        <RichTextEditor
                          value=""
                          onChange={() => {}}
                          onBlur={() => {}}
                          placeholder="Leave a comment..."
                          className="border-0"
                          style={{ minHeight: '48px' }}
                          showToolbar={false}
                        />
                        <div className="flex items-center justify-end gap-3 px-3 pb-2">
                          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                            <Paperclip className="w-4 h-4" />
                          </button>
                          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Static, no scroll */}
          {!isRightPanelCollapsed && (
            <div className="w-[30%] bg-gray-50 overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Properties Card */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <button
                    onClick={() => toggleCard('properties')}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-800">Properties</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${cardExpandedStates.properties ? 'rotate-180' : ''}`} />
                  </button>
                  {cardExpandedStates.properties && (
                    <div className="px-4 pb-4 space-y-3">
                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Status</span>
                        <select
                          value={issue.statusId}
                          onChange={(e) => handleUpdateProperty('statusId', parseInt(e.target.value))}
                          className="text-xs text-gray-700 bg-transparent border-none outline-none cursor-pointer"
                        >
                          {statuses.map(status => (
                            <option key={status.id} value={status.id}>
                              {status.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Priority */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Priority</span>
                        <select
                          value={issue.priorityId ?? 0}
                          onChange={(e) => handleUpdateProperty('priorityId', parseInt(e.target.value))}
                          className="text-xs text-gray-700 bg-transparent border-none outline-none cursor-pointer"
                        >
                          {Object.entries(priorityConfig).map(([id, config]) => (
                            <option key={id} value={id}>
                              {config.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Project */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Project</span>
                        <select
                          value={issue.projectId ?? ''}
                          onChange={(e) => handleUpdateProperty('projectId', e.target.value ? parseInt(e.target.value) : null)}
                          className="text-xs text-gray-700 bg-transparent border-none outline-none cursor-pointer"
                        >
                          <option value="">None</option>
                          {projects.map(project => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Assignee */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Assignee</span>
                        <select
                          value={issue.assigneeId ?? ''}
                          onChange={(e) => handleUpdateProperty('assigneeId', e.target.value ? parseInt(e.target.value) : null)}
                          className="text-xs text-gray-700 bg-transparent border-none outline-none cursor-pointer"
                        >
                          <option value="">Unassigned</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Reporter */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Reporter</span>
                        <span className="text-xs text-gray-700">{reporter?.name || 'Unknown'}</span>
                      </div>

                      {/* Labels */}
                      <div className="flex items-start justify-between">
                        <span className="text-xs text-gray-500 mt-1">Labels</span>
                        <div className="flex items-center gap-1">
                          <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                            <Plus className="w-3 h-3" />
                            Add label
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Updates Card */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <button
                    onClick={() => toggleCard('updates')}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-800">Updates</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${cardExpandedStates.updates ? 'rotate-180' : ''}`} />
                  </button>
                  {cardExpandedStates.updates && (
                    <div className="px-4 pb-4">
                      <div className="text-sm text-gray-500 text-center py-8">
                        No updates yet
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}