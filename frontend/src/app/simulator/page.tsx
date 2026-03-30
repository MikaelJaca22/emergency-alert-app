'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import api from '@/lib/api';
import { Resident } from '@/types';

export default function SimulatorPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedResident, setSelectedResident] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<{ status: string; message: string } | null>(null);

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      const res = await api.get('/residents');
      setResidents(res.data);
      if (res.data.length > 0) {
        setSelectedResident(res.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch residents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateResponse = async (keyword: 'SAFE' | 'HELP' | 'IGNORE') => {
    if (!selectedResident) return;
    
    const resident = residents.find(r => r.id === selectedResident);
    if (!resident) return;

    setSending(true);
    setResponse(null);

    try {
      if (keyword === 'IGNORE') {
        setResponse({
          status: 'ignored',
          message: 'No response recorded. Resident marked as ignoring the alert.',
        });
        // Update resident status to no_response
        await api.put(`/residents/${selectedResident}/status`, { status: 'no_response' });
      } else {
        const res = await api.post('/alerts/simulate-response', {
          phone: resident.contact_number,
          keyword: keyword,
        });
        
        setResponse({
          status: res.data.status,
          message: res.data.response,
        });

        // Update resident status based on response
        await api.put(`/residents/${selectedResident}/status`, { 
          status: res.data.status === 'safe' ? 'safe' : 'needs_help' 
        });
      }

      // Refresh residents to show updated status
      await fetchResidents();
    } catch (error) {
      console.error('Failed to simulate response:', error);
      setResponse({
        status: 'error',
        message: 'Failed to process the simulation. Please try again.',
      });
    } finally {
      setSending(false);
    }
  };

  const selectedResidentData = residents.find(r => r.id === selectedResident);

  return (
    <DashboardLayout>
      <Header
        title="Resident SMS Simulator"
        description="Simulate resident SMS responses for testing"
      />

      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card variant="gradient">
            <CardHeader className="bg-slate-900 -m-5 mb-5 p-5 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-white">Resident Mobile Interface</CardTitle>
                  <p className="text-slate-400 text-sm mt-0.5">Simulate a resident receiving an SMS and responding</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : residents.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl">
                  <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="text-slate-500">No residents available. Add residents first to simulate responses.</p>
                </div>
              ) : (
                <>
                  <Select
                    label="Select Resident"
                    value={selectedResident}
                    onChange={(e) => setSelectedResident(e.target.value)}
                    options={residents.map((r) => ({
                      value: r.id,
                      label: `${r.full_name} - ${r.contact_number}`,
                    }))}
                  />

                  {selectedResidentData && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                      <p className="text-sm text-slate-500">Current Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            selectedResidentData.status === 'safe'
                              ? 'success'
                              : selectedResidentData.status === 'needs_help'
                              ? 'danger'
                              : 'warning'
                          }
                          dot
                        >
                          {selectedResidentData.status === 'safe'
                            ? 'Safe'
                            : selectedResidentData.status === 'needs_help'
                            ? 'Needs Help'
                            : 'No Response'}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 space-y-3">
                    <p className="text-sm font-medium text-slate-700 mb-3">Simulate Response:</p>
                    <Button
                      variant="success"
                      className="w-full justify-center gap-2"
                      onClick={() => handleSimulateResponse('SAFE')}
                      loading={sending}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      I AM SAFE
                    </Button>
                    <Button
                      variant="danger"
                      className="w-full justify-center gap-2"
                      onClick={() => handleSimulateResponse('HELP')}
                      loading={sending}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      I NEED HELP
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full justify-center gap-2"
                      onClick={() => handleSimulateResponse('IGNORE')}
                      loading={sending}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      NO RESPONSE / IGNORE
                    </Button>
                  </div>

                  {response && (
                    <div className={`mt-6 p-4 rounded-xl ${
                      response.status === 'safe'
                        ? 'bg-green-50 border border-green-200'
                        : response.status === 'needs_help'
                        ? 'bg-red-50 border border-red-200'
                        : response.status === 'error'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-slate-50 border border-slate-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          response.status === 'safe'
                            ? 'bg-green-100'
                            : response.status === 'needs_help'
                            ? 'bg-red-100'
                            : response.status === 'error'
                            ? 'bg-red-100'
                            : 'bg-slate-100'
                        }`}>
                          {response.status === 'safe' ? (
                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : response.status === 'needs_help' ? (
                            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {response.status === 'safe'
                              ? 'Safe Response'
                              : response.status === 'needs_help'
                              ? 'Help Requested'
                              : response.status === 'error'
                              ? 'Error'
                              : 'No Response'}
                          </p>
                          <p className="text-sm text-slate-600 mt-0.5">{response.message}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
