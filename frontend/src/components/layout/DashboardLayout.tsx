'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from './Sidebar';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/ui/Toast';

interface HeaderProps {
  title: string;
  description?: string;
  onResetSystem?: () => void;
  resetLoading?: boolean;
}

export function Header({ title, description, onResetSystem, resetLoading }: HeaderProps) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="flex items-center justify-between mb-4 lg:mb-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="text-slate-500 text-sm mt-1 hidden sm:block">{description}</p>}
      </div>
      <div className="flex items-center gap-2 lg:gap-3">
        {onResetSystem && (
          <button
            onClick={onResetSystem}
            disabled={resetLoading}
            className="px-2 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {resetLoading ? 'Resetting...' : 'Reset System'}
          </button>
        )}
        <button
          onClick={handleLogout}
          className="px-2 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

function DashboardContent({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!loading && !user) {
    router.push('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 text-white z-30 flex items-center justify-between px-4">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-slate-800 rounded-lg"
        >
          {sidebarOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-bold">Emergency</span>
        </Link>
        <div className="w-10" /> {/* Spacer for balance */}
      </div>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="lg:pl-64 pt-14 lg:pt-0 transition-all duration-300">
        <div className="p-3 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <DashboardContent>{children}</DashboardContent>
      </ToastProvider>
    </AuthProvider>
  );
}