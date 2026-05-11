import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Layout from '@/components/Layout/Layout';
import RichTextEditor from '@/components/RichTextEditor';
import { mockUsers } from '@/data/mockData';
import { projectApi, milestoneApi, userApi, type ProjectResponse, type UserResponse } from '@/services/api';
import { Plus, Filter, ChevronDown, Settings, Check, X, Calendar, User, Users, Tag, Inbox, Clock, Play, AlertCircle, Minus, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

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

export default function Projects() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChip, setSelectedChip] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    description: '',
    dueDate: '',
  });
  const [milestones, setMilestones] = useState<Array<{ id: string; name: string; dueDate: string; description: string }>>([]);
  const [projectDescriptionRows, setProjectDescriptionRows] = useState(3);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const milestoneRef = useRef<HTMLDivElement>(null);

  const [enabledColumns, setEnabledColumns] = useState({
    name: true,
    description: true,
    progress: true,
    issues: true,
    leader: true,
  });

  const [newProject, setNewProject] = useState({
    name: '',
    summary: '',
    description: '',
    status: 'backlog',
    priority: 'no_priority',
    leaderId: '1',
    memberIds: [] as string[],
    startDate: '',
    endDate: '',
    labels: [] as string[],
  });

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showLeaderDropdown, setShowLeaderDropdown] = useState(false);
  const [showMembersDropdown, setShowMembersDropdown] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  useEffect(() => {
    const closeDropdowns = () => {
      setShowStatusDropdown(false);
      setShowPriorityDropdown(false);
      setShowLeaderDropdown(false);
      setShowMembersDropdown(false);
    };

    document.addEventListener('click', closeDropdowns);
    return () => document.removeEventListener('click', closeDropdowns);
  }, []);

  useEffect(() => {
    if (showMilestoneForm && milestoneRef.current) {
      setTimeout(() => {
        milestoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [showMilestoneForm]);

  const fetchProjects = async () => {
    try {
      const data = await projectApi.getAllProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      if (error instanceof Error) {
        addToast('error', error.message);
      }
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await userApi.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      if (error instanceof Error) {
        addToast('error', error.message);
      }
    }
  };

  const chipOptions = [
    { id: 'all', label: 'All projects' },
    { id: 'milestone', label: 'Has milestone' },
    { id: 'no-milestone', label: 'No milestone' },
    { id: 'archived', label: 'Archived' },
  ];

  const statusOptions = [
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
    { id: 'paused', label: 'Paused' },
  ];

  const creatorOptions = users.map(user => ({ id: user.id.toString(), label: user.name }));

  const columnOptions = [
    { id: 'name', label: 'Name' },
    { id: 'description', label: 'Description' },
    { id: 'progress', label: 'Progress' },
    { id: 'issues', label: 'Issues' },
    { id: 'leader', label: 'Leader' },
  ];

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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChip = selectedChip === 'all' || 
      (selectedChip === 'milestone' && project.milestones.length > 0) ||
      (selectedChip === 'no-milestone' && project.milestones.length === 0) ||
      (selectedChip === 'archived' && project.status === 4);
    const matchesStatus = !selectedStatus || (selectedStatus === 'completed' ? project.status === 4 : project.status !== 4);
    const matchesCreator = !selectedCreator || project.leaderId.toString() === selectedCreator;
    return matchesSearch && matchesChip && matchesStatus && matchesCreator;
  });

  const toggleColumn = (columnId: string) => {
    setEnabledColumns(prev => ({
      ...prev,
      [columnId]: !prev[columnId as keyof typeof prev],
    }));
  };

  const toggleMember = (userId: string) => {
    setNewProject(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter(id => id !== userId)
        : [...prev.memberIds, userId],
    }));
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      addToast('error', 'Please enter a project name');
      return;
    }

    setIsLoading(true);
    try {
      const statusOption = projectStatusOptions.find(s => s.id === newProject.status);
      const priorityOption = projectPriorityOptions.find(p => p.id === newProject.priority);

      const milestoneData = milestones.map(m => ({
        name: m.name,
        description: m.description,
        dueDate: m.dueDate || undefined,
      }));

      const projectData = {
        name: newProject.name,
        summary: newProject.summary,
        description: newProject.description,
        status: statusOption?.value || 1,
        priority: priorityOption?.value || 0,
        leaderId: parseInt(newProject.leaderId),
        memberIds: newProject.memberIds.map(id => parseInt(id)),
        startDate: newProject.startDate || undefined,
        endDate: newProject.endDate || undefined,
        milestones: milestoneData.length > 0 ? milestoneData : undefined,
      };

      await projectApi.createProject(projectData);
      addToast('success', 'Project created successfully');
      
      setShowCreateDialog(false);
      setNewProject({
        name: '',
        summary: '',
        description: '',
        status: 'backlog',
        priority: 'no_priority',
        leaderId: '1',
        memberIds: [],
        startDate: '',
        endDate: '',
        labels: [],
      });
      setMilestones([]);
      fetchProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
      if (error instanceof Error) {
        addToast('error', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    setMilestones(prev => prev.filter(m => m.id !== milestoneId));
  };

  const handleAddMilestone = () => {
    if (!newMilestone.name.trim()) {
      addToast('error', 'Please enter a milestone name');
      return;
    }
    const newMilestoneItem = {
      id: Date.now().toString(),
      name: newMilestone.name,
      dueDate: newMilestone.dueDate,
      description: newMilestone.description,
    };
    setMilestones(prev => [...prev, newMilestoneItem]);
    setShowMilestoneForm(false);
    setNewMilestone({ name: '', description: '', dueDate: '' });
  };

  const getStatusIcon = (status: number) => {
    const option = projectStatusOptions.find(s => s.value === status);
    if (option) {
      const Icon = option.icon;
      return <Icon className="w-3 h-3" />;
    }
    return null;
  };

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-2 pb-2 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-800">Projects</h1>
          <div className="relative group">
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center justify-center w-6 h-6 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Create a new project
              </div>
            </div>
          </div>
        </div>

        {/* Filter Area */}
        <div className="mb-2 pb-2 border-b border-gray-200 flex items-center justify-between">
          {/* Chips Filters */}
          <div className="flex items-center gap-1">
            {chipOptions.map((chip) => (
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
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</p>
                    <div className="space-y-1">
                      {statusOptions.map((status) => (
                        <label
                          key={status.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                        >
                          <input
                            type="radio"
                            name="status"
                            value={status.id}
                            checked={selectedStatus === status.id}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{status.label}</span>
                        </label>
                      ))}
                      <label
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                      >
                        <input
                          type="radio"
                          name="status"
                          value=""
                          checked={selectedStatus === null}
                          onChange={() => setSelectedStatus(null)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">All</span>
                      </label>
                    </div>
                  </div>

                  {/* Creator Filter */}
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Creator</p>
                    <div className="space-y-1">
                      {creatorOptions.map((creator) => (
                        <label
                          key={creator.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                        >
                          <input
                            type="radio"
                            name="creator"
                            value={creator.id}
                            checked={selectedCreator === creator.id}
                            onChange={(e) => setSelectedCreator(e.target.value)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{creator.label}</span>
                        </label>
                      ))}
                      <label
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                      >
                        <input
                          type="radio"
                          name="creator"
                          value=""
                          checked={selectedCreator === null}
                          onChange={() => setSelectedCreator(null)}
                          className="w-4 h-4 text-blue-600"
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
                        setSelectedCreator(null);
                      }}
                      className="w-full text-left px-2 py-1 text-sm text-red-600 hover:bg-gray-50 rounded"
                    >
                      Reset filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Columns Button with Dropdown */}
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

              {/* Columns Dropdown */}
              {showColumnsDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Columns</p>
                    <div className="space-y-1">
                      {columnOptions.map((column) => (
                        <label
                          key={column.id}
                          className="flex items-center justify-between cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                        >
                          <span className="text-sm text-gray-700">{column.label}</span>
                          <button
                            type="button"
                            onClick={() => toggleColumn(column.id)}
                            className={`w-4 h-4 rounded flex items-center justify-center ${
                              enabledColumns[column.id as keyof typeof enabledColumns]
                                ? 'bg-gray-600 text-white'
                                : 'border border-gray-300'
                            }`}
                          >
                            {enabledColumns[column.id as keyof typeof enabledColumns] && (
                              <Check className="w-3 h-3" />
                            )}
                          </button>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="flex-1 overflow-y-auto">
          <div className="min-w-full">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  {enabledColumns.name && (
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  )}
                  {enabledColumns.description && (
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                  )}
                  {enabledColumns.progress && (
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Progress</th>
                  )}
                  {enabledColumns.issues && (
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Issues</th>
                  )}
                  {enabledColumns.leader && (
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Leader</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    {enabledColumns.name && (
                      <td className="px-3 py-2">
                        <span className="text-sm font-medium text-gray-800">{project.name}</span>
                      </td>
                    )}
                    {enabledColumns.description && (
                      <td className="px-3 py-2">
                        <span className="text-sm text-gray-500">{project.summary || project.description || 'No description'}</span>
                      </td>
                    )}
                    {enabledColumns.progress && (
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-32 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-gray-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 w-10 text-right">{project.progress}%</span>
                        </div>
                      </td>
                    )}
                    {enabledColumns.issues && (
                      <td className="px-3 py-2">
                        <span className="text-sm text-gray-500">{project.openIssues}/{project.issueCount}</span>
                      </td>
                    )}
                    {enabledColumns.leader && (
                      <td className="px-3 py-2">
                        <span className="text-sm text-gray-600">{project.leaderName}</span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProjects.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No projects found
              </div>
            )}
          </div>
        </div>

        {/* Create Project Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[80vh] flex flex-col">
              {/* Dialog Header - Fixed */}
              <div className="flex items-center justify-between px-6 py-3">
                <h2 className="text-base font-semibold text-gray-800">Create new project</h2>
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dialog Content - Scrollable */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto flex flex-col">
                <div className="flex-1 px-6 py-4 space-y-4">
                  <div className="space-y-2">
                    {/* Project Name */}
                    <div>
                      <input
                        type="text"
                        placeholder="Project name"
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        className="w-full text-base font-semibold border-0 px-0 py-0 focus:ring-0 focus:outline-none"
                      />
                    </div>

                    {/* Summary */}
                    <div>
                      <input
                        type="text"
                        placeholder="Add a short summary for this project"
                        value={newProject.summary}
                        onChange={(e) => setNewProject({ ...newProject, summary: e.target.value })}
                        className="w-full border-0 px-0 py-0 text-sm focus:ring-0 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Chips Row */}
                  <div className="flex flex-wrap gap-2 relative z-10">
                  {/* Status */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStatusDropdown(!showStatusDropdown);
                        setShowPriorityDropdown(false);
                        setShowLeaderDropdown(false);
                        setShowMembersDropdown(false);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs hover:bg-gray-200"
                    >
                      {(() => {
                        const status = projectStatusOptions.find(s => s.id === newProject.status);
                        if (status) {
                          const Icon = status.icon;
                          return (
                            <>
                              <Icon className="w-3 h-3" />
                              {status.label}
                            </>
                          );
                        }
                        return 'Status';
                      })()}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {showStatusDropdown && (
                      <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30">
                        {projectStatusOptions.map((status) => {
                          const Icon = status.icon;
                          return (
                            <button
                              key={status.id}
                              onClick={() => {
                                setNewProject({ ...newProject, status: status.id });
                                setShowStatusDropdown(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 flex items-center gap-2 ${
                                newProject.status === status.id ? 'bg-gray-100' : ''
                              }`}
                            >
                              <Icon className="w-3 h-3 text-gray-400" />
                              {status.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Priority */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPriorityDropdown(!showPriorityDropdown);
                        setShowStatusDropdown(false);
                        setShowLeaderDropdown(false);
                        setShowMembersDropdown(false);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs hover:bg-gray-200"
                    >
                      {(() => {
                        const priority = projectPriorityOptions.find(p => p.id === newProject.priority);
                        if (priority) {
                          const Icon = priority.icon;
                          return (
                            <>
                              <Icon className="w-3 h-3" />
                              {priority.label}
                            </>
                          );
                        }
                        return 'Priority';
                      })()}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {showPriorityDropdown && (
                      <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30">
                        {projectPriorityOptions.map((priority) => {
                          const Icon = priority.icon;
                          return (
                            <button
                              key={priority.id}
                              onClick={() => {
                                setNewProject({ ...newProject, priority: priority.id });
                                setShowPriorityDropdown(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 flex items-center gap-2 ${
                              newProject.priority === priority.id ? 'bg-gray-100' : ''
                            }`}
                            >
                              <Icon className="w-3 h-3 text-gray-400" />
                              {priority.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Leader */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLeaderDropdown(!showLeaderDropdown);
                        setShowStatusDropdown(false);
                        setShowPriorityDropdown(false);
                        setShowMembersDropdown(false);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs hover:bg-gray-200"
                    >
                      <User className="w-3 h-3" />
                      {users.find(u => u.id.toString() === newProject.leaderId)?.name || 'Leader'}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {showLeaderDropdown && (
                      <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30">
                        {users.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => {
                              setNewProject({ ...newProject, leaderId: user.id.toString() });
                              setShowLeaderDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 ${
                              newProject.leaderId === user.id.toString() ? 'bg-gray-100' : ''
                            }`}
                          >
                            {user.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Members */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMembersDropdown(!showMembersDropdown);
                        setShowStatusDropdown(false);
                        setShowPriorityDropdown(false);
                        setShowLeaderDropdown(false);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs hover:bg-gray-200"
                    >
                      <Users className="w-3 h-3" />
                      Members ({newProject.memberIds.length})
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {showMembersDropdown && (
                      <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30">
                        {users.map((user) => (
                          <label key={user.id} className="flex items-center gap-2 px-3 py-1 cursor-pointer hover:bg-gray-100">
                            <input
                              type="checkbox"
                              checked={newProject.memberIds.includes(user.id.toString())}
                              onChange={() => toggleMember(user.id.toString())}
                              className="w-4 h-4"
                            />
                            <span className="text-xs">{user.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Start */}
                  <button
                    type="button"
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs hover:bg-gray-200"
                    onClick={() => (document.getElementById('start-date-input') as HTMLInputElement)?.showPicker()}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>{newProject.startDate || 'Start'}</span>
                    <input
                      id="start-date-input"
                      type="date"
                      value={newProject.startDate}
                      onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                      className="sr-only"
                    />
                  </button>

                  {/* Target */}
                  <button
                    type="button"
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs hover:bg-gray-200"
                    onClick={() => (document.getElementById('target-date-input') as HTMLInputElement)?.showPicker()}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>{newProject.endDate || 'Target'}</span>
                    <input
                      id="target-date-input"
                      type="date"
                      value={newProject.endDate}
                      onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                      className="sr-only"
                    />
                  </button>

                  {/* Labels */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs">
                    <Tag className="w-3 h-3" />
                    <span>Labels</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <RichTextEditor
                    value={newProject.description}
                    onChange={(content) => setNewProject({ ...newProject, description: content })}
                    placeholder="Write a project introduction, or other useful information...."
                    className="border-0"
                  />
                </div>
              </div>
              
            {/* Milestone Area - At the bottom */}
            <div ref={milestoneRef} className="px-6 pb-4">
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                {/* Milestone Title */}
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm font-medium text-gray-700">Milestone</span>
                  {!showMilestoneForm && (
                    <button
                      onClick={() => {
                        setShowMilestoneForm(true);
                        setNewMilestone({ name: '', description: '', dueDate: '' });
                      }}
                      className="flex items-center justify-center w-6 h-6 bg-white border border-gray-200 rounded hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Milestone List */}
                <div className="px-4">
                  {milestones.length > 0 && (
                    <div className="space-y-0.5">
                      {milestones.map((milestone) => (
                        <div key={milestone.id} className="flex items-center justify-between py-1.5">
                          <span className="text-sm text-gray-800">{milestone.name}</span>
                          <div className="flex items-center gap-2">
                            {milestone.dueDate ? (
                              <span className="text-xs text-gray-500">{milestone.dueDate}</span>
                            ) : (
                              <button
                                onClick={() => (document.getElementById(`milestone-date-${milestone.id}`) as HTMLInputElement)?.showPicker()}
                                className="p-1 hover:bg-white rounded"
                              >
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              </button>
                            )}
                            <input
                              id={`milestone-date-${milestone.id}`}
                              type="date"
                              value={milestone.dueDate}
                              onChange={(e) => {
                                setMilestones(prev => prev.map(m => 
                                  m.id === milestone.id ? { ...m, dueDate: e.target.value } : m
                                ));
                              }}
                              className="sr-only"
                            />
                            <button
                              onClick={() => handleDeleteMilestone(milestone.id)}
                              className="p-1 hover:bg-white rounded"
                            >
                              <X className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Milestone Form */}
                {showMilestoneForm && (
                  <div className="px-4 py-3 space-y-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Milestone name"
                        value={newMilestone.name}
                        onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-0 focus:outline-none focus:border-gray-300"
                      />
                      <button
                        className="flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                        onClick={() => (document.getElementById('new-milestone-due-date') as HTMLInputElement)?.showPicker()}
                      >
                        <Calendar className="w-4 h-4 text-gray-500" />
                      </button>
                      <input
                        id="new-milestone-due-date"
                        type="date"
                        value={newMilestone.dueDate}
                        onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                        className="sr-only"
                      />
                    </div>

                    <textarea
                      placeholder="Description..."
                      value={newMilestone.description}
                      onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-0 focus:outline-none focus:border-gray-300 resize-none"
                      rows={2}
                    />

                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setShowMilestoneForm(false);
                          setNewMilestone({ name: '', description: '', dueDate: '' });
                        }}
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
              </div>
            </div>
          </div>

          {/* Dialog Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button
              onClick={() => setShowCreateDialog(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateProject}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create project'}
            </button>
          </div>
        </div>
      </div>
    )}
      </div>
    </Layout>
  );
}