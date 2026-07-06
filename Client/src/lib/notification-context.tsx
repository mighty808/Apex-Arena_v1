import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { toast } from 'react-toastify';
import { useAuth } from './auth-context';
import {
  notificationService,
  type NotificationItem,
} from '../services/notification.service';
import { getOrCreateSocket, disconnectSocket } from './socket';
import { maybeAutoEnablePush, subscribeToPush } from './push';

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  fetchMore: () => void;
  refresh: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

const EMPTY_CTX: NotificationContextValue = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasMore: false,
  error: null,
  fetchMore: () => {},
  refresh: () => {},
  markRead: async () => {},
  markAllRead: async () => {},
  deleteNotification: async () => {},
};

export function useNotifications(): NotificationContextValue {
  return useContext(NotificationContext) ?? EMPTY_CTX;
}

export function NotificationProvider({ children }: PropsWithChildren) {
  const { tokens, user } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const bootedRef = useRef(false);

  const loadPage = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await notificationService.getNotifications({
        page: pageNum,
        limit: 20,
      });
      setNotifications((prev) =>
        pageNum === 1 ? result.notifications : [...prev, ...result.notifications],
      );
      setHasMore(result.pagination.page < result.pagination.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    notificationService.getUnreadCount().then(setUnreadCount).catch(() => {});
    loadPage(1);
  }, [loadPage]);

  // Push notifications: silently restore a lost subscription if permission is
  // already granted, or invite first-time users once. The permission prompt
  // itself only fires from the toast button click, a required user gesture.
  useEffect(() => {
    if (!user) return;

    void maybeAutoEnablePush(() => {
      const enable = () => {
        toast.dismiss('push-invite');
        subscribeToPush()
          .then(() => toast.success('Tournament alerts enabled!'))
          .catch(() => toast.info('You can enable alerts anytime in Settings → Notifications.'));
      };

      toast.info(
        <div>
          <p className="font-semibold text-sm">Never miss a tournament</p>
          <p className="text-xs text-slate-300 mt-0.5">
            Get an alert when a tournament opens for a game you play, even when the app is closed.
          </p>
          <button
            onClick={enable}
            className="mt-2 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors"
          >
            Enable alerts
          </button>
        </div>,
        { toastId: 'push-invite', autoClose: false, closeOnClick: false, draggable: false },
      );
    });
  }, [user]);

  const fetchMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    const next = page + 1;
    setPage(next);
    loadPage(next);
  }, [isLoading, hasMore, page, loadPage]);

  const refresh = useCallback(() => {
    setPage(1);
    setHasMore(true);
    loadPage(1);
    notificationService.getUnreadCount().then(setUnreadCount).catch(() => {});
  }, [loadPage]);

  // Socket: connect when authenticated, disconnect on logout
  useEffect(() => {
    const token = tokens?.accessToken;
    if (!token || !user) {
      disconnectSocket();
      return;
    }

    const socket = getOrCreateSocket(token);

    const handleNew = (payload: {
      notification_id: string;
      type: string;
      title: string;
      message: string;
      action_url?: string;
      created_at: string;
    }) => {
      const item: NotificationItem = {
        id: payload.notification_id,
        type: payload.type,
        priority: 'normal',
        title: payload.title,
        message: payload.message,
        actionUrl: payload.action_url,
        isRead: false,
        createdAt: payload.created_at,
      };

      setNotifications((prev) => [item, ...prev]);
      setUnreadCount((n) => n + 1);

      toast.info(
        <div>
          <p className="font-semibold text-sm">{payload.title}</p>
          <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{payload.message}</p>
        </div>,
        { autoClose: 4500 },
      );
    };

    socket.on('notification:new', handleNew);

    return () => {
      socket.off('notification:new', handleNew);
    };
  }, [tokens?.accessToken, user]);

  const markRead = useCallback(async (id: string) => {
    await notificationService.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((n) => Math.max(0, n - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationService.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(
    async (id: string) => {
      const target = notifications.find((n) => n.id === id);
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.isRead) {
        setUnreadCount((n) => Math.max(0, n - 1));
      }
    },
    [notifications],
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        hasMore,
        error,
        fetchMore,
        refresh,
        markRead,
        markAllRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
