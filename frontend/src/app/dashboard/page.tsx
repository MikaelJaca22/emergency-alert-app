'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import StatsCard from '@/components/ui/StatsCard';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import api from '@/lib/api';
import { Resident, ResidentStats, Alert } from '@/types';

interface EmergencyReport {
  id: string;
  user_id: string;
  emergency_type: string;
  description: string;
  location: string;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<ResidentStats>({ total: 0, safe: 0, needs_help: 0, no_response: 0 });
  const [residents, setResidents] = useState<Resident[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [emergencyReports, setEmergencyReports] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, residentsRes, alertsRes, reportsRes] = await Promise.all([
        api.get('/residents/stats'),
        api.get('/residents'),
        api.get('/alerts/active'),
        api.get('/emergency-reports'),
      ]);
      setStats(statsRes.data);
      setResidents(residentsRes.data.slice(0, 5));
      setActiveAlerts(alertsRes.data);
      setEmergencyReports(reportsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSystem = useCallback(async () => {
    if (!confirm('Are you sure you want to reset the system? This will clear all active alerts and reset resident statuses.')) {
      return;
    }
    setResetLoading(true);
    try {
      await api.post('/alerts/reset');
      await fetchData();
    } catch (error) {
      console.error('Failed to reset system:', error);
    } finally {
      setResetLoading(false);
    }
  }, []);

  const getStatusBadge = useCallback((status: Resident['status']) => {
    const variants = {
      safe: { variant: 'success' as const, label: 'Safe' },
      needs_help: { variant: 'danger' as const, label: 'Needs Help' },
      no_response: { variant: 'warning' as const, label: 'No Response' },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant} dot>{label}</Badge>;
  }, []);

  return (
    <DashboardLayout>
      <Header
        title="Emergency Dashboard"
        description="Monitor community safety in real-time"
        onResetSystem={handleResetSystem}
        resetLoading={resetLoading}
      />

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <div className="animate-slide-up stagger-1">
            <StatsCard
              title="Total Residents"
              value={stats.total}
              variant="primary"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
            />
          </div>
          <div className="animate-slide-up stagger-2">
            <StatsCard
              title="Safe"
              value={stats.safe}
              variant="success"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
            />
          </div>
          <div className="animate-slide-up stagger-3">
            <StatsCard
              title="Need Help"
              value={stats.needs_help}
              variant="danger"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
          </div>
          <div className="animate-slide-up stagger-4">
            <StatsCard
              title="No Response"
              value={stats.no_response}
              variant="warning"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Emergency Status */}
          <div className="lg:col-span-2 animate-slide-up stagger-5">
            <Card>
              <CardHeader>
                <CardTitle>Current Emergency Status</CardTitle>
              </CardHeader>
              <CardContent>
                {residents.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl">
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="text-slate-500">No residents in database. Add residents to see status.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resident</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Update</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {residents.map((resident) => (
                        <TableRow key={resident.id}>
                          <TableCell className="font-medium">{resident.full_name}</TableCell>
                          <TableCell>{resident.contact_number}</TableCell>
                          <TableCell>{getStatusBadge(resident.status)}</TableCell>
                          <TableCell className="text-slate-500">
                            {new Date(resident.last_updated).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Dispatch & Decisions */}
          <div className="animate-slide-up stagger-6">
            <Card>
              <CardHeader>
                <CardTitle>Dispatch & Decisions</CardTitle>
              </CardHeader>
              <CardContent>
                {activeAlerts.length === 0 ? (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-800">No Active Emergencies</p>
                        <p className="text-sm text-blue-600 mt-0.5">No dispatches required at this time.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-xl border-l-4 ${
                          alert.alert_level === 'critical'
                            ? 'bg-red-50 border-red-500'
                            : alert.alert_level === 'high'
                            ? 'bg-orange-50 border-orange-500'
                            : alert.alert_level === 'medium'
                            ? 'bg-amber-50 border-amber-500'
                            : 'bg-blue-50 border-blue-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-900">{alert.emergency_type}</span>
                          <Badge
                            variant={
                              alert.alert_level === 'critical'
                                ? 'danger'
                                : alert.alert_level === 'high'
                                ? 'warning'
                                : 'primary'
                            }
                            size="sm"
                          >
                            {alert.alert_level}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{alert.location}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Emergency Reports from Residents */}
        <div className="mt-6 animate-slide-up stagger-6">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Reports from Residents</CardTitle>
            </CardHeader>
            <CardContent>
              {emergencyReports.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-slate-500">No emergency reports from residents yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reported</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emergencyReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.emergency_type}</TableCell>
                        <TableCell>{report.location || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{report.description}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              report.status === 'resolved' ? 'success' : 
                              report.status === 'acknowledged' ? 'primary' : 'warning'
                            }
                            dot
                          >
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {new Date(report.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {report.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  await api.put(`/emergency-reports/${report.id}`, { status: 'acknowledged' });
                                  await fetchData();
                                }}
                              >
                                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </Button>
                            )}
                            {report.status !== 'resolved' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  await api.put(`/emergency-reports/${report.id}`, { status: 'resolved' });
                                  await fetchData();
                                }}
                              >
                                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </Button>
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
      </div>
    </DashboardLayout>
  );
}
