import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';
import { mockIssues, mockProjects, statusLabels, priorityLabels, typeLabels } from '@/data/mockData';
import { Plus, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

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

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const today = new Date().toISOString().split('T')[0];
  const todayIssues = mockIssues.filter(issue => issue.dueDate === today);
  const overdueIssues = mockIssues.filter(issue => issue.dueDate < today && issue.status !== 'done');
  const openIssues = mockIssues.filter(issue => issue.status !== 'done');

  return (
    <Layout>
      {/* Welcome Banner */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today&apos;s Tasks</p>
              <p className="text-2xl font-bold text-gray-800">{todayIssues.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Open Issues</p>
              <p className="text-2xl font-bold text-gray-800">{openIssues.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overdueIssues.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">What&apos;s Next</h2>
          <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
            <Plus className="w-4 h-4" />
            New Issue
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {mockIssues.slice(0, 3).map((issue) => (
            <div key={issue.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-gray-500">#{issue.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[issue.status]}`}>
                      {statusLabels[issue.status]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[issue.priority]}`}>
                      {priorityLabels[issue.priority]}
                    </span>
                  </div>
                  <p className="font-medium text-gray-800 truncate">{issue.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{typeLabels[issue.type]} | Due: {issue.dueDate}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All Issues →
          </button>
        </div>
      </div>

      {/* My Projects */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">My Projects</h2>
          <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {mockProjects.slice(0, 2).map((project) => (
            <div key={project.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-800">{project.name}</h3>
                <span className="text-sm text-gray-500">{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">
                Leader: {project.leaderName} | {project.openIssues}/{project.issueCount} open issues
              </p>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All Projects →
          </button>
        </div>
      </div>
    </Layout>
  );
}
