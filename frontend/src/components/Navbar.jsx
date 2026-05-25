import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { sidebarOpen, openSidebar } = useLayout();

  return (
    <header
      className="h-14 sm:h-16 border-b border-default flex items-center justify-between gap-2 px-3 sm:px-5 lg:px-6 sticky top-0 z-30 backdrop-blur-md shrink-0"
      style={{ backgroundColor: 'var(--navbar-bg)' }}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {!sidebarOpen && (
          <button
            type="button"
            onClick={openSidebar}
            className="shrink-0 w-10 h-10 rounded-xl border border-default flex items-center justify-center text-main hover:border-primary-500/50 transition-colors"
            style={{ backgroundColor: 'var(--surface-hover)' }}
            aria-label="Open menu"
            title="Open sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="min-w-0 truncate">
          <p className="text-xs sm:text-sm text-muted truncate">
            Welcome, <span className="text-main font-medium">{user?.name}</span>
          </p>
          {user?.companyName && (
            <p className="text-[10px] sm:text-xs text-primary-500/90 truncate font-mono">{user.companyName}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <ThemeToggle />
        <NotificationBell />
        <button onClick={logout} className="btn-secondary text-xs sm:text-sm px-2.5 sm:px-4 py-2">
          <span className="hidden sm:inline">Logout</span>
          <span className="sm:hidden">Exit</span>
        </button>
      </div>
    </header>
  );
}
