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
import { Alert } from '@/types';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  const [filters, setFilters] = useState({
    status: '',
    emergency_type: '',
    alert_level: '',
    search: '',
    startDate: '',
    endDate: '',
  });

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/alerts');
      setAlerts(response.data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (filters.status && alert.status !== filters.status) return false;
      if (filters.emergency_type && alert.emergency_type !== filters.emergency_type) return false;
      if (filters.alert_level && alert.alert_level !== filters.alert_level) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        if (!alert.emergency_type.toLowerCase().includes(search) &&
            !alert.location.toLowerCase().includes(search) &&
            !alert.instructions.toLowerCase().includes(search)) {
          return false;
        }
      }
      if (filters.startDate && new Date(alert.created_at) < new Date(filters.startDate)) return false;
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (new Date(alert.created_at) > endDate) return false;
      }
      return true;
    });
  }, [alerts, filters]);

  const handleResolveAlert = async (id: string) => {
    setActionLoading(id);
    try {
      await api.put(`/alerts/${id}/resolve`);
      await fetchAlerts();
      setSelectedAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelAlert = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this alert?')) return;
    setActionLoading(id);
    try {
      await api.put(`/alerts/${id}/cancel`);
      await fetchAlerts();
      setSelectedAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to cancel alert:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkResolve = async () => {
    if (selectedAlerts.size === 0) return;
    if (!confirm(`Are you sure you want to resolve ${selectedAlerts.size} alerts?`)) return;
    
    try {
      await api.post('/alerts/bulk-resolve', { ids: Array.from(selectedAlerts) });
      await fetchAlerts();
      setSelectedAlerts(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error('Failed to bulk resolve alerts:', error);
    }
  };

  const handleBulkCancel = async () => {
    if (selectedAlerts.size === 0) return;
    if (!confirm(`Are you sure you want to cancel ${selectedAlerts.size} alerts?`)) return;
    
    try {
      await api.post('/alerts/bulk-cancel', { ids: Array.from(selectedAlerts) });
      await fetchAlerts();
      setSelectedAlerts(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error('Failed to bulk cancel alerts:', error);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAlerts(new Set());
    } else {
      setSelectedAlerts(new Set(filteredAlerts.filter(a => a.status === 'active').map(a => a.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectAlert = (id: string) => {
    const newSet = new Set(selectedAlerts);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedAlerts(newSet);
    setSelectAll(newSet.size === filteredAlerts.filter(a => a.status === 'active').length);
  };

  const handleExport = () => {
    const data = filteredAlerts.map(alert => ({
      'Date/Time': new Date(alert.created_at).toLocaleString(),
      'Emergency Type': alert.emergency_type,
      'Location': alert.location,
      'Level': alert.alert_level.toUpperCase(),
      'Status': alert.status,
      'Instructions': alert.instructions,
      'Resolved At': alert.resolved_at ? new Date(alert.resolved_at).toLocaleString() : '',
    }));
    
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alerts-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      emergency_type: '',
      alert_level: '',
      search: '',
      startDate: '',
      endDate: '',
    });
  };

  const getStatusBadge = (status: Alert['status']) => {
    const variants = {
      active: { variant: 'danger' as const, label: 'Active' },
      resolved: { variant: 'success' as const, label: 'Resolved' },
      cancelled: { variant: 'default' as const, label: 'Cancelled' },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant} dot={status === 'active'}>{label}</Badge>;
  };

  const getLevelBadge = (level: Alert['alert_level']) => {
    const variants = {
      low: { variant: 'info' as const },
      medium: { variant: 'warning' as const },
      high: { variant: 'danger' as const },
      critical: { variant: 'danger' as const },
    };
    return <Badge variant={variants[level].variant}>{level.toUpperCase()}</Badge>;
  };

  const openDetailsModal = (alert: Alert) => {
    setSelectedAlert(alert);
    setShowDetailsModal(true);
  };

  const stats = useMemo(() => ({
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    cancelled: alerts.filter(a => a.status === 'cancelled').length,
  }), [alerts]);

  const emergencyTypes = Array.from(new Set(alerts.map(a => a.emergency_type)));

  return (
    <DashboardLayout>
      <Header
        title="Alert History"
        description="View and manage all emergency alerts"
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Alerts</p>
                <p className="text-xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-red-500">Active</p>
                <p className="text-xl font-bold text-red-900">{stats.active}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-green-500">Resolved</p>
                <p className="text-xl font-bold text-green-900">{stats.resolved}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Cancelled</p>
                <p className="text-xl font-bold text-gray-900">{stats.cancelled}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card>
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Input
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full"
              />
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full"
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
              <Select
                value={filters.emergency_type}
                onChange={(e) => setFilters({ ...filters, emergency_type: e.target.value })}
                className="w-full"
                options={[
                  { value: '', label: 'All Types' },
                  ...emergencyTypes.map(type => ({ value: type, label: type })),
                ]}
              />
              <Select
                value={filters.alert_level}
                onChange={(e) => setFilters({ ...filters, alert_level: e.target.value })}
                className="w-full"
                options={[
                  { value: '', label: 'All Levels' },
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'critical', label: 'Critical' },
                ]}
              />
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full"
              />
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {selectedAlerts.size > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="flex items-center justify-between py-3">
              <span className="text-sm text-blue-700 font-medium">
                {selectedAlerts.size} alert{selectedAlerts.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button variant="success" size="sm" onClick={handleBulkResolve}>
                  Resolve Selected
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-100" onClick={handleBulkCancel}>
                  Cancel Selected
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Alert History ({filteredAlerts.length} results)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-500">No alerts found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </TableHead>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Emergency Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlerts.map((alert) => (
                      <TableRow key={alert.id} className={selectedAlerts.has(alert.id) ? 'bg-blue-50' : ''}>
                        <TableCell>
                          {alert.status === 'active' && (
                            <input
                              type="checkbox"
                              checked={selectedAlerts.has(alert.id)}
                              onChange={() => handleSelectAlert(alert.id)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(alert.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium cursor-pointer hover:text-blue-600" onClick={() => openDetailsModal(alert)}>
                          {alert.emergency_type}
                        </TableCell>
                        <TableCell>{alert.location}</TableCell>
                        <TableCell>{getLevelBadge(alert.alert_level)}</TableCell>
                        <TableCell>{getStatusBadge(alert.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {alert.status === 'active' && (
                              <>
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleResolveAlert(alert.id)}
                                  loading={actionLoading === alert.id}
                                >
                                  Resolve
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelAlert(alert.id)}
                                  loading={actionLoading === alert.id}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            {alert.status !== 'active' && (
                              <span className="text-sm text-slate-500">
                                {alert.resolved_at && `Resolved ${new Date(alert.resolved_at).toLocaleString()}`}
                              </span>
                            )}
                          </div>
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
        title="Alert Details"
      >
        {selectedAlert && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Emergency Type</p>
                <p className="font-medium">{selectedAlert.emergency_type}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Level</p>
                {getLevelBadge(selectedAlert.alert_level)}
              </div>
              <div>
                <p className="text-sm text-slate-500">Location</p>
                <p className="font-medium">{selectedAlert.location}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                {getStatusBadge(selectedAlert.status)}
              </div>
              <div>
                <p className="text-sm text-slate-500">Created</p>
                <p className="font-medium">{new Date(selectedAlert.created_at).toLocaleString()}</p>
              </div>
              {selectedAlert.resolved_at && (
                <div>
                  <p className="text-sm text-slate-500">Resolved</p>
                  <p className="font-medium">{new Date(selectedAlert.resolved_at).toLocaleString()}</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Instructions</p>
              <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedAlert.instructions}</p>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
