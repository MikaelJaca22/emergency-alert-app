'use client';

export default function DashboardLoading() {
  return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded mb-2"></div>
        <div className="h-4 w-48 bg-slate-200 rounded mb-6"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-slate-200 rounded-xl"></div>
          <div className="h-64 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}
