import { useState } from 'react';
import { Search, Bell, User, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Notification {
  id: string;
  title: string;
  type: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  { id: '1', title: 'Issue #123 assigned to you', type: 'issue', read: false },
  { id: '2', title: 'Comment on Issue #456', type: 'comment', read: false },
  { id: '3', title: 'Project updated: Website Redesign', type: 'project', read: true },
  { id: '4', title: 'Mentioned in wiki page', type: 'wiki', read: false },
];

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  
  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search issues, projects, wiki..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold">Notifications</h3>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {mockNotifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <p className={`text-sm ${!notification.read ? 'font-medium' : 'text-gray-600'}`}>
                      {notification.title}
                    </p>
                    <span className="text-xs text-gray-400 capitalize">{notification.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
            {user?.name ? user.name.charAt(0) : '?'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium">{user?.name || 'Unknown User'}</p>
            <p className="text-xs text-gray-500">{user?.role || 'Unknown Role'}</p>
          </div>
          <User className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </header>
  );
}
