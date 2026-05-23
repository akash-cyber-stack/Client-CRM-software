import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { formatDate } from '../utils/constants';

const TYPE_LABELS = {
  LEAD_ASSIGNED: 'Lead',
  FOLLOW_UP_REMINDER: 'Follow-up',
  MISSED_FOLLOW_UP: 'Missed',
  CALL_RECORDING: 'Call',
  DUPLICATE_LEAD: 'Activity',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    refreshing,
    markAllRead,
    handleNotificationClick,
    refresh,
    typeIcons,
  } = useNotifications();

  const onItemClick = (n) => {
    setOpen(false);
    handleNotificationClick(n);
  };

  const onRefresh = () => refresh({ showLoading: true });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`relative p-2.5 rounded-xl border transition-all ${
          unreadCount > 0 ? 'border-primary-500/50 shadow-glow' : 'border-default'
        }`}
        style={{ backgroundColor: 'var(--surface-hover)' }}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
      >
        <span className={`text-lg ${unreadCount > 0 ? 'animate-pulse' : ''}`}>🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-bold ring-2 ring-[var(--bg-app)]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 mt-2 w-[min(100vw-2rem,380px)] rounded-2xl border border-default z-50 animate-slide-up overflow-hidden flex flex-col max-h-[min(70vh,480px)]"
            style={{ backgroundColor: 'var(--surface-elevated)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="p-4 border-b border-default flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-semibold text-main">Notifications</h3>
                <p className="text-xs text-muted">{unreadCount} unread</p>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={refreshing}
                  className="text-xs text-primary-500 hover:underline disabled:opacity-50"
                >
                  {refreshing ? 'Refreshing…' : 'Refresh'}
                </button>
                {unreadCount > 0 && (
                  <button type="button" onClick={markAllRead} className="text-xs text-muted hover:text-main">
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <p className="p-8 text-center text-muted text-sm">No new notifications</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => onItemClick(n)}
                    className="w-full text-left p-4 border-b border-default transition-colors hover:bg-[var(--surface-hover)] bg-primary-600/10 border-l-2 border-l-primary-500"
                  >
                    <div className="flex gap-3">
                      <span className="text-xl">{typeIcons[n.type] || '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-main text-sm">{n.title}</p>
                          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary-600/20 text-primary-400">
                            {TYPE_LABELS[n.type] || n.type}
                          </span>
                        </div>
                        <p className="text-muted text-xs mt-1">{n.message}</p>
                        <p className="text-subtle text-[10px] mt-1">{formatDate(n.createdAt)}</p>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1" />
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-3 border-t border-default shrink-0">
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="text-xs text-primary-500 hover:underline block text-center"
              >
                Notification & automation settings →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
