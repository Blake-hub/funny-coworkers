import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Layout from '@/components/Layout/Layout';
import { retroApi, type BoardDTO, type BoardView, type BoardStatus } from '@/services/retroApi';
import { userApi, teamApi, type UserResponse, type TeamResponse } from '@/services/api';
import { Plus, Search, X, Users, MessageSquare, ChevronDown, Filter } from 'lucide-react';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<{}>> {
  const token = context.req.cookies['pmis-token'];
  if (!token) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  return { props: {} };
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const AVATAR_COLORS = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500'];

function getAvatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return d.toLocaleDateString('zh-CN');
}

export default function RetroListPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { addToast } = useToast();

  const STATUS_TABS: { id: BoardStatus | 'all'; label: string }[] = [
    { id: 'ACTIVE', label: t('retro.list.tabActive') },
    { id: 'ENDED', label: t('retro.list.tabEnded') },
  ];

  const VIEW_CHIPS: { id: BoardView; label: string }[] = [
    { id: 'joined', label: t('retro.list.viewJoined') },
    { id: 'owned', label: t('retro.list.viewOwned') },
    { id: 'all', label: t('retro.list.viewAll') },
  ];

  const [boards, setBoards] = useState<BoardDTO[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<BoardView>('joined');
  const [statusTab, setStatusTab] = useState<BoardStatus | 'all'>('ACTIVE');
  const [teamFilter, setTeamFilter] = useState<number | null>(null);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    teamId: '' as string | number,
    participantUserIds: [] as number[],
  });
  const [showParticipantDropdown, setShowParticipantDropdown] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchBoards();
      fetchUsers();
      fetchTeams();
    }
  }, [authLoading, isAuthenticated, view]);

  useEffect(() => {
    // Handle ?new=1 from sidebar + button
    if (router.query.new === '1' && !showCreateDialog) {
      setShowCreateDialog(true);
    }
  }, [router.query.new]);

  // Prefill participants from selected team
  useEffect(() => {
    if (!createForm.teamId) return;
    const teamId = Number(createForm.teamId);
    if (!teamId) return;
    const prefillFromTeam = async () => {
      try {
        const members = await teamApi.getTeamMembers(teamId);
        // Pre-select all team members except current user as participants
        const currentUserId = Number(user?.id);
        const ids = members
          .filter((m) => Number(m.id) !== currentUserId)
          .map((m) => Number(m.id));
        setCreateForm((prev) => ({ ...prev, participantUserIds: ids }));
      } catch (error) {
        console.error('Failed to prefill team members:', error);
      }
    };
    prefillFromTeam();
  }, [createForm.teamId]);

  useEffect(() => {
    const closeDropdowns = () => {
      setShowTeamDropdown(false);
      setShowParticipantDropdown(false);
    };
    document.addEventListener('click', closeDropdowns);
    return () => document.removeEventListener('click', closeDropdowns);
  }, []);

  const fetchBoards = async () => {
    setIsLoading(true);
    try {
      const data = await retroApi.listBoards(view);
      setBoards(data);
    } catch (error) {
      console.error('Failed to fetch boards:', error);
      if (error instanceof Error) addToast('error', error.message);
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

  const fetchTeams = async () => {
    if (!user?.id) return;
    try {
      const data = await teamApi.getTeamsForUser(Number(user.id));
      setTeams(data);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    }
  };

  const filteredBoards = boards.filter((b) => {
    const matchSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusTab === 'all' || b.status === statusTab;
    const matchTeam = teamFilter == null || b.teamId === teamFilter;
    return matchSearch && matchStatus && matchTeam;
  });

  const handleCreate = async () => {
    if (!createForm.title.trim()) {
      addToast('error', t('retro.create.titleRequired'));
      return;
    }
    setCreating(true);
    try {
      const req = {
        title: createForm.title.trim(),
        description: createForm.description || undefined,
        teamId: createForm.teamId ? Number(createForm.teamId) : undefined,
        participantUserIds: createForm.participantUserIds.length > 0 ? createForm.participantUserIds : undefined,
      };
      const board = await retroApi.createBoard(req);
      addToast('success', t('common.created'));
      setShowCreateDialog(false);
      setCreateForm({ title: '', description: '', teamId: '', participantUserIds: [] });
      // Navigate to detail page
      router.push(`/retro/${board.id}`);
    } catch (error) {
      console.error('Failed to create board:', error);
      if (error instanceof Error) addToast('error', error.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleParticipant = (userId: number) => {
    setCreateForm((prev) => ({
      ...prev,
      participantUserIds: prev.participantUserIds.includes(userId)
        ? prev.participantUserIds.filter((id) => id !== userId)
        : [...prev.participantUserIds, userId],
    }));
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('retro.list.deleteConfirm'))) return;
    try {
      await retroApi.deleteBoard(id);
      addToast('success', t('retro.list.deleted'));
      fetchBoards();
    } catch (error) {
      if (error instanceof Error) addToast('error', error.message);
    }
  };

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-2 pb-2 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-600" />
            <h1 className="text-base font-semibold text-gray-800">{t('retro.list.title')}</h1>
          </div>
          <div className="relative group">
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center justify-center w-6 h-6 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {t('retro.create.title')}
              </div>
            </div>
          </div>
        </div>

        {/* Search + View Chips */}
        <div className="mb-2 pb-2 border-b border-gray-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {VIEW_CHIPS.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setView(chip.id)}
                className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  view === chip.id
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder={t('retro.list.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs w-48 focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
            </div>

            {/* Team Filter */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTeamDropdown(!showTeamDropdown);
                }}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors"
              >
                <Filter className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-600">
                  {teamFilter == null ? t('retro.list.colTeam') : teams.find((tm) => tm.id === teamFilter)?.name || t('retro.list.colTeam')}
                </span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showTeamDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showTeamDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTeamFilter(null);
                      setShowTeamDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${teamFilter == null ? 'bg-gray-100 font-medium' : ''}`}
                  >
                    {t('retro.list.allTeams')}
                  </button>
                  {teams.map((t) => (
                    <button
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTeamFilter(t.id);
                        setShowTeamDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${teamFilter === t.id ? 'bg-gray-100 font-medium' : ''}`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="mb-2 flex items-center gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                statusTab === tab.id
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Boards Table */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400 text-sm">{t('common.loading')}</div>
          ) : filteredBoards.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-1">{t('retro.list.empty')}</p>
              <p className="text-xs text-gray-400">{t('retro.list.create')}</p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('retro.list.colTitle')}</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('retro.list.colTeam')}</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('retro.list.colParticipants')}</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('retro.list.colStatus')}</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('retro.list.colCards')}</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('retro.list.colCreatedAt')}</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('retro.list.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBoards.map((board) => {
                  const participants = board.participants || [];
                  const shown = participants.slice(0, 3);
                  const extra = participants.length - shown.length;
                  return (
                    <tr
                      key={board.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/retro/${board.id}`)}
                    >
                      <td className="px-3 py-2">
                        <span className="text-sm font-medium text-gray-800">{board.title}</span>
                        {board.description && (
                          <p className="text-xs text-gray-400 truncate max-w-xs">{board.description}</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-sm text-gray-600">{board.teamName || t('retro.list.noTeam')}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center -space-x-1.5">
                          {shown.map((p) => (
                            <div
                              key={p.userId}
                              title={`${p.name} (${p.role})`}
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold border border-white ${getAvatarColor(p.userId)}`}
                            >
                              {getInitials(p.name)}
                            </div>
                          ))}
                          {extra > 0 && (
                            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-[10px] font-bold border border-white">
                              +{extra}
                            </div>
                          )}
                          {participants.length === 0 && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            board.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {board.status === 'ACTIVE' ? t('retro.list.tabActive') : t('retro.list.tabEnded')}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-sm text-gray-600">{board.cardCount ?? 0}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs text-gray-500">{formatTime(board.createdAt)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(board.id);
                          }}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline"
                        >
                          {t('common.delete')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Create Board Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col">
              {/* Dialog Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-800">{t('retro.create.title')}</h2>
                <button
                  onClick={() => {
                    setShowCreateDialog(false);
                    if (router.query.new === '1') {
                      router.replace('/retro', undefined, { shallow: true });
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dialog Body */}
              <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('retro.create.boardTitle')}</label>
                  <input
                    type="text"
                    placeholder={t('retro.create.boardTitlePlaceholder')}
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:outline-none"
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('retro.create.boardDescription')}</label>
                  <textarea
                    placeholder={t('retro.create.boardDescription')}
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:outline-none resize-none"
                  />
                </div>

                {/* Team (optional prefill) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('retro.create.team')}</label>
                  <select
                    value={createForm.teamId}
                    onChange={(e) => setCreateForm({ ...createForm, teamId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-300 focus:outline-none bg-white"
                  >
                    <option value="">{t('retro.list.noTeam')}</option>
                    {teams.map((tm) => (
                      <option key={tm.id} value={tm.id}>
                        {tm.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">{t('retro.create.team')}</p>
                </div>

                {/* Participants */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('retro.create.participants')}</label>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowParticipantDropdown(!showParticipantDropdown);
                      }}
                      className="flex items-center gap-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm hover:bg-gray-200 transition-colors w-full"
                    >
                      <Users className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-600">
                        {createForm.participantUserIds.length > 0
                          ? t('retro.create.selectedCount', { count: createForm.participantUserIds.length })
                          : t('retro.create.participants')}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-gray-400 ml-auto transition-transform ${showParticipantDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showParticipantDropdown && (
                      <div className="absolute left-0 top-full mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1">
                        {users
                          .filter((u) => u.id !== Number(user?.id))
                          .map((u) => (
                            <label
                              key={u.id}
                              className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-50"
                            >
                              <input
                                type="checkbox"
                                checked={createForm.participantUserIds.includes(u.id)}
                                onChange={() => toggleParticipant(u.id)}
                                className="w-4 h-4"
                              />
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${getAvatarColor(u.id)}`}>
                                {getInitials(u.name)}
                              </div>
                              <span className="text-sm text-gray-700">{u.name}</span>
                              <span className="text-xs text-gray-400 ml-auto">{u.email}</span>
                            </label>
                          ))}
                      </div>
                    )}
                  </div>
                  {/* Selected avatars */}
                  {createForm.participantUserIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {createForm.participantUserIds.map((uid) => {
                        const u = users.find((x) => x.id === uid);
                        if (!u) return null;
                        return (
                          <span key={uid} className="flex items-center gap-1 bg-gray-100 rounded-full pl-0.5 pr-1.5 py-0.5">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold ${getAvatarColor(u.id)}`}>
                              {getInitials(u.name)}
                            </div>
                            <span className="text-xs text-gray-600">{u.name}</span>
                            <button
                              onClick={() => toggleParticipant(uid)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Dialog Footer */}
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowCreateDialog(false);
                    if (router.query.new === '1') {
                      router.replace('/retro', undefined, { shallow: true });
                    }
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  {t('retro.create.cancel')}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? t('common.loading') : t('retro.list.create')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
