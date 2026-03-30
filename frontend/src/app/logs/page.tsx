'use client';

import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import api from '@/lib/api';
import { SystemLog, LogLevel, ActionType } from '@/types';

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

const ACTION_COLORS: Record<ActionType, string> = {
  login: 'bg-blue-100 text-blue-700',
  logout: 'bg-gray-100 text-gray-700',
  register: 'bg-purple-100 text-purple-700',
  alert_create: 'bg-red-100 text-red-700',
  alert_resolve: 'bg-green-100 text-green-700',
  alert_cancel: 'bg-orange-100 text-orange-700',
  alert_bulk_resolve: 'bg-green-100 text-green-700',
  alert_bulk_cancel: 'bg-orange-100 text-orange-700',
  resident_create: 'bg-blue-100 text-blue-700',
  resident_update: 'bg-indigo-100 text-indigo-700',
  resident_delete: 'bg-red-100 text-red-700',
  resident_status_update: 'bg-yellow-100 text-yellow-700',
  system_reset: 'bg-red-100 text-red-700',
  sms_sent: 'bg-green-100 text-green-700',
  sms_failed: 'bg-red-100 text-red-700',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, today: 0, byLevel: {} as Record<string, number>, byAction: {} as Record<string, number> });
  
  const [filters, setFilters] = useState({
    level: '' as LogLevel | '',
    action: '' as ActionType | '',
    search: '',
    startDate: '',
    endDate: '',
  });

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.level) params.append('level', filters.level);
      if (filters.action) params.append('action', filters.action);
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      params.append('limit', '100');
      
      const response = await api.get(`/logs?${params.toString()}`);
      setLogs(response.data.logs);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/logs/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(debounce);
  }, [filters]);

  const handleExport = () => {
    const data = logs.map(log => ({
      'Date/Time': new Date(log.created_at).toLocaleString(),
      'Action': ACTION_LABELS[log.action] || log.action,
      'Level': log.level.toUpperCase(),
      'Description': log.description,
      'Admin': log.admin_email || 'System',
      'Entity Type': log.entity_type || '',
      'Entity ID': log.entity_id || '',
    }));
    
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).map(v => `"${v || ''}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearFilters = () => {
    setFilters({
      level: '',
      action: '',
      search: '',
      startDate: '',
      endDate: '',
    });
  };

  const openDetailsModal = (log: SystemLog) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
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

  const getActionBadge = (action: ActionType) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ACTION_COLORS[action] || 'bg-gray-100 text-gray-700'}`}>
        {ACTION_LABELS[action] || action}
      </span>
    );
  };

  const actionTypes = Object.keys(ACTION_LABELS);

  return (
    <DashboardLayout>
      <Header
        title="System Logs"
        description="View all administrative actions and system events"
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Filters</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
              <Button variant="primary" size="sm" onClick={handleExport}>
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Input
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full"
              />
              <Select
                value={filters.level}
                onChange={(e) => setFilters({ ...filters, level: e.target.value as LogLevel | '' })}
                className="w-full"
                options={[
                  { value: '', label: 'All Levels' },
                  { value: 'info', label: 'Info' },
                  { value: 'warning', label: 'Warning' },
                  { value: 'error', label: 'Error' },
                ]}
              />
              <Select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value as ActionType | '' })}
                className="w-full"
                options={[
                  { value: '', label: 'All Actions' },
                  ...actionTypes.map(action => ({ value: action, label: ACTION_LABELS[action as ActionType] })),
                ]}
              />
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full"
                placeholder="Start Date"
              />
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full"
                placeholder="End Date"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up stagger-6">
          <CardHeader>
            <CardTitle>System Activity ({total} total entries)</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-slate-500">No system logs found.</p>
                <p className="text-sm text-slate-400 mt-1">Activity will appear here as admin actions are performed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openDetailsModal(log)}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {getActionBadge(log.action)}
                        </TableCell>
                        <TableCell>
                          {getLevelBadge(log.level)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.description}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.admin_email || <span className="text-slate-400">System</span>}
                        </TableCell>
                        <TableCell>
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            View
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                <p className="text-sm text-slate-500">Action</p>
                {getActionBadge(selectedLog.action)}
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
              {selectedLog.entity_id && (
                <div>
                  <p className="text-sm text-slate-500">Entity ID</p>
                  <p className="font-medium text-xs break-all">{selectedLog.entity_id}</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Description</p>
              <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedLog.description}</p>
            </div>
            {selectedLog.metadata && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Metadata</p>
                <pre className="text-xs bg-slate-100 p-3 rounded-lg overflow-auto max-h-40">
                  {JSON.stringify(JSON.parse(selectedLog.metadata), null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
