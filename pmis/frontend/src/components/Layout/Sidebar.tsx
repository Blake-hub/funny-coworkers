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
  Trash2,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { teamApi, type TeamResponse, wikiApi, type WikiFolderResponse, type WikiPageResponse, type CreateWikiFolderRequest, type UpdateWikiFolderRequest, type NotificationResponse } from '@/services/api';
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
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllAsRead,
    formatTime,
  } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarPopupAnchorRight, setSidebarPopupAnchorRight] = useState(false);
  const sidebarBellContainerRef = useRef<HTMLDivElement>(null);
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
  const [showPageActionsMenuForId, setShowPageActionsMenuForId] = useState<number | null>(null);
  const [renamingPageId, setRenamingPageId] = useState<number | null>(null);
  const [renamingPageTitle, setRenamingPageTitle] = useState<string>('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [showFolderVisibilityModal, setShowFolderVisibilityModal] = useState<number | null>(null);
  const [fvFolderId, setFvFolderId] = useState<number | ''>('');
  const [fvVisibility, setFvVisibility] = useState<'PRIVATE' | 'TEAM' | 'PUBLIC'>('PRIVATE');
  const [fvSaving, setFvSaving] = useState(false);
  const [fvError, setFvError] = useState<string | null>(null);

  const forceReloadWikiTree = useCallback(() => setWikiReloadToken(t => t + 1), []);
  const hasLoadedPersistedStateRef = useRef(false);

  const flattenFoldersSidebar = (
    folderList: WikiFolderResponse[],
    depth: number
  ): Array<{ id: number; name: string; depth: number }> => {
    const result: Array<{ id: number; name: string; depth: number }> = [];
    for (const folder of folderList) {
      result.push({ id: folder.id, name: folder.name, depth });
      if (folder.children && folder.children.length > 0) {
        result.push(...flattenFoldersSidebar(folder.children, depth + 1));
      }
    }
    return result;
  };

  useEffect(() => {
    if (showFolderVisibilityModal == null) return;
    const target = wikiPages.find(p => p.id === showFolderVisibilityModal);
    if (!target) {
      setFvFolderId('');
      setFvVisibility('PRIVATE');
      return;
    }
    setFvFolderId(target.folderId != null ? target.folderId : '');
    const v = target.visibility;
    if (v === 'PUBLIC' || v === 'TEAM' || v === 'PRIVATE') {
      setFvVisibility(v);
    } else {
      setFvVisibility('PRIVATE');
    }
    setFvError(null);
  }, [showFolderVisibilityModal, wikiPages]);

  useEffect(() => {
    if (renamingFolderId != null && renameInputRef.current) {
      requestAnimationFrame(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      });
    }
  }, [renamingFolderId]);

  useEffect(() => {
    if (renamingPageId != null && renameInputRef.current) {
      requestAnimationFrame(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      });
    }
  }, [renamingPageId]);

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

  useEffect(() => {
    if (!showNotifications || !sidebarBellContainerRef.current) return;
    const rect = sidebarBellContainerRef.current.getBoundingClientRect();
    const popupWidth = 288;
    const margin = 12;
    const spaceOnRight = window.innerWidth - rect.left;
    const spaceOnLeft = rect.right;
    const needsRightAnchor = (spaceOnRight < popupWidth + margin) && (spaceOnLeft > spaceOnRight);
    setSidebarPopupAnchorRight(needsRightAnchor);
  }, [showNotifications]);

  useEffect(() => {
    if (!showNotifications) return;
    const handleOutsideMouseDown = (e: MouseEvent) => {
      if (
        sidebarBellContainerRef.current &&
        sidebarBellContainerRef.current.contains(e.target as Node)
      ) {
        return;
      }
      setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleOutsideMouseDown);
    return () => document.removeEventListener('mousedown', handleOutsideMouseDown);
  }, [showNotifications]);

  const handleNotificationClick = async (item: NotificationResponse) => {
    if (!item.readStatus) {
      await markNotificationRead(item.id);
    }
    setShowNotifications(false);
    router.push(item.actionUrl);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

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
              .map(page => renderWikiPageRow(page, depth + 1, 'page'))}
        </div>
      );
    });
  };

  const renderWikiPageRow = (
    page: WikiPageResponse,
    depth: number,
    keyPrefix: string
  ) => {
    const isSelected = String(router.query.id) === String(page.id);
    return (
      <div
        key={`${keyPrefix}-${page.id}`}
        className={`relative group w-full flex items-center gap-1.5 px-2 py-1 rounded text-sm cursor-pointer transition-colors ${
          isSelected
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => router.push(`/wiki/${page.id}`)}
      >
        <span className="w-5 flex-shrink-0" />
        <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-blue-500' : 'text-slate-500'}`} />
        {renamingPageId === page.id ? (
          <input
            ref={renameInputRef}
            className="flex-1 px-1.5 py-0.5 text-sm bg-white border border-blue-400 rounded outline-none ring-2 ring-blue-200 min-w-0"
            value={renamingPageTitle}
            placeholder="Document title"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => setRenamingPageTitle(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                e.preventDefault();
                setRenamingPageId(null);
                setRenamingPageTitle('');
                return;
              }
              if (e.key === 'Enter') {
                e.stopPropagation();
                e.preventDefault();
                const newTitle = renamingPageTitle.trim();
                if (!newTitle) { alert('Document title cannot be empty.'); return; }
                if (newTitle === page.title) { setRenamingPageId(null); setRenamingPageTitle(''); return; }
                try {
                  await wikiApi.updatePage(page.id, { title: newTitle });
                  setRenamingPageId(null);
                  setRenamingPageTitle('');
                  forceReloadWikiTree();
                } catch (err) {
                  console.error('Failed to rename page', err);
                  alert(err instanceof Error ? err.message : 'Failed to rename document.');
                }
              }
            }}
            onBlur={async () => {
              const newTitle = renamingPageTitle.trim();
              if (!newTitle) { setRenamingPageId(null); setRenamingPageTitle(''); return; }
              if (newTitle === page.title) { setRenamingPageId(null); setRenamingPageTitle(''); return; }
              try {
                await wikiApi.updatePage(page.id, { title: newTitle });
                setRenamingPageId(null);
                setRenamingPageTitle('');
                forceReloadWikiTree();
              } catch (err) {
                console.error('Failed to rename page on blur', err);
              }
            }}
          />
        ) : (
          <>
            <span className="flex-1 truncate text-left">{page.title || '(Untitled)'}</span>
            {!page.isPublished && (
              <span className="ml-1 px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded text-[10px] border border-yellow-200 flex-shrink-0">Draft</span>
            )}
            <div className="relative ml-0.5">
              <button
                className={`flex-shrink-0 p-0.5 rounded transition-all duration-150 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 ${
                  isSelected ? 'hover:bg-white/20 text-gray-200 hover:text-white' : 'hover:bg-gray-300 text-gray-400 hover:text-gray-700'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowFolderCreateMenuForId(null);
                  setShowFolderActionsMenuForId(null);
                  setShowPageActionsMenuForId(showPageActionsMenuForId === page.id ? null : page.id);
                }}
                title="Document options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
              {showPageActionsMenuForId === page.id && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => { e.stopPropagation(); setShowPageActionsMenuForId(null); }}
                  />
                  <div className="absolute right-0 top-full mt-0.5 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1">
                    <button
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPageActionsMenuForId(null);
                        setRenamingPageId(page.id);
                        setRenamingPageTitle(page.title || '');
                      }}
                    >
                      <Pencil className="w-4 h-4 text-slate-500" />
                      <span>Rename</span>
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPageActionsMenuForId(null);
                        setShowFolderVisibilityModal(page.id);
                      }}
                    >
                      <Settings className="w-4 h-4 text-indigo-500" />
                      <span>Folder &amp; Visibility…</span>
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      onClick={async (e) => {
                        e.stopPropagation();
                        setShowPageActionsMenuForId(null);
                        const ok = window.confirm(`Delete document "${page.title || '(Untitled)'}"?\n\nThis cannot be undone.`);
                        if (!ok) return;
                        try {
                          await wikiApi.deletePage(page.id);
                          if (String(router.query.id) === String(page.id)) {
                            const { id: _strip, ...rest } = router.query;
                            router.replace({ pathname: '/wiki', query: rest }, undefined, { shallow: true });
                          }
                          forceReloadWikiTree();
                        } catch (err) {
                          console.error('Failed to delete page', err);
                          alert(err instanceof Error ? err.message : 'Failed to delete document.');
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
          </>
        )}
      </div>
    );
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
                <div className="relative" ref={sidebarBellContainerRef}>
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
                    <div className={`absolute top-full mt-1 w-72 max-w-[calc(100vw-1.5rem)] bg-white border border-gray-200 rounded-lg shadow-xl z-50 ${
                      sidebarPopupAnchorRight ? 'right-0' : 'left-0'
                    }`}>
                      <div className="p-2.5 border-b border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-semibold text-gray-800">Notifications</h4>
                          {unreadCount > 0 && (
                            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700 transition-colors"
                            title="Mark all as read"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-5 text-center">
                            <div className="w-10 h-10 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                              <Bell className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-500 font-medium">No notifications yet</p>
                            <p className="text-[11px] text-gray-400 mt-1">
                              @mentions appear here
                            </p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`p-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                                !notification.readStatus ? 'bg-blue-50/60' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={`text-xs leading-snug ${
                                      !notification.readStatus
                                        ? 'font-semibold text-gray-900'
                                        : 'text-gray-600'
                                    }`}>
                                      {notification.title}
                                    </p>
                                    {!notification.readStatus && (
                                      <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                    )}
                                  </div>
                                  <div className="mt-1 flex items-center gap-1">
                                    <span className="text-[10px] text-gray-400">
                                      {formatTime(notification.createdAt)}
                                    </span>
                                    <span className="text-[10px] text-gray-300">·</span>
                                    <span className="text-[10px] text-indigo-500 capitalize bg-indigo-50 px-1 py-0.5 rounded">
                                      {notification.type.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
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
                            .map(page => renderWikiPageRow(page, 0, 'root-page'))}
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

      {showFolderVisibilityModal != null && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center"
            onClick={() => {
              if (!fvSaving) {
                setShowFolderVisibilityModal(null);
                setFvError(null);
              }
            }}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
            <div
              className="pointer-events-auto w-[420px] max-w-[92vw] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Folder &amp; Visibility</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(() => {
                      const p = wikiPages.find(x => x.id === showFolderVisibilityModal);
                      return p ? (p.title || '(Untitled)') : '';
                    })()}
                  </p>
                </div>
              </div>

              <div className="px-5 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Folder</label>
                  <select
                    value={fvFolderId}
                    disabled={fvSaving}
                    onChange={(e) => {
                      setFvFolderId(e.target.value ? Number(e.target.value) : '');
                      if (fvError) setFvError(null);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">— Root (no folder) —</option>
                    {flattenFoldersSidebar(wikiFolders, 0).map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {'— '.repeat(opt.depth)}
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Visibility</label>
                  <select
                    value={fvVisibility}
                    disabled={fvSaving}
                    onChange={(e) => {
                      setFvVisibility(e.target.value as 'PRIVATE' | 'TEAM' | 'PUBLIC');
                      if (fvError) setFvError(null);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="PRIVATE">Private — Only you</option>
                    <option value="TEAM">Team — Team members only</option>
                    <option value="PUBLIC">Public — All organization users</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Controls who can view and edit this document.</p>
                </div>

                {fvError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {fvError}
                  </div>
                )}
              </div>

              <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={fvSaving}
                  onClick={() => {
                    setShowFolderVisibilityModal(null);
                    setFvError(null);
                  }}
                  className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={fvSaving}
                  onClick={async () => {
                    if (showFolderVisibilityModal == null) return;
                    setFvSaving(true);
                    setFvError(null);
                    try {
                      const payload: { folderId?: number; visibility: 'PRIVATE' | 'TEAM' | 'PUBLIC' } = {
                        visibility: fvVisibility,
                      };
                      if (fvFolderId !== '') {
                        payload.folderId = fvFolderId;
                      }
                      await wikiApi.updatePage(showFolderVisibilityModal, payload);
                      setShowFolderVisibilityModal(null);
                      forceReloadWikiTree();
                    } catch (err) {
                      console.error('Failed to update folder/visibility', err);
                      setFvError(
                        err instanceof Error ? err.message : 'Failed to update settings.'
                      );
                    } finally {
                      setFvSaving(false);
                    }
                  }}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                  {fvSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
