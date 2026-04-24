import { useState } from 'react';
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
  Search,
  Bell
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { currentUser, mockIssues, mockProjects, mockTeams } from '@/data/mockData';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { id: 'issues', label: 'My Issues', icon: Bug, href: '/issues', badge: mockIssues.length },
  { id: 'projects', label: 'My Projects', icon: FolderOpen, href: '/projects', badge: mockProjects.length },
  { id: 'teams', label: 'My Teams', icon: Users, href: '/teams', badge: mockTeams.length },
  { id: 'wiki', label: 'Wiki', icon: FileText, href: '/wiki' },
  { id: 'reports', label: 'Reports', icon: BarChart3, href: '/reports' },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSearchClick = () => {
    router.push('/search');
  };

  const unreadCount = 3;

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-gray-100 transition-all duration-300 z-40 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="h-full flex flex-col">
        {/* User Profile & Actions - Same Row */}
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

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-sm ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full text-xs">
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
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-gray-200 space-y-1">
          <button className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-sm ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Settings">
            <Settings className="w-4 h-4" />
            {!collapsed && <span>Settings</span>}
          </button>
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-sm ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Logout">
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 bg-white border border-gray-300 rounded-full p-1 hover:bg-gray-100 transition-colors shadow-sm"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4 text-gray-600" /> : <ChevronLeft className="w-4 h-4 text-gray-600" />}
        </button>
      </div>
    </aside>
  );
}
