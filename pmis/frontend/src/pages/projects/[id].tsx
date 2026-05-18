import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Layout from '@/components/Layout/Layout';
import RichTextEditor from '@/components/RichTextEditor';
import { projectApi, milestoneApi, userApi, type ProjectResponse, type MilestoneResponse, type UserResponse, type LabelResponse } from '@/services/api';
import { ArrowLeft, Check, X, ChevronLeft, ChevronRight, Calendar, Users, Tag, Clock, Play, AlertCircle, Minus, ArrowUp, ArrowDown, AlertTriangle, Plus, ChevronDown, Save, Inbox, Pencil } from 'lucide-react';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<{ projectId: string }>> {
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
      projectId: context.params?.id as string || '',
    },
  };
}

export default function ProjectDetail({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [milestones, setMilestones] = useState<MilestoneResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [allLabels, setAllLabels] = useState<LabelResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [cardExpandedStates, setCardExpandedStates] = useState({
    properties: true,
    progress: true,
    updates: true,
  });
  
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ name: '', description: '', dueDate: '' });
  const [editingMilestone, setEditingMilestone] = useState<MilestoneResponse | null>(null);
  
  const [showLabelMenu, setShowLabelMenu] = useState(false);
  const [labelMenuPosition, setLabelMenuPosition] = useState({ x: 0, y: 0 });
  const [labelSearchText, setLabelSearchText] = useState('');
  const [newLabelName, setNewLabelName] = useState('');
  const [selectedLabelColor, setSelectedLabelColor] = useState('#007bff');
  const [isColorMode, setIsColorMode] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    fetchProject();
    fetchUsers();
    fetchLabels();
  }, [projectId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isInsideDropdown = target.closest('.property-dropdown');
      const isInsideLabelMenu = target.closest('.label-menu');
      if (!isInsideDropdown && editingProperty) {
        setEditingProperty(null);
      }
      if (!isInsideLabelMenu && showLabelMenu) {
        setShowLabelMenu(false);
        setLabelSearchText('');
        setIsColorMode(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingProperty, showLabelMenu]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      const data = await projectApi.getProjectById(parseInt(projectId));
      setProject(data);
      setMilestones(data.milestones);
    } catch (error) {
      console.error('Failed to fetch project:', error);
      if (error instanceof Error) {
        addToast('error', error.message);
      }
    } finally {
      setIsLoading(false);
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

  const fetchLabels = async () => {
    try {
      const { labelApi } = await import('@/services/api');
      const data = await labelApi.getAllLabels();
      setAllLabels(data);
    } catch (error) {
      console.error('Failed to fetch labels:', error);
    }
  };

  const projectStatusOptions = [
    { id: 'backlog', label: 'Backlog', value: 1, icon: Inbox },
    { id: 'planned', label: 'Planned', value: 2, icon: Clock },
    { id: 'in_progress', label: 'In Process', value: 3, icon: Play },
    { id: 'completed', label: 'Completed', value: 4, icon: Check },
    { id: 'canceled', label: 'Canceled', value: 5, icon: AlertCircle },
  ];

  const projectPriorityOptions = [
    { id: 'no_priority', label: 'No priority', value: 0, icon: Minus },
    { id: 'urgent', label: 'Urgent', value: 1, icon: AlertTriangle },
    { id: 'high', label: 'High', value: 2, icon: ArrowUp },
    { id: 'medium', label: 'Medium', value: 3, icon: Minus },
    { id: 'low', label: 'Low', value: 4, icon: ArrowDown },
  ];

  const getStatusLabel = (status: number) => {
    return projectStatusOptions.find(s => s.value === status)?.label || 'Unknown';
  };

  const getPriorityLabel = (priority: number) => {
    return projectPriorityOptions.find(p => p.value === priority)?.label || 'Unknown';
  };

  const getStatusIcon = (status: number) => {
    const option = projectStatusOptions.find(s => s.value === status);
    if (option) {
      const Icon = option.icon;
      return <Icon className="w-3 h-3" />;
    }
    return null;
  };

  const getPriorityIcon = (priority: number) => {
    const option = projectPriorityOptions.find(p => p.value === priority);
    if (option) {
      const Icon = option.icon;
      return <Icon className="w-3 h-3" />;
    }
    return null;
  };

  const toggleCard = (cardName: 'properties' | 'progress' | 'updates') => {
    setCardExpandedStates(prev => ({
      ...prev,
      [cardName]: !prev[cardName],
    }));
  };

  const handleStartEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const handleSaveEdit = async () => {
    if (!project || !editingField) return;

    const originalValue = (project as unknown as Record<string, string | undefined>)[editingField] ?? '';
    if (originalValue === editValue) {
      setEditingField(null);
      setEditValue('');
      return;
    }

    try {
      const updateData: Record<string, string> = {};
      updateData[editingField] = editValue;
      
      await projectApi.updateProject(project.id, updateData);
      setProject(prev => prev ? { ...prev, [editingField]: editValue } : null);
      addToast('success', 'Changes saved');
    } catch (error) {
      console.error('Failed to update project:', error);
      if (error instanceof Error) {
        addToast('error', error.message);
      }
    } finally {
      setEditingField(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleUpdateProperty = async (field: string, value: number | string | null) => {
    if (!project) return;

    const currentValue = (project as unknown as Record<string, unknown>)[field];
    if (currentValue === value) {
      setEditingProperty(null);
      return;
    }

    try {
      await projectApi.updateProject(project.id, { [field]: value });
      
      if (field === 'leaderId' && typeof value === 'number') {
        const selectedUser = users.find(u => u.id === value);
        setProject(prev => prev ? { 
          ...prev, 
          leaderId: value, 
          leaderName: selectedUser?.name || '' 
        } : null);
      } else {
        setProject(prev => prev ? { ...prev, [field]: value } : null);
      }
      
      setEditingProperty(null);
      addToast('success', 'Changes saved');
    } catch (error) {
      console.error('Failed to update project:', error);
      if (error instanceof Error) {
        addToast('error', error.message);
      }
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestone.name.trim()) {
      addToast('error', 'Please enter a milestone name');
      return;
    }

    try {
      const result = await milestoneApi.createMilestone(parseInt(projectId), {
        name: newMilestone.name,
        description: newMilestone.description,
        dueDate: newMilestone.dueDate || undefined,
      });
      setMilestones(prev => [...prev, result]);
      setShowMilestoneForm(false);
      setNewMilestone({ name: '', description: '', dueDate: '' });
      addToast('success', 'Milestone added');
    } catch (error) {
      console.error('Failed to create milestone:', error);
      if (error instanceof Error) {
        addToast('error', error.message);
      }
    }
  };

  const handleUpdateMilestone = async () => {
    if (!editingMilestone || !editingMilestone.name.trim()) {
      addToast('error', 'Please enter a milestone name');
      return;
    }

    try {
      const result = await milestoneApi.updateMilestone(
        parseInt(projectId),
        editingMilestone.id,
        {
          name: editingMilestone.name,
          description: editingMilestone.description,
          dueDate: editingMilestone.dueDate || undefined,
        }
      );
      setMilestones(prev => prev.map(m => m.id === result.id ? result : m));
      setEditingMilestone(null);
      addToast('success', 'Milestone updated');
    } catch (error) {
      console.error('Failed to update milestone:', error);
      if (error instanceof Error) {
        addToast('error', error.message);
      }
    }
  };

  const handleDeleteMilestone = async (milestoneId: number) => {
    try {
      await milestoneApi.deleteMilestone(parseInt(projectId), milestoneId);
      setMilestones(prev => prev.filter(m => m.id !== milestoneId));
      addToast('success', 'Milestone deleted');
    } catch (error) {
      console.error('Failed to delete milestone:', error);
      if (error instanceof Error) {
        addToast('error', error.message);
      }
    }
  };

  const handleToggleMilestoneComplete = async (milestone: MilestoneResponse) => {
    try {
      const result = await milestoneApi.completeMilestone(parseInt(projectId), milestone.id);
      setMilestones(prev => prev.map(m => m.id === result.id ? result : m));
      fetchProject();
    } catch (error) {
      console.error('Failed to update milestone:', error);
      if (error instanceof Error) {
        addToast('error', error.message);
      }
    }
  };

  const handleOpenLabelMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setLabelMenuPosition({
      x: rect.left,
      y: rect.bottom + 4
    });
    setShowLabelMenu(true);
    setLabelSearchText('');
    setIsColorMode(false);
  };

  const handleSelectLabel = async (label: LabelResponse) => {
    try {
      await projectApi.assignLabel(parseInt(projectId), label.id);
      fetchProject();
    } catch (assignError) {
      console.warn('Failed to assign label via API, adding locally:', assignError);
      setProject(prev => prev ? {
        ...prev,
        labels: [...prev.labels, label]
      } : null);
    }
    setShowLabelMenu(false);
    setLabelSearchText('');
    addToast('success', 'Label added');
  };

  const handleCreateNewLabel = () => {
    if (!labelSearchText.trim()) {
      addToast('error', 'Please enter a label name');
      return;
    }
    setNewLabelName(labelSearchText);
    setIsColorMode(true);
    setLabelSearchText('');
  };

  const handleSelectColorAndCreate = async (color: string) => {
    if (!newLabelName.trim()) {
      addToast('error', 'Please enter a label name');
      return;
    }

    try {
      const { labelApi } = await import('@/services/api');
      const newLabel = await labelApi.createLabel({ 
        name: newLabelName, 
        color: color 
      });
      setAllLabels(prev => [...prev, newLabel]);
      
      try {
        await projectApi.assignLabel(parseInt(projectId), newLabel.id);
        fetchProject();
      } catch (assignError) {
        console.warn('Failed to assign label via API, adding locally:', assignError);
        setProject(prev => prev ? {
          ...prev,
          labels: [...prev.labels, newLabel]
        } : null);
      }
      
      setShowLabelMenu(false);
      setLabelSearchText('');
      setNewLabelName('');
      setIsColorMode(false);
      addToast('success', 'Label created');
    } catch (error) {
      console.error('Failed to create label:', error);
      if (error instanceof Error) {
        addToast('error', error.message);
      }
    }
  };

  const filteredLabels = allLabels.filter(label => 
    !project?.labels.some(l => l.id === label.id) &&
    label.name.toLowerCase().includes(labelSearchText.toLowerCase())
  );

  const labelColors = [
    '#007bff', '#6610f2', '#6f42c1', '#e83e8c', '#dc3545',
    '#fd7e14', '#ffc107', '#28a745', '#20c997', '#17a2b8',
    '#6c757d', '#343a40'
  ];

  const colorNames: Record<string, string> = {
    '#007bff': 'Blue',
    '#6610f2': 'Indigo',
    '#6f42c1': 'Purple',
    '#e83e8c': 'Pink',
    '#dc3545': 'Red',
    '#fd7e14': 'Orange',
    '#ffc107': 'Yellow',
    '#28a745': 'Green',
    '#20c997': 'Teal',
    '#17a2b8': 'Cyan',
    '#6c757d': 'Gray',
    '#343a40': 'Dark'
  };

  const completedMilestones = milestones.filter(m => m.completed).length;
  const progressPercent = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;

  if (isLoading || !project) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Header Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between">
          <button
            onClick={() => router.push('/projects')}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
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

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - 70% Width */}
          <div className={`flex-1 overflow-y-auto transition-all duration-300 ${isRightPanelCollapsed ? 'w-full' : 'w-[70%]'}`}>
            <div className="px-8 py-6 space-y-4">
              {/* Project Name */}
              <div>
                {editingField === 'name' ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSaveEdit}
                    className="w-full text-base font-semibold border-0 px-0 py-0 focus:ring-0 focus:outline-none bg-transparent"
                    autoFocus
                  />
                ) : (
                  <h2
                    className="text-base font-semibold text-gray-800 cursor-pointer hover:text-gray-600 transition-colors"
                    onClick={() => handleStartEdit('name', project.name)}
                  >
                    {project.name}
                  </h2>
                )}
              </div>

              {/* Summary */}
              <div>
                {editingField === 'summary' ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSaveEdit}
                    className="w-full border-0 px-0 py-0 text-sm focus:ring-0 focus:outline-none bg-transparent"
                    placeholder="Add a short summary for this project"
                    autoFocus
                  />
                ) : (
                  <p
                    className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 transition-colors"
                    onClick={() => handleStartEdit('summary', project.summary)}
                  >
                    {project.summary || 'Add a short summary for this project'}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</span>
                <div className="min-h-[60px] py-2">
                  {editingField === 'description' ? (
                    <RichTextEditor
                      value={editValue}
                      onChange={(content) => setEditValue(content)}
                      onBlur={() => handleSaveEdit()}
                      placeholder="Write a project introduction, or other useful information...."
                      className="border-0"
                    />
                  ) : (
                    <div
                      className="text-gray-700 cursor-pointer hover:text-gray-800 transition-colors min-h-[40px] [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_p]:mb-2 [&_p]:text-sm [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-2 [&_li]:mb-1 [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:mb-2 [&_code]:px-1 [&_code]:py-0.5 [&_code]:bg-gray-100 [&_code]:rounded [&_code]:text-sm [&_hr]:my-4 [&_hr]:border-gray-200"
                      onClick={() => handleStartEdit('description', project.description)}
                      dangerouslySetInnerHTML={{ __html: project.description || '<p class="text-gray-400 text-sm">Write a project introduction, or other useful information....</p>' }}
                    />
                  )}
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Milestones</span>
                </div>

                {/* Milestone List */}
                <div className="space-y-2">
                  {milestones.length === 0 ? (
                    <div className="text-sm text-gray-500 py-4">No milestones yet.</div>
                  ) : (
                    milestones.map((milestone) => {
                      if (editingMilestone?.id === milestone.id) {
                        return (
                          <div key={milestone.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingMilestone.name}
                                onChange={(e) => setEditingMilestone(prev => prev ? { ...prev, name: e.target.value } : null)}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300"
                                placeholder="Milestone name"
                              />
                              <button
                                onClick={() => setEditingMilestone(null)}
                                className="p-2 text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <textarea
                              value={editingMilestone.description}
                              onChange={(e) => setEditingMilestone(prev => prev ? { ...prev, description: e.target.value } : null)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300 resize-none"
                              rows={2}
                              placeholder="Description..."
                            />
                            <div className="flex items-center gap-2">
                              <button
                                className="flex items-center gap-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm hover:bg-gray-200"
                                onClick={() => (document.getElementById(`edit-milestone-date-${milestone.id}`) as HTMLInputElement)?.showPicker()}
                              >
                                <Calendar className="w-4 h-4" />
                                {editingMilestone.dueDate || 'Select date'}
                              </button>
                              <input
                                id={`edit-milestone-date-${milestone.id}`}
                                type="date"
                                value={editingMilestone.dueDate || ''}
                                onChange={(e) => setEditingMilestone(prev => prev ? { ...prev, dueDate: e.target.value || null } : null)}
                                className="sr-only"
                              />
                              <button
                                onClick={handleUpdateMilestone}
                                className="ml-auto px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={milestone.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <button
                            onClick={() => handleToggleMilestoneComplete(milestone)}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              milestone.completed 
                                ? 'bg-green-500 border-green-500' 
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {milestone.completed && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <span className={`flex-1 text-sm ${milestone.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {milestone.name}
                          </span>
                          {milestone.dueDate ? (
                            <span className="text-xs text-gray-500">{milestone.dueDate}</span>
                          ) : (
                            <button
                              onClick={() => (document.getElementById(`milestone-date-${milestone.id}`) as HTMLInputElement)?.showPicker()}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                          )}
                          <input
                            id={`milestone-date-${milestone.id}`}
                            type="date"
                            value={milestone.dueDate || ''}
                            onChange={(e) => {
                              const newDate = e.target.value || null;
                              setMilestones(prev => prev.map(m => m.id === milestone.id ? { ...m, dueDate: newDate } : m));
                            }}
                            className="sr-only"
                          />
                          <button
                            onClick={() => setEditingMilestone(milestone)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMilestone(milestone.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Milestone Form */}
                {showMilestoneForm && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={newMilestone.name}
                        onChange={(e) => setNewMilestone(prev => ({ ...prev, name: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300"
                        placeholder="Milestone name"
                        autoFocus
                      />
                      <button
                        onClick={() => (document.getElementById('new-milestone-due-date') as HTMLInputElement)?.showPicker()}
                        className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <Calendar className="w-4 h-4 text-gray-500" />
                      </button>
                      <input
                        id="new-milestone-due-date"
                        type="date"
                        value={newMilestone.dueDate}
                        onChange={(e) => setNewMilestone(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="sr-only"
                      />
                    </div>
                    <textarea
                      value={newMilestone.description}
                      onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-300 resize-none"
                      rows={2}
                      placeholder="Description..."
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setShowMilestoneForm(false)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddMilestone}
                        className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                      >
                        Add milestone
                      </button>
                    </div>
                  </div>
                )}

                {!showMilestoneForm && (
                  <button
                    onClick={() => {
                      setShowMilestoneForm(true);
                      setNewMilestone({ name: '', description: '', dueDate: '' });
                    }}
                    className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors w-full justify-center"
                  >
                    <Plus className="w-4 h-4" />
                    Milestone
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - 30% Width */}
          <div className={`${isRightPanelCollapsed ? 'w-0 overflow-hidden' : 'w-[30%]'} transition-all duration-300 border-l border-gray-200 flex flex-col`}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    {/* Leader */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Leader</span>
                      <div className="relative property-dropdown">
                        <button
                          onClick={() => setEditingProperty('leaderId')}
                          className="text-xs text-gray-700 cursor-pointer hover:text-gray-900 px-2 py-0.5 rounded hover:bg-gray-100 flex items-center gap-1"
                        >
                          {project.leaderName || 'Not set'}
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        {editingProperty === 'leaderId' && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-150 rounded-lg shadow-sm z-50 overflow-y-auto max-h-48">
                            <button
                              onClick={() => handleUpdateProperty('leaderId', 0)}
                              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                            >
                              Select leader
                            </button>
                            {users.map((user) => (
                              <button
                                key={user.id}
                                onClick={() => handleUpdateProperty('leaderId', user.id)}
                                className={`w-full text-left px-3 py-1.5 text-xs ${
                                  project.leaderId === user.id ? 'bg-gray-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {user.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Status</span>
                      <div className="relative property-dropdown">
                        <button
                          onClick={() => setEditingProperty('status')}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-pointer hover:opacity-80 ${
                            project.status === 4 ? 'bg-green-100 text-green-700' :
                            project.status === 3 ? 'bg-blue-100 text-blue-700' :
                            project.status === 2 ? 'bg-yellow-100 text-yellow-700' :
                            project.status === 5 ? 'bg-gray-100 text-gray-700' :
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {getStatusIcon(project.status)}
                          {getStatusLabel(project.status)}
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        {editingProperty === 'status' && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-150 rounded-lg shadow-sm z-50 overflow-y-auto max-h-48">
                            {projectStatusOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleUpdateProperty('status', option.value)}
                                className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 ${
                                  project.status === option.value ? 'bg-gray-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {getStatusIcon(option.value)}
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Priority */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Priority</span>
                      <div className="relative property-dropdown">
                        <button
                          onClick={() => setEditingProperty('priority')}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-pointer hover:opacity-80 ${
                            project.priority === 1 ? 'bg-red-100 text-red-700' :
                            project.priority === 2 ? 'bg-orange-100 text-orange-700' :
                            project.priority === 3 ? 'bg-yellow-100 text-yellow-700' :
                            project.priority === 4 ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {getPriorityIcon(project.priority)}
                          {getPriorityLabel(project.priority)}
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        {editingProperty === 'priority' && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-150 rounded-lg shadow-sm z-50 overflow-y-auto max-h-48">
                            {projectPriorityOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleUpdateProperty('priority', option.value)}
                                className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 ${
                                  project.priority === option.value ? 'bg-gray-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {getPriorityIcon(option.value)}
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Labels */}
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500">Labels</span>
                      <div className="flex flex-wrap gap-1">
                        {project.labels.length === 0 ? (
                          <button
                            onClick={handleOpenLabelMenu}
                            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add label
                          </button>
                        ) : (
                          <>
                            {project.labels.map((label) => (
                              <span
                                key={label.id}
                                className="px-2 py-0.5 rounded text-xs"
                                style={{ backgroundColor: label.color + '20', color: label.color }}
                              >
                                {label.name}
                              </span>
                            ))}
                            <button
                              onClick={handleOpenLabelMenu}
                              className="text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center w-5 h-5 rounded-full hover:bg-gray-100"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          Start Date
                        </span>
                        <div className="relative property-dropdown">
                          {editingProperty === 'startDate' ? (
                            <input
                              type="date"
                              value={project.startDate || ''}
                              onChange={(e) => handleUpdateProperty('startDate', e.target.value || null)}
                              className="text-xs border border-gray-150 rounded px-2 py-1 focus:outline-none focus:border-gray-300 bg-white z-50 relative"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => setEditingProperty('startDate')}
                              className="text-xs text-gray-700 cursor-pointer hover:text-gray-900 px-2 py-0.5 rounded hover:bg-gray-100 flex items-center gap-1"
                            >
                              {project.startDate || 'Not set'}
                              <Calendar className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          Target Date
                        </span>
                        <div className="relative property-dropdown">
                          {editingProperty === 'endDate' ? (
                            <input
                              type="date"
                              value={project.endDate || ''}
                              onChange={(e) => handleUpdateProperty('endDate', e.target.value || null)}
                              className="text-xs border border-gray-150 rounded px-2 py-1 focus:outline-none focus:border-gray-300 bg-white z-50 relative"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => setEditingProperty('endDate')}
                              className="text-xs text-gray-700 cursor-pointer hover:text-gray-900 px-2 py-0.5 rounded hover:bg-gray-100 flex items-center gap-1"
                            >
                              {project.endDate || 'Not set'}
                              <Calendar className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Card */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleCard('progress')}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-800">Progress</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${cardExpandedStates.progress ? 'rotate-180' : ''}`} />
                </button>
                {cardExpandedStates.progress && (
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-gray-800">{progressPercent}%</span>
                      <span className="text-xs text-gray-500">{completedMilestones} of {milestones.length} milestones</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gray-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Updates Card */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleCard('updates')}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-800">Updates</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${cardExpandedStates.updates ? 'rotate-180' : ''}`} />
                </button>
                {cardExpandedStates.updates && (
                  <div className="px-4 pb-4">
                    <div className="text-sm text-gray-500 py-4 text-center">
                      No updates yet
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Label Menu */}
      {showLabelMenu && (
        <div 
          className="label-menu fixed bg-white rounded-lg shadow-xl border border-gray-150 w-64 z-50"
          style={{ left: labelMenuPosition.x, top: labelMenuPosition.y }}
        >
          {isColorMode ? (
            <>
              <div className="px-3 py-2">
                <input
                  type="text"
                  value={labelSearchText}
                  onChange={(e) => setLabelSearchText(e.target.value)}
                  placeholder="pick up a color..."
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
              <div className="px-3 pb-3 max-h-48 overflow-y-auto">
                <div className="border-t border-gray-150 my-2"></div>
                <div className="space-y-1">
                  {labelColors.filter(color => 
                    colorNames[color].toLowerCase().includes(labelSearchText.toLowerCase())
                  ).map((color) => (
                    <button
                      key={color}
                      onClick={() => handleSelectColorAndCreate(color)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm text-gray-700">{colorNames[color]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="px-3 py-2">
                <input
                  type="text"
                  value={labelSearchText}
                  onChange={(e) => setLabelSearchText(e.target.value)}
                  placeholder="Add label..."
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400"
                  autoFocus
                />
              </div>
              <div className="px-3 pb-3 max-h-48 overflow-y-auto">
                {filteredLabels.length > 0 ? (
                  <div className="space-y-1">
                    {filteredLabels.map((label) => (
                      <button
                        key={label.id}
                        onClick={() => handleSelectLabel(label)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="text-sm text-gray-700">{label.name}</span>
                      </button>
                    ))}
                  </div>
                ) : labelSearchText.trim() !== '' ? (
                  <button
                    onClick={handleCreateNewLabel}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Create new label: {labelSearchText}</span>
                  </button>
                ) : (
                  <div className="text-sm text-gray-400 py-2 text-center">
                    No labels available
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </Layout>
  );
}