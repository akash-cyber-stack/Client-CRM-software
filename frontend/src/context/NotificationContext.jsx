import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { notificationsApi } from '../api';
import { getNotificationPrefs } from '../utils/notificationPrefs';
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

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const lastPollRef = useRef(new Date().toISOString());
  const seenIdsRef = useRef(new Set());

  const handleNotificationClick = useCallback(
    async (n) => {
      try {
        await notificationsApi.read(n.id);
      } catch {
        /* ignore */
      }
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
      );
      setUnreadCount((c) => Math.max(0, c - (n.isRead ? 0 : 1)));
      const path = n.path || '/';
      navigate(path);
    },
    [navigate]
  );

  const alertNew = useCallback(
    (items) => {
      const prefs = getNotificationPrefs();
      const fresh = items.filter((n) => !seenIdsRef.current.has(n.id) && !n.isRead);
      if (!fresh.length) return;

      fresh.forEach((n) => {
        seenIdsRef.current.add(n.id);
        if (prefs.soundEnabled) playNotificationSound();
        if (prefs.desktopEnabled) {
          showDesktopNotification({
            title: n.title,
            body: n.message,
            tag: n.id,
            onClick: () => handleNotificationClick(n),
          });
        }
        if (prefs.toastEnabled) {
          setToasts((prev) => [
            ...prev.slice(-4),
            { ...n, toastId: `${n.id}-${Date.now()}` },
          ]);
        }
      });
    },
    [handleNotificationClick]
  );

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationsApi.poll({ since: lastPollRef.current });
      const { notifications: list, unreadCount: count } = res.data.data;
      lastPollRef.current = new Date().toISOString();

      if (list?.length) alertNew(list);

      const allRes = await notificationsApi.list({ limit: 50 });
      const enriched = allRes.data.data || [];
      setNotifications(enriched);
      setUnreadCount(count ?? enriched.filter((n) => !n.isRead).length);
    } catch {
      /* silent */
    }
  }, [user, alertNew]);

  useEffect(() => {
    if (!user) return undefined;

    const init = async () => {
      try {
        const allRes = await notificationsApi.list({ limit: 50 });
        const enriched = allRes.data.data || [];
        enriched.forEach((n) => seenIdsRef.current.add(n.id));
        setNotifications(enriched);
        setUnreadCount(enriched.filter((n) => !n.isRead).length);
        lastPollRef.current = new Date().toISOString();
      } catch {
        /* ignore */
      }
    };
    init();

    const prefs = getNotificationPrefs();
    const ms = Math.max(15, prefs.pollIntervalSec || 30) * 1000;
    const id = setInterval(refresh, ms);
    return () => clearInterval(id);
  }, [user, refresh]);

  const markAllRead = async () => {
    await notificationsApi.readAll();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
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
