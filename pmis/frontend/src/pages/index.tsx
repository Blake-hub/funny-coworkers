import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';
import { issueApi, projectApi, type IssueResponse, type ProjectResponse } from '@/services/api';
import { Plus, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<{}>> {
  const token = context.req.cookies['pmis-token'];

  if (!token) {
    return {
      redirect: {
        destination: '/login?reason=not-logged-in',
        permanent: false,
      },
    };
  }

  const validationResult = validateToken(token);

  if (!validationResult.isValid) {
    return {
      redirect: {
        destination: `/login?reason=${validationResult.reason}`,
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}

function validateToken(token: string): { isValid: boolean; reason: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false, reason: 'invalid-token' };
    }

    let payloadStr = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (payloadStr.length % 4) {
      payloadStr += '=';
    }

    const payload = JSON.parse(Buffer.from(payloadStr, 'base64').toString('utf-8'));

    if (!payload || !payload.sub || typeof payload.exp !== 'number') {
      return { isValid: false, reason: 'invalid-token' };
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTime) {
      return { isValid: false, reason: 'session-expired' };
    }

    return { isValid: true, reason: 'valid' };
  } catch {
    return { isValid: false, reason: 'invalid-token' };
  }
}

const statusColors: Record<number, string> = {
  1: 'bg-gray-100 text-gray-600',
  2: 'bg-yellow-100 text-yellow-700',
  3: 'bg-blue-100 text-blue-700',
  4: 'bg-green-100 text-green-700',
  5: 'bg-red-100 text-red-700',
  6: 'bg-gray-100 text-gray-600',
};

const priorityColors: Record<number, string> = {
  0: 'bg-gray-100 text-gray-600',
  1: 'bg-red-100 text-red-700',
  2: 'bg-orange-100 text-orange-700',
  3: 'bg-yellow-100 text-yellow-700',
  4: 'bg-blue-100 text-blue-700',
};

const statusLabels: Record<number, string> = {
  1: 'Backlog',
  2: 'Todo',
  3: 'In Progress',
  4: 'Done',
  5: 'Canceled',
  6: 'Duplicated',
};

const priorityLabels: Record<number, string> = {
  0: 'No Priority',
  1: 'Urgent',
  2: 'High',
  3: 'Medium',
  4: 'Low',
};

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const [issues, setIssues] = useState<IssueResponse[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?reason=not-logged-in');
      return;
    }

    if (!authLoading && isAuthenticated) {
      const fetchData = async () => {
        try {
          const [issuesData, projectsData] = await Promise.all([
            issueApi.getAllIssues(),
            projectApi.getAllProjects(),
          ]);
          setIssues(issuesData);
          setProjects(projectsData);
        } catch (error: any) {
          console.error('Failed to fetch data:', error);

          if (error.message?.includes('401') || error.message?.includes('Unauthorized') || error.message?.includes('Invalid credentials')) {
            console.log('Authentication error - clearing invalid token and redirecting');
            localStorage.removeItem('pmis-token');
            localStorage.removeItem('pmis-user');
            document.cookie = 'pmis-token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
            window.location.href = '/login?reason=auth-error';
            return;
          }

          setIssues([]);
          setProjects([]);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [isAuthenticated, authLoading, router, logout]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inProgressCount = issues.filter(i => i.statusId === 3).length;
  const doneCount = issues.filter(i => i.statusId === 4).length;

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your project management activities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Issues</p>
                <p className="text-2xl font-bold text-gray-900">{issues.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inProgressCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {doneCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Plus className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Recent Issues</h2>
            </div>
            <div className="divide-y">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : issues.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No issues found</div>
              ) : (
                issues.slice(0, 5).map(issue => (
                  <div key={issue.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{issue.title}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[issue.statusId] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[issue.statusId] || 'Unknown'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span>Priority: <span className={`px-1.5 py-0.5 rounded ${priorityColors[issue.priorityId || 0] || 'bg-gray-100 text-gray-600'}`}>{priorityLabels[issue.priorityId || 0] || 'No Priority'}</span></span>
                      <span>Assignee: {issue.assigneeName || 'Unassigned'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Active Projects</h2>
            </div>
            <div className="divide-y">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : projects.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No projects found</div>
              ) : (
                projects.slice(0, 5).map(project => (
                  <div key={project.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{project.name}</span>
                      <span className="text-sm text-gray-500">{project.statusLabel}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{project.summary}</p>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span>Leader: {project.leaderName}</span>
                      <span>Issues: {project.issueCount}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}