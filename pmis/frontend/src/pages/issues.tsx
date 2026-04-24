import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';
import { mockIssues, statusLabels, priorityLabels, typeLabels } from '@/data/mockData';
import { Plus, Filter, Search } from 'lucide-react';

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
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const filteredIssues = mockIssues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statuses = Array.from(new Set(mockIssues.map(issue => issue.status)));

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Issues</h1>
        <p className="text-gray-500 mt-1">Manage and track your assigned issues.</p>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{statusLabels[status]}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            New Issue
          </button>
        </div>
      </div>

      {/* Issues List */}
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
    </Layout>
  );
}
