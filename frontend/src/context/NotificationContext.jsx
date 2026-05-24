import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { notificationsApi } from '../api';
import { getNotificationPrefs, requestDesktopPermission } from '../utils/notificationPrefs';
import { playNotificationSound, showDesktopNotification } from '../utils/notificationSound';
import NotificationToast from '../components/NotificationToast';

const NotificationContext = createContext(null);

const TYPE_ICONS = {
  LEAD_ASSIGNED: '👤',
  FOLLOW_UP_REMINDER: '📅',
  MISSED_FOLLOW_UP: '⚠️',
  CALL_RECORDING: '🎙️',
  DUPLICATE_LEAD: '🔄',
};

function pollIntervalMs() {
  const prefs = getNotificationPrefs();
  const base = Math.max(10, prefs.pollIntervalSec || 10) * 1000;
  return typeof document !== 'undefined' && document.hidden ? Math.min(5000, base) : base;
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [toasts, setToasts] = useState([]);
  const lastPollRef = useRef(new Date().toISOString());
  const seenIdsRef = useRef(new Set());

  const loadUnread = useCallback(async () => {
    const allRes = await notificationsApi.list({ limit: 50, unread: 'true' });
    const unread = allRes.data.data || [];
    setNotifications(unread);
    setUnreadCount(unread.length);
    return unread;
  }, []);

  const handleNotificationClick = useCallback(
    async (n) => {
      try {
        await notificationsApi.read(n.id);
      } catch {
        /* ignore */
      }
      setNotifications((prev) => prev.filter((x) => x.id !== n.id));
      setUnreadCount((c) => Math.max(0, c - (n.isRead ? 0 : 1)));
      const path = n.path || '/';
      navigate(path);
    },
    [navigate]
  );

  const alertNew = useCallback(
    (items) => {
      const prefs = getNotificationPrefs();
      const tabHidden = typeof document !== 'undefined' && document.hidden;
      const fresh = items.filter((n) => !seenIdsRef.current.has(n.id) && !n.isRead);
      if (!fresh.length) return;

      fresh.forEach((n) => {
        seenIdsRef.current.add(n.id);

        if (prefs.soundEnabled) playNotificationSound();

        const useDesktop = tabHidden || prefs.desktopEnabled;
        if (useDesktop && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            showDesktopNotification({
              title: n.title,
              body: n.message,
              tag: n.id,
              onClick: () => handleNotificationClick(n),
            });
          } else if (Notification.permission === 'default' && tabHidden) {
            void requestDesktopPermission();
          }
        }

        if (prefs.toastEnabled && !tabHidden) {
          setToasts((prev) => [
            ...prev.slice(-4),
            { ...n, toastId: `${n.id}-${Date.now()}` },
          ]);
        }
      });

      setNotifications((prev) => {
        const ids = new Set(prev.map((x) => x.id));
        const merged = [...prev];
        fresh.forEach((n) => {
          if (!ids.has(n.id)) merged.unshift(n);
        });
        return merged;
      });
      setUnreadCount((c) => c + fresh.length);
    },
    [handleNotificationClick]
  );

  const refresh = useCallback(
    async (options = {}) => {
      if (!user) return { ok: false };
      const { showLoading = false, fullRefresh = false } = options;
      if (showLoading) setRefreshing(true);
      try {
        const pollSince = fullRefresh
          ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          : lastPollRef.current;

        try {
          const res = await notificationsApi.poll({ since: pollSince });
          const { notifications: polled } = res.data.data || {};
          if (polled?.length) alertNew(polled);
        } catch {
          /* poll optional on manual refresh */
        }

        lastPollRef.current = new Date().toISOString();
        const unread = await loadUnread();
        setUnreadCount(unread.length);
        return { ok: true, count: unread.length };
      } catch (err) {
        return { ok: false, error: err };
      } finally {
        if (showLoading) setRefreshing(false);
      }
    },
    [user, alertNew, loadUnread]
  );

  useEffect(() => {
    if (!user) return undefined;

    const prefs = getNotificationPrefs();
    if (prefs.desktopEnabled) void requestDesktopPermission();

    const init = async () => {
      try {
        const unread = await loadUnread();
        unread.forEach((n) => seenIdsRef.current.add(n.id));
        lastPollRef.current = new Date().toISOString();
      } catch {
        /* ignore */
      }
    };
    void init();

    let intervalId;
    const schedule = () => {
      clearInterval(intervalId);
      intervalId = setInterval(() => {
        void refresh();
      }, pollIntervalMs());
    };
    schedule();

    const onVisibility = () => {
      schedule();
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user, refresh, loadUnread]);

  const markAllRead = async () => {
    await notificationsApi.readAll();
    setNotifications([]);
    setUnreadCount(0);
  };

  const dismissToast = (toastId) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        refreshing,
        refresh,
        markAllRead,
        handleNotificationClick,
        typeIcons: TYPE_ICONS,
      }}
    >
      {children}
      <NotificationToast
        toasts={toasts}
        onDismiss={dismissToast}
        onClick={(n) => {
          dismissToast(n.toastId);
          handleNotificationClick(n);
        }}
        typeIcons={TYPE_ICONS}
      />
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
