import { createContext, useContext, useEffect, useState } from 'react';

const LayoutContext = createContext(null);

function getInitialSidebarOpen() {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem('crm-sidebar-open');
  if (saved !== null) return saved === 'true';
  return window.innerWidth >= 1024;
}

export function LayoutProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(getInitialSidebarOpen);

  useEffect(() => {
    localStorage.setItem('crm-sidebar-open', String(sidebarOpen));
  }, [sidebarOpen]);

  const toggleSidebar = () => setSidebarOpen((o) => !o);
  const closeSidebar = () => setSidebarOpen(false);
  const openSidebar = () => setSidebarOpen(true);

  return (
    <LayoutContext.Provider value={{ sidebarOpen, toggleSidebar, closeSidebar, openSidebar }}>
      {children}
    </LayoutContext.Provider>
  );
}

export const useLayout = () => useContext(LayoutContext);
