import { formatDate } from '../utils/constants';

export default function NotificationToast({ toasts, onDismiss, onClick, typeIcons }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-16 sm:top-20 left-3 right-3 sm:left-auto sm:right-4 z-[100] flex flex-col gap-3 max-w-sm sm:w-full pointer-events-none">
      {toasts.map((n) => (
        <div
          key={n.toastId}
          className="pointer-events-auto animate-slide-up rounded-2xl border border-primary-500/40 p-4 shadow-glow cursor-pointer"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            boxShadow: 'var(--shadow-card), 0 0 24px var(--primary-glow)',
          }}
          onClick={() => onClick(n)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onClick(n)}
        >
          <div className="flex gap-3">
            <span className="text-2xl shrink-0">{typeIcons[n.type] || '🔔'}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-main text-sm">{n.title}</p>
              <p className="text-muted text-xs mt-1 line-clamp-2">{n.message}</p>
              <p className="text-primary-500 text-xs mt-2 font-medium">Tap to open →</p>
            </div>
            <button
              type="button"
              className="text-subtle hover:text-main text-lg leading-none shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(n.toastId);
              }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
