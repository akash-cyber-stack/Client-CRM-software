import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/constants';

const TYPE_LABELS = {
  LEAD_ASSIGNED: 'Lead',
  FOLLOW_UP_REMINDER: 'Follow-up',
  MISSED_FOLLOW_UP: 'Missed',
  CALL_RECORDING: 'Call',
  DUPLICATE_LEAD: 'Activity',
};

const TYPE_STYLES = {
  LEAD_ASSIGNED: 'bg-blue-500/15 text-blue-500',
  FOLLOW_UP_REMINDER: 'bg-amber-500/15 text-amber-500',
  MISSED_FOLLOW_UP: 'bg-rose-500/15 text-rose-500',
  CALL_RECORDING: 'bg-emerald-500/15 text-emerald-500',
  DUPLICATE_LEAD: 'bg-violet-500/15 text-violet-500',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [animateBell, setAnimateBell] = useState(false);
  const toast = useToast();
  const prevUnread = useRef(0);
  const {
    notifications,
    unreadCount,
    refreshing,
    markAllRead,
    handleNotificationClick,
    refresh,
    typeIcons,
  } = useNotifications();

  const summary = useMemo(() => {
    if (!notifications.length) return 'You’re all caught up';
    return `${notifications.length} unread notification${notifications.length === 1 ? '' : 's'}`;
  }, [notifications.length]);

  const onItemClick = (n) => {
    setOpen(false);
    handleNotificationClick(n);
  };

  const onRefresh = async () => {
    const result = await refresh({ showLoading: true, fullRefresh: true });
    if (result?.ok) {
      toast.success(result.count ? `${result.count} notification(s)` : 'Notifications updated');
    } else {
      toast.error('Could not refresh notifications');
    }
  };

  useEffect(() => {
    if (unreadCount > prevUnread.current) {
      setAnimateBell(true);
      const timer = window.setTimeout(() => setAnimateBell(false), 900);
      return () => window.clearTimeout(timer);
    }
    prevUnread.current = unreadCount;
    return undefined;
  }, [unreadCount]);

  useEffect(() => {
    prevUnread.current = unreadCount;
  }, [unreadCount]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`relative flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-200 ${
          unreadCount > 0
            ? 'border-primary-500/60 bg-primary-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.18)]'
            : 'border-default bg-[var(--surface-hover)]'
        }`}
        style={{ backgroundColor: unreadCount > 0 ? 'rgba(59,130,246,0.08)' : 'var(--surface-hover)' }}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
      >
        <span className={`text-lg ${unreadCount > 0 ? 'animate-pulse' : ''} ${animateBell ? 'animate-bell-shake' : ''}`}>🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-[1.2rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-[var(--bg-app)]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px] sm:hidden" onClick={() => setOpen(false)} />
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col overflow-hidden rounded-t-[1.75rem] border border-default sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:w-[min(100vw-2rem,420px)] sm:rounded-2xl"
            style={{ backgroundColor: 'var(--surface-elevated)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="relative shrink-0 border-b border-default px-4 pb-4 pt-4 sm:px-4 sm:pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-primary-500/90">Inbox</p>
                  <h3 className="mt-1 text-base font-semibold text-main">Notifications</h3>
                  <p className="mt-1 text-sm text-muted">{summary}</p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onRefresh}
                    disabled={refreshing}
                    className="rounded-full border border-default px-3 py-1.5 text-xs font-medium text-main transition hover:border-primary-500/50 hover:text-primary-500 disabled:opacity-50"
                    style={{ backgroundColor: 'var(--surface-hover)' }}
                  >
                    {refreshing ? 'Refreshing…' : 'Refresh'}
                  </button>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="rounded-full px-3 py-1.5 text-xs font-medium text-muted transition hover:text-main"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-y-auto px-1 pb-1 pt-2 sm:px-1">
              {notifications.length === 0 ? (
                <div className="mx-3 my-8 rounded-2xl border border-dashed border-default px-5 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/10 text-2xl">
                    ✨
                  </div>
                  <p className="mt-4 text-sm font-semibold text-main">You’re all caught up</p>
                  <p className="mt-2 text-sm text-muted">New follow-ups, assignments, and alerts will appear here instantly.</p>
                </div>
              ) : (
                <div className="space-y-2 px-2 pb-2 sm:px-2">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => onItemClick(n)}
                      className="w-full rounded-2xl border border-default bg-[var(--surface)] px-3 py-3 text-left transition-all hover:border-primary-500/50 hover:bg-[var(--surface-hover)]"
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: 'var(--surface-hover)' }}>
                          {typeIcons[n.type] || '🔔'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-main break-words">{n.title}</p>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${TYPE_STYLES[n.type] || 'bg-primary-500/15 text-primary-500'}`}>
                              {TYPE_LABELS[n.type] || n.type}
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-muted break-words">{n.message}</p>
                          <div className="mt-2 flex items-center justify-between gap-3">
                            <p className="text-[11px] text-subtle">{formatDate(n.createdAt)}</p>
                            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary-500" />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-default px-4 py-3">
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-primary-500 transition hover:bg-primary-500/10"
              >
                Notification & automation settings
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
