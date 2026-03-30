'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-8 max-w-lg animate-fade-in">
        {/* Icon */}
        <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30 mx-auto mb-8 animate-scale-in">
          <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold text-white mb-6 tracking-tight animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Emergency Alert
          <br />
          System
        </h1>

        {/* Description */}
        <p className="text-lg text-blue-100/80 mb-12 max-w-md mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Keep your community safe with real-time emergency notifications and resident status tracking.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Link
            href="/register"
            className="px-8 py-4 bg-white text-blue-900 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-250 ease-out shadow-lg shadow-white/10 hover:shadow-white/20 hover:scale-105"
          >
            Register
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 transition-all duration-250 ease-out shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105"
          >
            Sign In
          </Link>
        </div>

        {/* Admin link */}
        <p className="mt-8 text-blue-200/50 text-sm animate-slide-up" style={{ animationDelay: '0.4s' }}>
          Administrator?{' '}
          <Link href="/admin/login" className="text-blue-300 hover:text-white transition-colors duration-200">
            Admin Login
          </Link>
        </p>
      </div>
    </div>
  );
}
