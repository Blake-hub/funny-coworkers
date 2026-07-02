import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, 
  Bug, 
  FolderOpen, 
  Folder,
  Users, 
  FileText, 
  FolderPlus,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Search,
  Bell,
  Plus,
  MoreHorizontal,
  ArrowLeft,
  MoreVertical,
  Pencil,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { teamApi, type TeamResponse, wikiApi, type WikiFolderResponse, type WikiPageResponse, type CreateWikiFolderRequest, type UpdateWikiFolderRequest } from '@/services/api';
import { mockIssues, mockProjects } from '@/data/mockData';

interface SidebarProps {
  width: number;
  isCollapsed: boolean;
  isMobile?: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  href?: string;
  badge?: number;
}

export default function Sidebar({ width, isCollapsed, isMobile }: SidebarProps) {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [showWikiMenu, setShowWikiMenu] = useState(false);
  const [wikiFolders, setWikiFolders] = useState<WikiFolderResponse[]>([]);
  const [expandedFoldersInSidebar, setExpandedFoldersInSidebar] = useState<Set<number>>(new Set());
  const [wikiPages, setWikiPages] = useState<WikiPageResponse[]>([]);
  const [showFolderCreateMenuForId, setShowFolderCreateMenuForId] = useState<number | null>(null);
  const [showFolderActionsMenuForId, setShowFolderActionsMenuForId] = useState<number | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<number | null>(null);
  const [renamingFolderName, setRenamingFolderName] = useState<string>('');
  const [wikiReloadToken, setWikiReloadToken] = useState<number>(0);
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  const forceReloadWikiTree = useCallback(() => setWikiReloadToken(t => t + 1), []);
  const hasLoadedPersistedStateRef = useRef(false);

  useEffect(() => {
    if (renamingFolderId != null && renameInputRef.current) {
      requestAnimationFrame(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      });
    }
  }, [renamingFolderId]);

  const getMenuItems = () => [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { id: 'issues', label: 'My Issues', icon: Bug, href: '/issues', badge: mockIssues.length },
    { id: 'projects', label: 'My Projects', icon: FolderOpen, href: '/projects', badge: mockProjects.length },
    { id: 'teams', label: 'My Teams', icon: Users, badge: teams.length },
    { id: 'wiki', label: 'Wiki', icon: FileText, href: '/wiki' },
    { id: 'reports', label: 'Reports', icon: BarChart3, href: '/reports' },
  ];

  const SS_KEY_MENU = 'sidebar:expandedMenu';
  const SS_KEY_FOLDERS = 'sidebar:expandedFolders';
  const SS_KEY_TEAMS = 'sidebar:expandedTeams';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const rawMenu = window.sessionStorage.getItem(SS_KEY_MENU);
      if (rawMenu === 'wiki' || rawMenu === 'teams') {
        setExpandedMenu(rawMenu);
      }

      const rawFolders = window.sessionStorage.getItem(SS_KEY_FOLDERS);
      if (rawFolders) {
        try {
          const arr = JSON.parse(rawFolders);
          if (Array.isArray(arr)) {
            setExpandedFoldersInSidebar(new Set(arr.filter(n => typeof n === 'number')));
          }
        } catch {
          /* ignore malformed */
        }
      }

      const rawTeams = window.sessionStorage.getItem(SS_KEY_TEAMS);
      if (rawTeams) {
        try {
          const obj = JSON.parse(rawTeams);
          if (obj && typeof obj === 'object') {
            setExpandedTeams(obj);
          }
        } catch {
          /* ignore malformed */
        }
      }
    } finally {
      hasLoadedPersistedStateRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !hasLoadedPersistedStateRef.current) return;
    if (expandedMenu == null) {
      window.sessionStorage.removeItem(SS_KEY_MENU);
    } else {
      window.sessionStorage.setItem(SS_KEY_MENU, expandedMenu);
    }
  }, [expandedMenu]);

  useEffect(() => {
    if (typeof window === 'undefined' || !hasLoadedPersistedStateRef.current) return;
    const serial = JSON.stringify(Array.from(expandedFoldersInSidebar));
    if (expandedFoldersInSidebar.size === 0) {
      window.sessionStorage.removeItem(SS_KEY_FOLDERS);
    } else {
      window.sessionStorage.setItem(SS_KEY_FOLDERS, serial);
    }
  }, [expandedFoldersInSidebar]);

  useEffect(() => {
    if (typeof window === 'undefined' || !hasLoadedPersistedStateRef.current) return;
    const keys = Object.keys(expandedTeams);
    if (keys.length === 0) {
      window.sessionStorage.removeItem(SS_KEY_TEAMS);
    } else {
      window.sessionStorage.setItem(SS_KEY_TEAMS, JSON.stringify(expandedTeams));
    }
  }, [expandedTeams]);

  useEffect(() => {
    const fetchTeams = async () => {
      if (!user?.id) return;
      
      try {
        const teamsData = await teamApi.getTeamsForUser(Number(user.id));
        setTeams(teamsData);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      }
    };

    if (user?.id) {
      fetchTeams();
    }
  }, [user?.id]);

  useEffect(() => {
    const fetchFolders = async () => {
      if (!user?.id) return;
      try {
        const data = await wikiApi.getAllFolders();
        setWikiFolders(data);
      } catch (error) {
        console.error('Failed to fetch wiki folders:', error);
      }
    };
    if (user?.id && router.pathname.startsWith('/wiki')) {
      fetchFolders();
    }
  }, [user?.id, router.asPath, wikiReloadToken]);

  useEffect(() => {
    const fetchWikiPages = async () => {
      if (!user?.id) return;
      try {
        const pagesData = await wikiApi.getAllPages();
        setWikiPages(pagesData);
      } catch (error) {
        console.error('Failed to fetch wiki pages for sidebar:', error);
      }
    };
    if (user?.id && router.pathname.startsWith('/wiki')) {
      fetchWikiPages();
    }
  }, [user?.id, router.asPath, wikiReloadToken]);
  
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSearchClick = () => {
    router.push('/search');
  };

  const handleTeamsClick = () => {
    setExpandedMenu(expandedMenu === 'teams' ? null : 'teams');
  };

  const handleWikiClick = () => {
    setExpandedMenu('wiki');
    router.push({ pathname: '/wiki', query: {} });
  };

  const toggleWikiFolderExpand = (folderId: number) => {
    setExpandedFoldersInSidebar(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const unreadCount = 3;
  const isCreateTeamPage = router.pathname === '/teams/new';

  const renderWikiFolderTreeInSidebar = (
    list: WikiFolderResponse[],
    depth: number,
    opts: {
      expandedFoldersInSidebar: Set<number>;
      toggleExpand: (id: number) => void;
      selectedFolderId: number | null;
      onSelect: (id: number) => void;
    }
  ) => {
    return list.map(folder => {
      const hasChildFolders = folder.children && folder.children.length > 0;
      const hasChildPages = wikiPages.some(p => p.folderId === folder.id);
      const hasChildren = hasChildFolders || hasChildPages;
      const isExpanded = opts.expandedFoldersInSidebar.has(folder.id);
      const isSelected = opts.selectedFolderId === folder.id;

      return (
        <div key={folder.id}>
          <div
            className={`relative group w-full flex items-center gap-1.5 px-2 py-1 rounded text-sm cursor-pointer transition-colors ${
              isSelected
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
            }`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => {
              opts.toggleExpand(folder.id);
              setExpandedMenu('wiki');
              router.push({ pathname: '/wiki', query: { folderId: String(folder.id) } });
            }}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  opts.toggleExpand(folder.id);
                }}
                className="flex-shrink-0 p-0.5 hover:bg-gray-300 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                )}
              </button>
            ) : (
              <span className="w-5 flex-shrink-0" />
            )}

            {isSelected || isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            )}

            {renamingFolderId === folder.id ? (
              <input
                ref={renameInputRef}
                className="flex-1 px-1.5 py-0.5 text-sm bg-white border border-blue-400 rounded outline-none ring-2 ring-blue-200 min-w-0"
                value={renamingFolderName}
                placeholder="Folder name"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => setRenamingFolderName(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    e.preventDefault();
                    setRenamingFolderId(null);
                    setRenamingFolderName('');
                    return;
                  }
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    e.preventDefault();
                    const newName = renamingFolderName.trim();
                    if (!newName) {
                      alert('Folder name cannot be empty.');
                      return;
                    }
                    if (newName === folder.name) {
                      setRenamingFolderId(null);
                      setRenamingFolderName('');
                      return;
                    }
                    try {
                      await wikiApi.updateFolder(folder.id, { name: newName });
                      setRenamingFolderId(null);
                      setRenamingFolderName('');
                      forceReloadWikiTree();
                    } catch (err) {
                      console.error('Failed to rename folder', err);
                      alert('Failed to rename folder.');
                    }
                  }
                }}
                onBlur={async (e) => {
                  const newName = renamingFolderName.trim();
                  if (!newName) {
                    setRenamingFolderId(null);
                    setRenamingFolderName('');
                    return;
                  }
                  if (newName === folder.name) {
                    setRenamingFolderId(null);
                    setRenamingFolderName('');
                    return;
                  }
                  try {
                    await wikiApi.updateFolder(folder.id, { name: newName });
                    setRenamingFolderId(null);
                    setRenamingFolderName('');
                    forceReloadWikiTree();
                  } catch (err) {
                    console.error('Failed to rename folder on blur', err);
                  }
                }}
              />
            ) : (
              <>
                <span className="flex-1 truncate text-left">
                  {folder.name}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  ({folder.pageCount})
                </span>
              </>
            )}

            {renamingFolderId !== folder.id && (
              <div className="relative ml-0.5">
                <button
                  className={`flex-shrink-0 p-0.5 rounded transition-all duration-150 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 ${
                    isSelected ? 'hover:bg-white/20 text-gray-200 hover:text-white' : 'hover:bg-gray-300 text-gray-400 hover:text-gray-700'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowFolderCreateMenuForId(null);
                    setShowFolderActionsMenuForId(
                      showFolderActionsMenuForId === folder.id ? null : folder.id
                    );
                  }}
                  title="Folder options"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {showFolderActionsMenuForId === folder.id && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFolderActionsMenuForId(null);
                      }}
                    />
                    <div className="absolute right-0 top-full mt-0.5 w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1">
                      <button
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFolderActionsMenuForId(null);
                          setRenamingFolderId(folder.id);
                          setRenamingFolderName(folder.name);
                        }}
                      >
                        <Pencil className="w-4 h-4 text-slate-500" />
                        <span>Rename</span>
                      </button>
                      <button
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        onClick={async (e) => {
                          e.stopPropagation();
                          setShowFolderActionsMenuForId(null);
                          const ok = window.confirm(
                            `Delete folder "${folder.name}"?\n\nAny subfolders inside may also be removed. Documents will be moved to the root (no folder) or deleted depending on server settings.\n\nThis cannot be undone.`
                          );
                          if (!ok) return;
                          try {
                            await wikiApi.deleteFolder(folder.id);
                            if (String(router.query.folderId) === String(folder.id)) {
                              const { folderId: _strip, ...rest } = router.query;
                              router.replace(
                                { pathname: router.pathname, query: rest },
                                undefined,
                                { shallow: true }
                              );
                            }
                            setExpandedFoldersInSidebar(prev => {
                              const next = new Set(prev);
                              next.delete(folder.id);
                              return next;
                            });
                            forceReloadWikiTree();
                          } catch (err) {
                            console.error('Failed to delete folder', err);
                            alert('Failed to delete folder.');
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {renamingFolderId !== folder.id && (
              <div className="relative ml-0.5">
                <button
                  className={`flex-shrink-0 p-0.5 rounded transition-all duration-150 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 ${
                    isSelected ? 'hover:bg-white/20 text-gray-200 hover:text-white' : 'hover:bg-gray-300 text-gray-400 hover:text-gray-700'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowFolderCreateMenuForId(
                      showFolderCreateMenuForId === folder.id ? null : folder.id
                    );
                  }}
                  title="Add document or subfolder"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                {showFolderCreateMenuForId === folder.id && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFolderCreateMenuForId(null);
                      }}
                    />
                    <div className="absolute right-0 top-full mt-0.5 w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1">
                      <button
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFolderCreateMenuForId(null);
                          router.push({
                            pathname: '/wiki/new-document',
                            query: { folderId: String(folder.id) },
                          });
                        }}
                      >
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span>Document</span>
                      </button>
                      <button
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFolderCreateMenuForId(null);
                          router.push({
                            pathname: '/wiki',
                            query: { folderId: String(folder.id), newFolderModal: '1' },
                          });
                        }}
                      >
                        <FolderPlus className="w-4 h-4 text-amber-500" />
                        <span>Subfolder</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {hasChildFolders && isExpanded && (
            <div>
              {renderWikiFolderTreeInSidebar(folder.children!, depth + 1, opts)}
            </div>
          )}

          {isExpanded &&
            wikiPages
              .filter(p => p.folderId === folder.id)
              .sort((a, b) => a.title.localeCompare(b.title))
              .map(page => (
                <div
                  key={`page-${page.id}`}
                  className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-sm cursor-pointer transition-colors ${
                    String(router.query.id) === String(page.id)
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                  }`}
                  style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
                  onClick={() => router.push(`/wiki/${page.id}`)}
                >
                  <span className="w-5 flex-shrink-0" />
                  <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${String(router.query.id) === String(page.id) ? 'text-blue-500' : 'text-slate-500'}`} />
                  <span className="flex-1 truncate text-left">
                    {page.title || '(Untitled)'}
                  </span>
                  {!page.isPublished && (
                    <span className="ml-1 px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded text-[10px] border border-yellow-200 flex-shrink-0">
                      Draft
                    </span>
                  )}
                </div>
              ))}
        </div>
      );
    });
  };

  return (
    <aside 
      className={`h-screen bg-gray-100 transition-all duration-300 flex-shrink-0 ${
        isMobile ? 'shadow-2xl' : ''
      }`}
      style={{ width: `${width}px` }}
    >
      <div className="h-full flex flex-col">
        {/* User Profile & Actions - Same Row */}
        {!isCreateTeamPage && (
          <div className={`p-3 border-b border-gray-200 ${isMobile ? 'p-4' : ''}`}>
            <div className="flex items-center justify-between">
              {/* User Profile */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`${isMobile ? 'w-10 h-10 text-base' : 'w-8 h-8 text-sm'} rounded-full bg-blue-600 flex items-center justify-center font-bold text-white flex-shrink-0`}>
                  {user?.name ? user.name.charAt(0) : '?'}
                </div>
                {!isCollapsed && (
                  <div className="min-w-0">
                    <p className={`font-medium text-gray-800 truncate ${isMobile ? 'text-base' : 'text-sm'}`}>{user?.name || 'Unknown User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.role || 'Unknown Role'}</p>
                  </div>
                )}
              </div>
              
              {/* Search & Notifications & Mobile Close */}
              <div className={`flex items-center gap-1 flex-shrink-0 ${isMobile ? 'gap-2' : ''}`}>
                <button 
                  onClick={handleSearchClick}
                  className={`p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors ${isMobile ? 'p-3' : ''}`}
                  title="Search"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {showNotifications && !isCollapsed && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                      <div className="p-2 border-b border-gray-200">
                        <h4 className="text-xs font-semibold text-gray-700">Notifications</h4>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        <div className="p-2 hover:bg-gray-50 border-b border-gray-100">
                          <p className="text-xs text-gray-700">Issue #123 assigned to you</p>
                        </div>
                        <div className="p-2 hover:bg-gray-50 border-b border-gray-100">
                          <p className="text-xs text-gray-700">Comment on Issue #456</p>
                        </div>
                        <div className="p-2 hover:bg-gray-50">
                          <p className="text-xs text-gray-700">Project updated: Website Redesign</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1">
          {isCreateTeamPage ? (
            <button
              onClick={() => router.back()}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all duration-200 ease-in-out text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:shadow-sm`}
            >
              <ArrowLeft className={`w-4 h-4 ${isMobile ? 'w-5 h-5' : ''}`} />
              {!isCollapsed && <span>{isMobile ? 'Back' : 'Back to app'}</span>}
            </button>
          ) : (
            getMenuItems().map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href;
            
            if (item.id === 'teams') {
              return (
                <div key={item.id}>
                  <div 
                    className={`flex items-center gap-2 rounded-lg text-sm transition-all duration-200 ease-in-out cursor-pointer ${
                      isActive 
                        ? 'bg-gray-500 text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:shadow-sm'
                    } ${isMobile ? 'px-4 py-3 text-base' : 'px-2 py-1.5'}`}
                    onClick={handleTeamsClick}
                  >
                    <Icon className={`w-4 h-4 transition-transform duration-200 ${isMobile ? 'w-5 h-5' : ''}`} />
                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{item.label}</span>
                          {expandedMenu === 'teams' ? (
                            <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4 transition-transform duration-200" />
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {item.badge && (
                            <span className={`px-1.5 py-0.5 rounded-full text-xs transition-colors duration-200 ${
                              isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-800'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                          <button
                            className={`p-1 rounded transition-colors duration-200 ${
                              isActive ? 'hover:bg-white/20' : 'hover:bg-gray-300'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push('/teams/new');
                            }}
                            title="Add Team"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    {isCollapsed && item.badge && (
                      <span className="bg-gray-200 text-gray-700 w-4 h-4 rounded-full flex items-center justify-center text-xs">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  
                  {!isCollapsed && expandedMenu === 'teams' && (
                    <div className="ml-4 mt-0.5 space-y-0.5">
                      {teams.map((team) => {
                        const teamId = String(team.id);
                        const isTeamExpanded = expandedTeams[teamId] ?? false;
                        return (
                          <div key={team.id}>
                            <div className="w-full flex items-center justify-between px-2 py-1 rounded text-sm text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:shadow-sm transition-all duration-200 ease-in-out cursor-pointer">
                              <button
                                onClick={() => setExpandedTeams(prev => ({ ...prev, [teamId]: !(prev[teamId] ?? false) }))}
                                className="flex items-center min-w-0 flex-1"
                              >
                                <Users className="w-3 h-3 inline mr-2 flex-shrink-0" />
                                <span className="truncate">{team.name}</span>
                                <span className="w-1.5"></span>
                                {isTeamExpanded ? (
                                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                                ) : (
                                  <ChevronRightIcon className="w-4 h-4 flex-shrink-0" />
                                )}
                              </button>
                              <button
                                className="p-1 rounded transition-colors duration-200 hover:bg-gray-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/teams/edit/${team.id}`);
                                }}
                                title="Edit Team"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                            {isTeamExpanded && (
                              <div className="ml-6 mt-0.5 space-y-0.5">
                                <button
                                  className="w-full text-left px-2 py-1 rounded text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200"
                                >
                                  <Bug className="w-3 h-3 inline mr-2" />
                                  Issues
                                </button>
                                <button
                                  className="w-full text-left px-2 py-1 rounded text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200"
                                >
                                  <FolderOpen className="w-3 h-3 inline mr-2" />
                                  Projects
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            if (item.id === 'wiki') {
              const selectedFolderIdFromUrl = router.query.folderId ? Number(router.query.folderId) : null;
              const onWikiPage = router.pathname === '/wiki' || router.pathname.startsWith('/wiki/');
              return (
                <div key={item.id}>
                  <div
                    className={`flex items-center gap-2 rounded-lg text-sm transition-all duration-200 ease-in-out cursor-pointer ${
                      onWikiPage
                        ? 'bg-gray-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:shadow-sm'
                    } ${isMobile ? 'px-4 py-3 text-base' : 'px-2 py-1.5'}`}
                    onClick={handleWikiClick}
                  >
                    <Icon className={`w-4 h-4 transition-transform duration-200 ${isMobile ? 'w-5 h-5' : ''}`} />
                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="truncate">{item.label}</span>
                          <button
                            className={`flex-shrink-0 p-0.5 rounded transition-colors duration-200 ${
                              onWikiPage ? 'hover:bg-white/20' : 'hover:bg-gray-300'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedMenu(expandedMenu === 'wiki' ? null : 'wiki');
                            }}
                            title={expandedMenu === 'wiki' ? 'Collapse' : 'Expand'}
                          >
                            {expandedMenu === 'wiki' ? (
                              <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4 transition-transform duration-200" />
                            )}
                          </button>
                        </div>
                        <div className="relative flex items-center gap-1">
                          <button
                            className={`p-1 rounded transition-colors duration-200 ${
                              onWikiPage ? 'hover:bg-white/20' : 'hover:bg-gray-300'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowWikiMenu(!showWikiMenu);
                            }}
                            title="Add to Wiki"
                          >
                            <Plus className="w-4 h-4" />
                          </button>

                          {showWikiMenu && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowWikiMenu(false)}
                              />
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowWikiMenu(false);
                                    router.push('/wiki/new-document');
                                  }}
                                >
                                  <FileText className="w-4 h-4" />
                                  <span>Document</span>
                                </button>
                                <button
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowWikiMenu(false);
                                    const { folderId: _ignore, ...rest } = router.query;
                                    router.push({
                                      pathname: '/wiki',
                                      query: { ...rest, newFolderModal: '1' },
                                    });
                                  }}
                                >
                                  <FolderPlus className="w-4 h-4" />
                                  <span>Folder</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    {isCollapsed && item.badge && (
                      <span className="bg-gray-200 text-gray-700 w-4 h-4 rounded-full flex items-center justify-center text-xs">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {!isCollapsed && expandedMenu === 'wiki' && (
                    <div className="ml-4 mt-0.5 space-y-0.5">
                      {wikiFolders.length > 0 ? (
                        renderWikiFolderTreeInSidebar(wikiFolders, 0, {
                          expandedFoldersInSidebar,
                          toggleExpand: toggleWikiFolderExpand,
                          selectedFolderId: selectedFolderIdFromUrl,
                          onSelect: (folderId) => {
                            const { newFolderModal: _omit, ...rest } = router.query;
                            router.push({
                              pathname: '/wiki',
                              query: { ...rest, folderId: String(folderId) },
                            });
                          },
                        })
                      ) : (
                        <div className="mt-1 px-2 py-2 text-xs text-gray-400 text-center border-t border-gray-100 rounded">
                          No folders yet
                        </div>
                      )}

                      {wikiPages.filter(p => p.folderId == null).length > 0 && (
                        <div className="mt-1 pt-1 border-t border-gray-100 space-y-0.5">
                          {wikiPages
                            .filter(p => p.folderId == null)
                            .sort((a, b) => a.title.localeCompare(b.title))
                            .map(page => (
                              <div
                                key={`root-page-${page.id}`}
                                onClick={() => router.push(`/wiki/${page.id}`)}
                                className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-sm cursor-pointer transition-colors ${
                                  String(router.query.id) === String(page.id)
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                                }`}
                              >
                                <span className="w-5 flex-shrink-0" />
                                <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${String(router.query.id) === String(page.id) ? 'text-blue-500' : 'text-slate-500'}`} />
                                <span className="flex-1 truncate text-left">
                                  {page.title || '(Untitled)'}
                                </span>
                                {!page.isPublished && (
                                  <span className="ml-1 px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded text-[10px] border border-yellow-200 flex-shrink-0">
                                    Draft
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <Link
                key={item.id}
                href={item.href!}
                className={`flex items-center gap-2 rounded-lg text-sm transition-all duration-200 ease-in-out ${
                  isActive 
                    ? 'bg-gray-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:shadow-sm hover:scale-[1.02]'
                } ${isMobile ? 'px-4 py-3 text-base' : 'px-2 py-1.5'}`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-200 ${isMobile ? 'w-5 h-5' : ''}`} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className={`px-1.5 py-0.5 rounded-full text-xs transition-colors duration-200 ${
                        isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-800'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {isCollapsed && item.badge && (
                  <span className="bg-gray-200 text-gray-700 w-4 h-4 rounded-full flex items-center justify-center text-xs">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })
          )}
        </nav>

        {/* Bottom Actions */}
        {!isCreateTeamPage && (
          <div className={`p-3 border-t border-gray-200 space-y-1 ${isMobile ? 'p-4 space-y-2' : ''}`}>
            <button
              onClick={() => router.push('/settings/')}
              className={`w-full flex items-center gap-2 rounded-lg text-sm transition-all duration-200 ease-in-out ${
                isCollapsed ? 'justify-center text-gray-600 hover:bg-gray-100' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:shadow-sm'
              } ${isMobile ? 'px-4 py-3 text-base' : 'px-2 py-1.5'}`}
              title="Settings"
            >
              <Settings className={`w-4 h-4 ${isMobile ? 'w-5 h-5' : ''}`} />
              {!isCollapsed && <span>Settings</span>}
            </button>
            <button 
              onClick={handleLogout}
              className={`w-full flex items-center gap-2 rounded-lg text-sm transition-all duration-200 ease-in-out ${
                isCollapsed ? 'justify-center text-gray-600 hover:bg-gray-100' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:shadow-sm'
              } ${isMobile ? 'px-4 py-3 text-base' : 'px-2 py-1.5'}`}
              title="Logout">
              <LogOut className={`w-4 h-4 ${isMobile ? 'w-5 h-5' : ''}`} />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
