'use client';

import { useState, useEffect } from 'react';
import DashboardLayout, { Header } from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';
import { SystemLog, ActionType, LogLevel } from '@/types';

export const dynamic = 'force-dynamic';

const ACTION_LABELS: Record<ActionType, string> = {
  login: 'Login',
  logout: 'Logout',
  register: 'Register',
  alert_create: 'Alert Created',
  alert_resolve: 'Alert Resolved',
  alert_cancel: 'Alert Cancelled',
  alert_bulk_resolve: 'Bulk Resolve',
  alert_bulk_cancel: 'Bulk Cancel',
  resident_create: 'Resident Created',
  resident_update: 'Resident Updated',
  resident_delete: 'Resident Deleted',
  resident_status_update: 'Status Updated',
  system_reset: 'System Reset',
  sms_sent: 'SMS Sent',
  sms_failed: 'SMS Failed',
};

export default function LogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState({ total: 0, today: 0, byLevel: {} as Record<string, number>, byAction: {} as Record<string, number> });
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.get('/logs', { params: { limit: 100 } }),
        api.get('/logs/stats'),
      ]);
      setLogs(logsRes.data.logs);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      showToast('Failed to load logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getLevelBadge = (level: LogLevel) => {
    const variants = {
      info: { variant: 'info' as const, label: 'INFO' },
      warning: { variant: 'warning' as const, label: 'WARNING' },
      error: { variant: 'danger' as const, label: 'ERROR' },
    };
    const { variant, label } = variants[level];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const openDetailsModal = (log: SystemLog) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  return (
    <DashboardLayout>
      <Header
        title="System Logs"
        description="View all administrative actions and system events"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 mb-4 lg:mb-6">
        <div className="animate-slide-up stagger-1">
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Logs</p>
                <p className="text-xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="animate-slide-up stagger-2">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-blue-500">Today</p>
                <p className="text-xl font-bold text-blue-900">{stats.today}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="animate-slide-up stagger-3">
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-yellow-500">Warnings</p>
                <p className="text-xl font-bold text-yellow-900">{stats.byLevel?.warning || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="animate-slide-up stagger-4">
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-red-500">Errors</p>
                <p className="text-xl font-bold text-red-900">{stats.byLevel?.error || 0}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="animate-slide-up stagger-5">
        <CardHeader>
          <CardTitle>System Activity ({logs.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 lg:py-12 bg-slate-50 rounded-xl">
              <p className="text-slate-500 text-sm lg:text-base">No system logs found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm font-medium text-slate-500">Date/Time</th>
                    <th className="text-left py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm font-medium text-slate-500">Action</th>
                    <th className="text-left py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm font-medium text-slate-500">Level</th>
                    <th className="text-left py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm font-medium text-slate-500 hidden md:table-cell">Description</th>
                    <th className="text-left py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm font-medium text-slate-500">Admin</th>
                    <th className="text-left py-2 lg:py-3 px-2 lg:px-4 text-xs lg:text-sm font-medium text-slate-500">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => openDetailsModal(log)}>
                      <td className="py-2 lg:py-3 px-2 lg:px-4 text-slate-500 text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleDateString()}</td>
                      <td className="py-2 lg:py-3 px-2 lg:px-4">
                        <span className="px-2 py-0.5 lg:py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="py-2 lg:py-3 px-2 lg:px-4">{getLevelBadge(log.level)}</td>
                      <td className="py-2 lg:py-3 px-2 lg:px-4 text-slate-600 text-sm max-w-[150px] truncate hidden md:table-cell">{log.description}</td>
                      <td className="py-2 lg:py-3 px-2 lg:px-4 text-slate-500 text-xs">{log.admin_email || 'System'}</td>
                      <td className="py-2 lg:py-3 px-2 lg:px-4">
                        <button className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Log Details"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Timestamp</p>
                <p className="font-medium">{new Date(selectedLog.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Level</p>
                {getLevelBadge(selectedLog.level)}
              </div>
              <div>
                <p className="text-sm text-slate-500">Admin</p>
                <p className="font-medium">{selectedLog.admin_email || 'System'}</p>
              </div>
              {selectedLog.entity_type && (
                <div>
                  <p className="text-sm text-slate-500">Entity Type</p>
                  <p className="font-medium">{selectedLog.entity_type}</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Description</p>
              <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedLog.description}</p>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
