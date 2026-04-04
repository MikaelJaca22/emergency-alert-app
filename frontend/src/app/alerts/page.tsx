'use client';

import { useState, useEffect, useMemo } from 'react';
import DashboardLayout, { Header } from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import api from '@/lib/api';
import { Alert } from '@/types';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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

  const handleResolveAlert = async (id: string) => {
    setActionLoading(id);
    try {
      await api.put(`/alerts/${id}/resolve`);
      await fetchAlerts();
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
    } catch (error) {
      console.error('Failed to cancel alert:', error);
    } finally {
      setActionLoading(null);
    }
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
    const variant = level === 'critical' || level === 'high' ? 'danger' : level === 'medium' ? 'warning' : 'primary';
    return <Badge variant={variant}>{level.toUpperCase()}</Badge>;
  };

  return (
    <DashboardLayout>
      <Header
        title="Alert History"
        description="View and manage all emergency alerts"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="animate-slide-up stagger-1">
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
        </div>

        <div className="animate-slide-up stagger-2">
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
        </div>

        <div className="animate-slide-up stagger-3">
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
        </div>

        <div className="animate-slide-up stagger-4">
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
      </div>

      <Card className="animate-slide-up stagger-5">
        <CardHeader>
          <CardTitle>Alert History ({alerts.length} results)</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl">
              <p className="text-slate-500">No alerts found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Date/Time</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Emergency Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Location</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Level</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{new Date(alert.created_at).toLocaleString()}</td>
                      <td className="py-3 px-4 font-medium text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => openDetailsModal(alert)}>{alert.emergency_type}</td>
                      <td className="py-3 px-4 text-slate-600">{alert.location}</td>
                      <td className="py-3 px-4">{getLevelBadge(alert.alert_level)}</td>
                      <td className="py-3 px-4">{getStatusBadge(alert.status)}</td>
                      <td className="py-3 px-4">
                        {alert.status === 'active' && (
                          <div className="flex gap-2">
                            <Button variant="success" size="sm" onClick={() => handleResolveAlert(alert.id)} loading={actionLoading === alert.id}>
                              Resolve
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleCancelAlert(alert.id)} loading={actionLoading === alert.id} className="text-red-600 hover:bg-red-50">
                              Cancel
                            </Button>
                          </div>
                        )}
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
