import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, 
  Bug, 
  FolderOpen, 
  Users, 
  FileText, 
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Search,
  Bell,
  Plus,
  MoreHorizontal,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { teamApi, type TeamResponse } from '@/services/api';
import { currentUser, mockIssues, mockProjects } from '@/data/mockData';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  href?: string;
  badge?: number;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  const [teams, setTeams] = useState<TeamResponse[]>([]);

  const getMenuItems = () => [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { id: 'issues', label: 'My Issues', icon: Bug, href: '/issues', badge: mockIssues.length },
    { id: 'projects', label: 'My Projects', icon: FolderOpen, href: '/projects', badge: mockProjects.length },
    { id: 'teams', label: 'My Teams', icon: Users, badge: teams.length },
    { id: 'wiki', label: 'Wiki', icon: FileText, href: '/wiki' },
    { id: 'reports', label: 'Reports', icon: BarChart3, href: '/reports' },
  ];

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsData = await teamApi.getAllTeams();
        setTeams(teamsData);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      }
    };

    fetchTeams();
  }, []);
  
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

  const unreadCount = 3;
  const isCreateTeamPage = router.pathname === '/teams/new';

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-gray-100 transition-all duration-300 z-40 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="h-full flex flex-col">
        {/* User Profile & Actions - Same Row */}
        {!isCreateTeamPage && (
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {/* User Profile */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 truncate">{currentUser.role}</p>
                  </div>
                )}
              </div>
              
              {/* Search & Notifications */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button 
                  onClick={handleSearchClick}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Search"
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
                  
                  {showNotifications && !collapsed && (
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
              <ArrowLeft className="w-4 h-4" />
              {!collapsed && <span>Back to app</span>}
            </button>
          ) : (
            getMenuItems().map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href;
            
            if (item.id === 'teams') {
              return (
                <div key={item.id}>
                  <div 
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all duration-200 ease-in-out cursor-pointer ${
                      isActive 
                        ? 'bg-gray-500 text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:shadow-sm'
                    }`}
                    onClick={handleTeamsClick}
                  >
                    <Icon className="w-4 h-4 transition-transform duration-200" />
                    {!collapsed && (
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
                    {collapsed && item.badge && (
                      <span className="bg-gray-200 text-gray-700 w-4 h-4 rounded-full flex items-center justify-center text-xs">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  
                  {!collapsed && expandedMenu === 'teams' && (
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
            
            return (
              <Link
                key={item.id}
                href={item.href!}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all duration-200 ease-in-out ${
                  isActive 
                    ? 'bg-gray-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:shadow-sm hover:scale-[1.02]'
                }`}
              >
                <Icon className="w-4 h-4 transition-transform duration-200" />
                {!collapsed && (
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
                {collapsed && item.badge && (
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
          <div className="p-3 border-t border-gray-200 space-y-1">
            <button className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all duration-200 ease-in-out ${
              collapsed ? 'justify-center text-gray-600 hover:bg-gray-100' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:shadow-sm'
            }`}
            title="Settings">
              <Settings className="w-4 h-4" />
              {!collapsed && <span>Settings</span>}
            </button>
            <button 
              onClick={handleLogout}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all duration-200 ease-in-out ${
                collapsed ? 'justify-center text-gray-600 hover:bg-gray-100' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800 hover:shadow-sm'
              }`}
              title="Logout">
              <LogOut className="w-4 h-4" />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 bg-white border border-gray-300 rounded-full p-1.5 hover:bg-gray-100 hover:shadow-md hover:scale-110 transition-all duration-200 ease-in-out"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4 text-gray-600" /> : <ChevronLeft className="w-4 h-4 text-gray-600" />}
        </button>
      </div>
    </aside>
  );
}
