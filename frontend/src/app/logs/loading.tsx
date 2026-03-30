'use client';

export default function LogsLoading() {
  return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-8 w-40 bg-slate-200 rounded mb-2"></div>
        <div className="h-4 w-48 bg-slate-200 rounded mb-6"></div>
        
        <div className="h-96 bg-slate-200 rounded-xl"></div>
      </div>
    </div>
  );
}
