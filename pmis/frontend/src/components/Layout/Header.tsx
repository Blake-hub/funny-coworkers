import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Search, Bell, User, X, CheckCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import type { NotificationResponse } from '@/services/api';

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [popupAnchorLeft, setPopupAnchorLeft] = useState(false);
  const bellContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllAsRead,
    formatTime,
  } = useNotifications();
  const router = useRouter();

  useEffect(() => {
    if (!showNotifications || !bellContainerRef.current) return;
    const rect = bellContainerRef.current.getBoundingClientRect();
    const popupWidth = 384;
    const margin = 12;
    const spaceOnLeft = rect.right;
    const spaceOnRight = window.innerWidth - rect.left;
    const needsLeftAnchor = (spaceOnLeft < popupWidth + margin) && (spaceOnRight > spaceOnLeft);
    setPopupAnchorLeft(needsLeftAnchor);
  }, [showNotifications]);

  useEffect(() => {
    if (!showNotifications) return;
    const handleOutsideMouseDown = (e: MouseEvent) => {
      if (
        bellContainerRef.current &&
        bellContainerRef.current.contains(e.target as Node)
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

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
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

      <div className="flex items-center gap-4">
        <div className="relative" ref={bellContainerRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className={`absolute top-full mt-2 w-96 max-w-[calc(100vw-1.5rem)] bg-white border border-gray-200 rounded-lg shadow-xl z-50 ${
              popupAnchorLeft ? 'left-0' : 'right-0'
            }`}>
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700 transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                      <Bell className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">No notifications yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      When someone @mentions you in a wiki, you&apos;ll see it here.
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                        !notification.readStatus ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm leading-snug ${
                              !notification.readStatus
                                ? 'font-semibold text-gray-900'
                                : 'text-gray-600'
                            }`}>
                              {notification.title}
                            </p>
                            {!notification.readStatus && (
                              <span className="mt-1.5 flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {formatTime(notification.createdAt)}
                            </span>
                            <span className="text-xs text-gray-300">·</span>
                            <span className="text-xs text-indigo-500 capitalize bg-indigo-50 px-1.5 py-0.5 rounded">
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
