'use client';

export default function ResidentsLoading() {
  return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded mb-2"></div>
        <div className="h-4 w-32 bg-slate-200 rounded mb-6"></div>
        
        <div className="h-96 bg-slate-200 rounded-xl"></div>
      </div>
    </div>
  );
}
