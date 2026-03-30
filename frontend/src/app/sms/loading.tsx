'use client';

export default function SmsLoading() {
  return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-8 w-40 bg-slate-200 rounded mb-2"></div>
        <div className="h-4 w-56 bg-slate-200 rounded mb-6"></div>
        
        <div className="h-48 bg-slate-200 rounded-xl mb-6"></div>
        <div className="h-64 bg-slate-200 rounded-xl"></div>
      </div>
    </div>
  );
}
