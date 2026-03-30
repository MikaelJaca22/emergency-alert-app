'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import api from '@/lib/api';
import { Resident } from '@/types';

export default function SMSPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedResident, setSelectedResident] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'individual' | 'broadcast'>('individual');
  const [broadcastMessage, setBroadcastMessage] = useState('');

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

  const handleSendSMS = async () => {
    if (!selectedResident || !message.trim()) return;
    
    const resident = residents.find(r => r.id === selectedResident);
    if (!resident || !resident.contact_number) {
      setSendResult({ success: false, message: 'Resident has no contact number' });
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const res = await api.post('/sms/send', {
        phone: resident.contact_number,
        message: message,
        residentId: resident.id,
      });
      
      setSendResult({ success: true, message: `SMS sent successfully to ${resident.full_name}` });
      setMessage('');
    } catch (error: any) {
      setSendResult({ success: false, message: error.response?.data?.message || 'Failed to send SMS' });
    } finally {
      setSending(false);
    }
  };

  const handleBroadcastSMS = async () => {
    if (!broadcastMessage.trim()) return;
    
    setSending(true);
    setSendResult(null);

    try {
      const res = await api.post('/sms/broadcast', {
        message: broadcastMessage,
      });
      
      setSendResult({ success: true, message: `SMS broadcasted to ${res.data.count} residents` });
      setBroadcastMessage('');
    } catch (error: any) {
      setSendResult({ success: false, message: error.response?.data?.message || 'Failed to broadcast SMS' });
    } finally {
      setSending(false);
    }
  };

  const selectedResidentData = residents.find(r => r.id === selectedResident);

  return (
    <DashboardLayout>
      <Header
        title="SMS Messaging"
        description="Send SMS messages to residents"
      />

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Tab Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('individual')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'individual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Individual SMS
            </button>
            <button
              onClick={() => setActiveTab('broadcast')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'broadcast'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Broadcast to All
            </button>
          </div>

          {activeTab === 'individual' ? (
            <Card className="animate-slide-up">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle>Send SMS to Resident</CardTitle>
                    <p className="text-slate-500 text-sm mt-0.5">Select a resident and send them a message</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {residents.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="text-slate-500">No residents registered yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <Select
                        label="Select Resident"
                        value={selectedResident}
                        onChange={(e) => setSelectedResident(e.target.value)}
                        options={residents.map((r) => ({
                          value: r.id,
                          label: `${r.full_name} - ${r.contact_number || 'No phone'}`,
                        }))}
                      />

                      {selectedResidentData && (
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900">{selectedResidentData.full_name}</p>
                              <p className="text-sm text-slate-500">{selectedResidentData.contact_number || 'No contact number'}</p>
                              <p className="text-sm text-slate-500">{selectedResidentData.address || 'No address'}</p>
                            </div>
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

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Message
                        </label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Type your message here..."
                          rows={4}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                      </div>

                      <Button
                        onClick={handleSendSMS}
                        loading={sending}
                        className="w-full"
                        disabled={!message.trim() || !selectedResident}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send SMS
                      </Button>
                    </div>

                    {sendResult && (
                      <div className={`mt-4 p-4 rounded-xl ${
                        sendResult.success
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          {sendResult.success ? (
                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          <p className={`text-sm font-medium ${sendResult.success ? 'text-green-700' : 'text-red-700'}`}>
                            {sendResult.message}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="animate-slide-up">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle>Broadcast SMS</CardTitle>
                    <p className="text-slate-500 text-sm mt-0.5">Send a message to all {residents.length} registered residents</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {residents.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <p className="text-slate-500">No residents to broadcast to.</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-blue-700">This will send an SMS to all {residents.length} residents with valid contact numbers.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Broadcast Message
                        </label>
                        <textarea
                          value={broadcastMessage}
                          onChange={(e) => setBroadcastMessage(e.target.value)}
                          placeholder="Type your broadcast message here..."
                          rows={4}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                      </div>

                      <Button
                        onClick={handleBroadcastSMS}
                        loading={sending}
                        className="w-full"
                        variant="danger"
                        disabled={!broadcastMessage.trim()}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                        Broadcast to All Residents
                      </Button>
                    </div>

                    {sendResult && (
                      <div className={`mt-4 p-4 rounded-xl ${
                        sendResult.success
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          {sendResult.success ? (
                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          <p className={`text-sm font-medium ${sendResult.success ? 'text-green-700' : 'text-red-700'}`}>
                            {sendResult.message}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Residents List */}
          <Card className="mt-6 animate-slide-up stagger-2">
            <CardHeader>
              <CardTitle>Registered Residents</CardTitle>
            </CardHeader>
            <CardContent>
              {residents.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl">
                  <p className="text-slate-500">No residents registered yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {residents.map((resident) => (
                      <TableRow key={resident.id}>
                        <TableCell className="font-medium">{resident.full_name}</TableCell>
                        <TableCell>{resident.contact_number || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              resident.status === 'safe'
                                ? 'success'
                                : resident.status === 'needs_help'
                                ? 'danger'
                                : 'warning'
                            }
                            dot
                          >
                            {resident.status === 'safe'
                              ? 'Safe'
                              : resident.status === 'needs_help'
                              ? 'Needs Help'
                              : 'No Response'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedResident(resident.id);
                              setActiveTab('individual');
                            }}
                            disabled={!resident.contact_number}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Message
                          </Button>
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
