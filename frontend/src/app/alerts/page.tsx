'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import api from '@/lib/api';
import { Alert } from '@/types';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  return (
    <DashboardLayout>
      <Header
        title="Alert History"
        description="View and manage all emergency alerts"
      />

      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Generated Reports & Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-500">No alerts generated yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Emergency Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(alert.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{alert.emergency_type}</TableCell>
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
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
