import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import {
  notificationApi,
  NotificationResponse,
} from '@/services/api';

interface NotificationContextType {
  notifications: NotificationResponse[];
  unreadCount: number;
  loading: boolean;
  fetchList: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  markNotificationRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  formatTime: (iso: string) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const lastFetchedUnreadRef = useRef<number>(-1);

  const fetchList = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await notificationApi.list();
      setNotifications(data.items);
      setUnreadCount(data.unreadCount);
      lastFetchedUnreadRef.current = data.unreadCount;
    } catch (error) {
      console.error('NotificationContext: Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificationApi.unreadCount();
      const lastKnown = lastFetchedUnreadRef.current;
      if (data.unreadCount !== lastKnown) {
        lastFetchedUnreadRef.current = data.unreadCount;
        setUnreadCount(data.unreadCount);
        await fetchList();
      } else {
        setUnreadCount((prev) =>
          prev === data.unreadCount ? prev : data.unreadCount
        );
      }
    } catch (error) {
      console.error('NotificationContext: Failed to poll unread count:', error);
    }
  }, [user, fetchList]);

  const markNotificationRead = useCallback(
    async (id: number) => {
      const target = notifications.find((n) => n.id === id);
      const wasUnread = target && !target.readStatus;
      if (wasUnread) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readStatus: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      try {
        await notificationApi.markRead(id);
        if (wasUnread) {
          lastFetchedUnreadRef.current = Math.max(
            0,
            lastFetchedUnreadRef.current - 1
          );
        }
      } catch (error) {
        console.error(
          'NotificationContext: Failed to mark notification as read:',
          error
        );
        await fetchList();
      }
    },
    [notifications, fetchList]
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readStatus: true }))
    );
    setUnreadCount(0);
    try {
      await notificationApi.markAllRead();
      lastFetchedUnreadRef.current = 0;
    } catch (error) {
      console.error(
        'NotificationContext: Failed to mark all notifications as read:',
        error
      );
      await fetchList();
    }
  }, [fetchList]);

  const formatTime = useCallback((iso: string): string => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHour = Math.floor(diffMs / 3600000);
      const diffDay = Math.floor(diffMs / 86400000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      if (diffDay < 7) return `${diffDay}d ago`;
      return d.toLocaleDateString();
    } catch {
      return iso;
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchList();
    const intervalId = setInterval(refreshUnreadCount, 30000);
    return () => clearInterval(intervalId);
  }, [user, fetchList, refreshUnreadCount]);

  useEffect(() => {
    if (!user) return;
    refreshUnreadCount();
  }, [user, router.asPath, refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchList,
        refreshUnreadCount,
        markNotificationRead,
        markAllAsRead,
        formatTime,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
};
