'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import api from '@/lib/api';
import { EMERGENCY_TYPES } from '@/types';
import Badge from '@/components/ui/Badge';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface EmergencyReport {
  id: string;
  user_id: string;
  emergency_type: string;
  description: string;
  location: string;
  status: string;
  created_at: string;
}

interface Alert {
  id: string;
  emergency_type: string;
  location: string;
  alert_level: string;
  instructions: string;
  status: string;
  created_at: string;
}

function ResidentDashboard() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [myReports, setMyReports] = useState<EmergencyReport[]>([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    emergency_type: '',
    description: '',
    location: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [alertsRes, reportsRes] = await Promise.all([
        api.get('/alerts/active'),
        api.get('/emergency-reports'),
      ]);
      setActiveAlerts(alertsRes.data);
      const filtered = reportsRes.data.filter((r: EmergencyReport) => r.user_id === user?.id);
      setMyReports(filtered);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/emergency-reports', {
        emergency_type: formData.emergency_type,
        description: formData.description,
        location: formData.location,
      });
      setSuccess(true);
      showToast('Emergency report submitted successfully!', 'success');
      setFormData({ emergency_type: '', description: '', location: '' });
      fetchData();
      setTimeout(() => {
        setSuccess(false);
        setShowReportForm(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to submit report:', error);
      showToast('Failed to submit emergency report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const getAlertBadge = (level: string) => {
    const variants: Record<string, 'danger' | 'warning' | 'info'> = {
      critical: 'danger',
      high: 'danger',
      medium: 'warning',
      low: 'info',
    };
    return <Badge variant={variants[level] || 'info'}>{level}</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="font-bold text-slate-900">Emergency Alert</h1>
                <p className="text-xs text-slate-500">Resident Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-slate-900">{user?.full_name || user?.username}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeAlerts.length > 0 && (
          <div className="mb-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-semibold text-red-800">Active Emergency Alerts</span>
              </div>
              <div className="space-y-2">
                {activeAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                    <div>
                      <p className="font-medium text-slate-900">{alert.emergency_type}</p>
                      <p className="text-sm text-slate-500">{alert.location}</p>
                      {alert.instructions && <p className="text-sm text-slate-600 mt-1">{alert.instructions}</p>}
                    </div>
                    {getAlertBadge(alert.alert_level)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>My Emergency Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {myReports.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-slate-500">No reports submitted yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myReports.map((report) => (
                      <div key={report.id} className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-900">{report.emergency_type}</span>
                          <Badge variant={report.status === 'resolved' ? 'success' : 'warning'}>
                            {report.status}
                          </Badge>
                        </div>
                        {report.location && <p className="text-sm text-slate-600 mb-1">Location: {report.location}</p>}
                        {report.description && <p className="text-sm text-slate-500">{report.description}</p>}
                        <p className="text-xs text-slate-400 mt-2">
                          Submitted: {new Date(report.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <button
                  onClick={() => setShowReportForm(!showReportForm)}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-xl hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Report Emergency
                </button>

                <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-medium text-blue-900 mb-2">Emergency Contacts</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-blue-700">📞 Barangay Emergency: 911</p>
                    <p className="text-blue-700">🚑 Medical: 166</p>
                    <p className="text-blue-700">🔥 Fire Department: 117</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {showReportForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 animate-scale-in">
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Report Submitted!</h3>
                  <p className="text-slate-600">The admin has been notified.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Report Emergency</h3>
                    <button
                      onClick={() => setShowReportForm(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Emergency Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.emergency_type}
                        onChange={(e) => setFormData({ ...formData, emergency_type: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="">Select type</option>
                        {EMERGENCY_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
                      <input
                        type="text"
                        placeholder="e.g., Purok 3, Block 5"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the situation..."
                        required
                        rows={3}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowReportForm(false)}
                        className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-xl hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50"
                      >
                        {submitting ? 'Submitting...' : 'Submit Report'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ReportEmergencyPage() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ResidentDashboard />
      </ToastProvider>
    </AuthProvider>
  );
}