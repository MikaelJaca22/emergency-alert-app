'use client';

import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';

interface HeaderProps {
  title: string;
  description?: string;
  onResetSystem?: () => void;
  resetLoading?: boolean;
}

export default function Header({ title, description, onResetSystem, resetLoading }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            {description && (
              <p className="text-sm text-slate-500 mt-1">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {onResetSystem && (
              <Button
                variant="outline"
                onClick={onResetSystem}
                loading={resetLoading}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset System
              </Button>
            )}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user?.full_name}</p>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-600 font-medium">Online</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-500/25">
                {user?.full_name?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
