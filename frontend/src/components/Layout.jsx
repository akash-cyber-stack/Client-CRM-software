import { Outlet } from 'react-router-dom';
import { NotificationProvider } from '../context/NotificationContext';
import { LayoutProvider, useLayout } from '../context/LayoutContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import CommandPalette from './CommandPalette';

function LayoutShell() {
  const { sidebarOpen } = useLayout();

  return (
    <div className="min-h-screen min-h-[100dvh] bg-app flex">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col min-w-0 w-full transition-[margin] duration-300 ease-out ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        }`}
      >
        <Navbar />
        <main className="flex-1 p-4 sm:p-5 lg:p-6 page-enter w-full overflow-x-hidden">
          <div className="w-full max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Layout() {
  return (
    <LayoutProvider>
      <NotificationProvider>
        <CommandPalette />
        <LayoutShell />
      </NotificationProvider>
    </LayoutProvider>
  );
}
