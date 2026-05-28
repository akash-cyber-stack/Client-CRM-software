import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';
import { canAccessFeature } from '../utils/planAccess';
import BrandLogo from './BrandLogo';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊', feature: 'dashboard' },
  { to: '/leads', label: 'Leads', icon: '👥', feature: 'leads' },
  { to: '/employees', label: 'Employees', icon: '👔', adminOnly: true, feature: 'employees' },
  { to: '/calls', label: 'Call History', icon: '📞', adminOnly: true, feature: 'calls' },
  { to: '/follow-ups', label: 'Follow-ups', icon: '📅', feature: 'follow-ups' },
  { to: '/reports', label: 'Reports', icon: '📈', adminOnly: true, feature: 'reports' },
  { to: '/settings', label: 'Settings', icon: '⚙️', adminOnly: true, feature: 'settings' },
];

export default function Sidebar() {
  const { user, isAdmin } = useAuth();
  const { sidebarOpen, closeSidebar } = useLayout();

  const handleNavClick = () => {
    if (window.innerWidth < 1024) closeSidebar();
  };

  return (
    <>
      {/* Backdrop — mobile only (desktop pushes content, no overlay) */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } bg-black/60`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <aside
        className={`fixed left-0 top-0 z-50 lg:z-30 h-full w-[min(85vw,280px)] sm:w-72 lg:w-64 flex flex-col border-r border-default shadow-2xl lg:shadow-none transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: 'var(--sidebar-bg)' }}
        aria-hidden={!sidebarOpen}
      >
        <div className="p-4 sm:p-5 border-b border-default flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo size="sm" className="shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold text-main truncate">Sales Lead CRM</h1>
              <p className="text-xs text-muted truncate">Lead & Call Management</p>
            </div>
          </div>
          <button
            type="button"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-main shrink-0"
            style={{ backgroundColor: 'var(--surface-hover)' }}
            onClick={closeSidebar}
            aria-label="Close menu"
            title="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            if (item.feature && !canAccessFeature(user?.plan, item.feature)) return null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `crm-nav-link ${isActive ? 'crm-nav-link--active' : 'crm-nav-link--idle'}`
                }
              >
                <span className="text-base shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 sm:p-4 border-t border-default safe-bottom shrink-0">
          <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--surface-hover)' }}>
            <p className="font-medium text-sm text-main truncate">{user?.name}</p>
            <p className="text-muted text-xs truncate mt-0.5">{user?.role?.replace(/_/g, ' ')}</p>
            {typeof __APP_BUILD_ID__ !== 'undefined' && __APP_BUILD_ID__ !== 'local' && (
              <p className="text-[10px] text-subtle mt-1 font-mono">build {__APP_BUILD_ID__}</p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
