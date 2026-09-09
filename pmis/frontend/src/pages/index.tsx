import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout/Layout';
import { issueApi, projectApi, type IssueResponse, type ProjectResponse } from '@/services/api';
import { retroApi, type BoardDTO } from '@/services/retroApi';
import { Plus, Clock, AlertCircle, CheckCircle2, MessageSquare, ArrowRight } from 'lucide-react';
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

export default function Dashboard() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { isAuthenticated, loading: authLoading, logout, user } = useAuth();
  const dateLocale = i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US';

  const statusLabels: Record<number, string> = {
    1: t('common.statusBacklog'),
    2: t('common.statusTodo'),
    3: t('common.statusInProgress'),
    4: t('common.statusDone'),
    5: t('common.statusCanceled'),
    6: t('common.statusDuplicated'),
  };
  const priorityLabels: Record<number, string> = {
    0: t('common.priorityNone'),
    1: t('common.priorityUrgent'),
    2: t('common.priorityHigh'),
    3: t('common.priorityMedium'),
    4: t('common.priorityLow'),
  };
  const [issues, setIssues] = useState<IssueResponse[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [retroBoards, setRetroBoards] = useState<BoardDTO[]>([]);
  const [retroLoading, setRetroLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?reason=not-logged-in');
      return;
    }

    if (!authLoading && isAuthenticated) {
      const fetchData = async () => {
        if (!user?.id) return;
        
        try {
          const [issuesData, projectsData] = await Promise.all([
            issueApi.getIssuesForUser(Number(user.id)),
            projectApi.getProjectsForUser(Number(user.id)),
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

        // 最近回顾会：独立请求，失败不影响原有区块
        try {
          const boards = await retroApi.listBoards('joined');
          setRetroBoards(boards);
        } catch (error: any) {
          console.error('Failed to fetch retro boards:', error);
          setRetroBoards([]);
        } finally {
          setRetroLoading(false);
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
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.totalIssues')}</p>
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
                <p className="text-sm text-gray-500">{t('dashboard.inProgress')}</p>
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
                <p className="text-sm text-gray-500">{t('dashboard.completed')}</p>
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
                <p className="text-sm text-gray-500">{t('dashboard.totalProjects')}</p>
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
              <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.recentIssues')}</h2>
            </div>
            <div className="divide-y">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : issues.length === 0 ? (
                <div className="p-8 text-center text-gray-500">{t('dashboard.noIssues')}</div>
              ) : (
                issues.slice(0, 5).map(issue => (
                  <div key={issue.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{issue.title}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[issue.statusId] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[issue.statusId] || t('common.unknown')}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span>{t('common.priorityLabel')}: <span className={`px-1.5 py-0.5 rounded ${priorityColors[issue.priorityId || 0] || 'bg-gray-100 text-gray-600'}`}>{priorityLabels[issue.priorityId || 0] || t('common.priorityNone')}</span></span>
                      <span>{t('common.assigneeLabel')}: {issue.assigneeName || t('common.unassigned')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.activeProjects')}</h2>
            </div>
            <div className="divide-y">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : projects.length === 0 ? (
                <div className="p-8 text-center text-gray-500">{t('dashboard.noProjects')}</div>
              ) : (
                projects.slice(0, 5).map(project => (
                  <div key={project.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{project.name}</span>
                      <span className="text-sm text-gray-500">{project.statusLabel}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{project.summary}</p>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span>{t('common.leaderLabel')}: {project.leaderName}</span>
                      <span>{t('common.issuesLabel')}: {project.issueCount}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.recentRetros')}</h2>
            <button
              onClick={() => router.push('/retro')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y">
            {retroLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : retroBoards.length === 0 ? (
              <div className="p-8 text-center text-gray-500">{t('dashboard.noRetros')}</div>
            ) : (
              retroBoards.slice(0, 5).map(board => (
                <div
                  key={board.id}
                  onClick={() => router.push(`/retro/${board.id}`)}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-900 truncate">{board.title}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded shrink-0 ${board.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {board.status === 'ACTIVE' ? t('dashboard.active') : t('dashboard.ended')}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                    {board.teamName && <span>{t('common.team')}: {board.teamName}</span>}
                    <span>{t('dashboard.retroHost')}: {board.ownerName}</span>
                    <span>{t('dashboard.retroParticipants')}: {board.participantCount ?? 0}</span>
                    <span>{t('dashboard.retroCards')}: {board.cardCount ?? 0}</span>
                    {board.updatedAt && <span>{t('common.updatedAt', { time: new Date(board.updatedAt).toLocaleString(dateLocale) })}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}