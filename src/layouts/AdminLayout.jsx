// layouts/AdminLayout.jsx
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { ToastProvider } from '../contexts/ToastContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Đọc preference từ localStorage
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('adminDarkMode') === 'true';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('adminDarkMode', String(darkMode));
  }, [darkMode]);

  return (
    <ToastProvider>
      <NotificationProvider>
        <div className="flex h-screen bg-slate-50 dark:bg-gray-950 overflow-hidden">
          {/* Sidebar */}
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />

          {/* Main area */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <Topbar darkMode={darkMode} onToggleDark={() => setDarkMode((v) => !v)} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </main>
          </div>
        </div>
      </NotificationProvider>
    </ToastProvider>
  );
}
