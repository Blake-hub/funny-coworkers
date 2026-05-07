import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';
import { mockProjects, mockUsers } from '@/data/mockData';
import { Plus, Filter, ChevronDown, Settings, Check, X, Calendar, User, Users, Tag } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChip, setSelectedChip] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);

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

  const creatorOptions = [
    { id: '1', label: 'John Doe' },
    { id: '2', label: 'Sarah Smith' },
  ];

  const columnOptions = [
    { id: 'name', label: 'Name' },
    { id: 'description', label: 'Description' },
    { id: 'progress', label: 'Progress' },
    { id: 'issues', label: 'Issues' },
    { id: 'leader', label: 'Leader' },
  ];

  const projectStatusOptions = [
    { id: 'backlog', label: 'Backlog', value: 1 },
    { id: 'planned', label: 'Planned', value: 2 },
    { id: 'in_progress', label: 'In Process', value: 3 },
    { id: 'completed', label: 'Completed', value: 4 },
    { id: 'canceled', label: 'Canceled', value: 5 },
  ];

  const projectPriorityOptions = [
    { id: 'no_priority', label: 'No priority', value: 0 },
    { id: 'urgent', label: 'Urgent', value: 1 },
    { id: 'high', label: 'High', value: 2 },
    { id: 'medium', label: 'Medium', value: 3 },
    { id: 'low', label: 'Low', value: 4 },
  ];

  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChip = selectedChip === 'all' || 
      (selectedChip === 'milestone' && project.progress > 0) ||
      (selectedChip === 'no-milestone' && project.progress === 0) ||
      (selectedChip === 'archived' && project.progress === 100);
    const matchesStatus = !selectedStatus || (selectedStatus === 'completed' ? project.progress === 100 : project.progress < 100);
    const matchesCreator = !selectedCreator || project.leaderId === selectedCreator;
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

  const handleCreateProject = () => {
    // Create new project logic here
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
                        <span className="text-sm text-gray-500">{project.description}</span>
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
          </div>
        </div>

        {/* Create Project Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
              {/* Dialog Header */}
              <div className="flex items-center justify-between px-6 py-3">
                <h2 className="text-base font-semibold text-gray-800">Create new project</h2>
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dialog Content */}
              <div className="px-6 py-4 space-y-4">
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

                {/* Chips Row */}
                <div className="flex flex-wrap gap-2 relative z-10">
                  {/* Status */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowStatusDropdown(!showStatusDropdown);
                        setShowPriorityDropdown(false);
                        setShowLeaderDropdown(false);
                        setShowMembersDropdown(false);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs hover:bg-gray-200"
                    >
                      {projectStatusOptions.find(s => s.id === newProject.status)?.label || 'Status'}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {showStatusDropdown && (
                      <div className="absolute left-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30">
                        {projectStatusOptions.map((status) => (
                          <button
                            key={status.id}
                            onClick={() => {
                              setNewProject({ ...newProject, status: status.id });
                              setShowStatusDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 ${
                              newProject.status === status.id ? 'bg-gray-100' : ''
                            }`}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Priority */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowPriorityDropdown(!showPriorityDropdown);
                        setShowStatusDropdown(false);
                        setShowLeaderDropdown(false);
                        setShowMembersDropdown(false);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs hover:bg-gray-200"
                    >
                      {projectPriorityOptions.find(p => p.id === newProject.priority)?.label || 'Priority'}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {showPriorityDropdown && (
                      <div className="absolute left-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30">
                        {projectPriorityOptions.map((priority) => (
                          <button
                            key={priority.id}
                            onClick={() => {
                              setNewProject({ ...newProject, priority: priority.id });
                              setShowPriorityDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 ${
                              newProject.priority === priority.id ? 'bg-gray-100' : ''
                            }`}
                          >
                            {priority.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Leader */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowLeaderDropdown(!showLeaderDropdown);
                        setShowStatusDropdown(false);
                        setShowPriorityDropdown(false);
                        setShowMembersDropdown(false);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs hover:bg-gray-200"
                    >
                      <User className="w-3 h-3" />
                      Leader
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {showLeaderDropdown && (
                      <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30">
                        {mockUsers.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => {
                              setNewProject({ ...newProject, leaderId: user.id });
                              setShowLeaderDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 ${
                              newProject.leaderId === user.id ? 'bg-gray-100' : ''
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
                      onClick={() => {
                        setShowMembersDropdown(!showMembersDropdown);
                        setShowStatusDropdown(false);
                        setShowPriorityDropdown(false);
                        setShowLeaderDropdown(false);
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs hover:bg-gray-200"
                    >
                      <Users className="w-3 h-3" />
                      Members
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {showMembersDropdown && (
                      <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30">
                        {mockUsers.map((user) => (
                          <label key={user.id} className="flex items-center gap-2 px-3 py-1 cursor-pointer hover:bg-gray-100">
                            <input
                              type="checkbox"
                              checked={newProject.memberIds.includes(user.id)}
                              onChange={() => toggleMember(user.id)}
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

                {/* Divider */}
                <div className="border-t border-gray-200" />

                {/* Description */}
                <div>
                  <textarea
                    placeholder="Describe the project's goal, backgroud, or other usefull information..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full h-40 border-0 p-0 text-sm focus:ring-0 focus:outline-none resize-none"
                  />
                </div>

                {/* Milestones Bar */}
                <div className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-3">
                  <span className="text-sm text-gray-700">Milestone</span>
                  <button className="flex items-center justify-center w-6 h-6 bg-white border border-gray-200 rounded hover:bg-gray-50">
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
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
                  className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                >
                  Create project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
