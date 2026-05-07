import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';
import { mockIssues, statusLabels, priorityLabels, typeLabels } from '@/data/mockData';
import { Plus, Filter, ChevronDown } from 'lucide-react';
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

const statusColors: Record<string, string> = {
  backlog: 'bg-gray-100 text-gray-600',
  todo: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  testing: 'bg-purple-100 text-purple-700',
  done: 'bg-green-100 text-green-700',
  canceled: 'bg-red-100 text-red-700',
  duplicate: 'bg-gray-100 text-gray-600',
  reported: 'bg-orange-100 text-orange-700',
  triaged: 'bg-cyan-100 text-cyan-700',
  resolved: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  implemented: 'bg-green-100 text-green-700',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export default function Issues() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChip, setSelectedChip] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const chipOptions = [
    { id: 'all', label: 'All issues' },
    { id: 'open', label: 'Open' },
    { id: 'my', label: 'My issues' },
    { id: 'recent', label: 'Recent' },
  ];

  const statuses = Array.from(new Set(mockIssues.map(issue => issue.status)));
  const priorities = ['low', 'medium', 'high', 'critical'];

  const filteredIssues = mockIssues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChip = selectedChip === 'all' || 
      (selectedChip === 'open' && issue.status !== 'done' && issue.status !== 'canceled' && issue.status !== 'duplicate' && issue.status !== 'resolved') ||
      (selectedChip === 'my' && issue.assigneeId === 1) ||
      (selectedChip === 'recent' && true);
    const matchesStatus = !selectedStatus || issue.status === selectedStatus;
    const matchesPriority = !selectedPriority || issue.priority === selectedPriority;
    return matchesSearch && matchesChip && matchesStatus && matchesPriority;
  });

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-2 pb-2 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-800">Issues</h1>
          <button className="flex items-center justify-center w-6 h-6 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
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

          {/* Filter Button with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
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
                    {statuses.map((status) => (
                      <label
                        key={status}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                      >
                        <input
                          type="radio"
                          name="status"
                          value={status}
                          checked={selectedStatus === status}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{statusLabels[status]}</span>
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

                {/* Priority Filter */}
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Priority</p>
                  <div className="space-y-1">
                    {priorities.map((priority) => (
                      <label
                        key={priority}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                      >
                        <input
                          type="radio"
                          name="priority"
                          value={priority}
                          checked={selectedPriority === priority}
                          onChange={(e) => setSelectedPriority(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{priorityLabels[priority]}</span>
                      </label>
                    ))}
                    <label
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                    >
                      <input
                        type="radio"
                        name="priority"
                        value=""
                        checked={selectedPriority === null}
                        onChange={() => setSelectedPriority(null)}
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
                      setSelectedPriority(null);
                    }}
                    className="w-full text-left px-2 py-1 text-sm text-red-600 hover:bg-gray-50 rounded"
                  >
                    Reset filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Issue</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Type</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Priority</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredIssues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-gray-500">#{issue.id}</span>
                          <span className="font-medium text-gray-800">{issue.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600">{typeLabels[issue.type]}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[issue.priority]}`}>
                          {priorityLabels[issue.priority]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[issue.status]}`}>
                          {statusLabels[issue.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600">{issue.dueDate}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
