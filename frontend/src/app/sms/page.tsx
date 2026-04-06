'use client';

import { useState, useEffect } from 'react';
import DashboardLayout, { Header } from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';
import { Resident } from '@/types';

export default function SMSPage() {
  const { showToast } = useToast();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedResident, setSelectedResident] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'individual' | 'broadcast'>('individual');

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
      showToast('Failed to load residents', 'error');
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
      await api.post('/sms/send', {
        phone: resident.contact_number,
        message: message,
        residentId: resident.id,
      });
      
      setSendResult({ success: true, message: `SMS sent successfully to ${resident.full_name}` });
      showToast(`SMS sent to ${resident.full_name}`, 'success');
      setMessage('');
    } catch (error: any) {
      setSendResult({ success: false, message: error.response?.data?.message || 'Failed to send SMS' });
      showToast(error.response?.data?.message || 'Failed to send SMS', 'error');
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
      showToast(`SMS broadcasted to ${res.data.count} residents`, 'success');
      setBroadcastMessage('');
    } catch (error: any) {
      setSendResult({ success: false, message: error.response?.data?.message || 'Failed to broadcast SMS' });
      showToast(error.response?.data?.message || 'Failed to broadcast SMS', 'error');
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

      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2 mb-4 lg:mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('individual')}
            className={`px-3 lg:px-4 py-2 rounded-lg font-medium transition-colors text-sm lg:text-base whitespace-nowrap ${
              activeTab === 'individual'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Individual SMS
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-3 lg:px-4 py-2 rounded-lg font-medium transition-colors text-sm lg:text-base whitespace-nowrap ${
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
                  <p className="text-slate-500">No residents registered yet.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Resident</label>
                    <select
                      value={selectedResident}
                      onChange={(e) => setSelectedResident(e.target.value)}
                      className="w-full px-3 lg:px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm"
                    >
                      {residents.map((r) => (
                        <option key={r.id} value={r.id}>{r.full_name} - {r.contact_number || 'No phone'}</option>
                      ))}
                    </select>
                  </div>

                  {selectedResidentData && (
                    <div className="p-3 lg:p-4 bg-slate-50 rounded-xl mb-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="font-medium text-slate-900 text-sm lg:text-base">{selectedResidentData.full_name}</p>
                          <p className="text-sm text-slate-500">{selectedResidentData.contact_number || 'No contact number'}</p>
                        </div>
                        <Badge variant={selectedResidentData.status === 'safe' ? 'success' : selectedResidentData.status === 'needs_help' ? 'danger' : 'warning'} dot>
                          {selectedResidentData.status === 'safe' ? 'Safe' : selectedResidentData.status === 'needs_help' ? 'Needs Help' : 'No Response'}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message here..."
                      rows={3}
                      className="w-full px-3 lg:px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base"
                    />
                  </div>

                  <Button onClick={handleSendSMS} loading={sending} disabled={!message.trim() || !selectedResident} className="w-full">
                    Send SMS
                  </Button>

                  {sendResult && (
                    <div className={`mt-4 p-4 rounded-xl ${sendResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <p className={`text-sm font-medium ${sendResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        {sendResult.message}
                      </p>
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
              <div className="p-3 lg:p-4 bg-blue-50 border border-blue-100 rounded-xl mb-4">
                <p className="text-sm text-blue-700">This will send an SMS to all residents with valid contact numbers.</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Broadcast Message</label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Type your broadcast message here..."
                  rows={3}
                  className="w-full px-3 lg:px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base"
                />
              </div>

              <Button onClick={handleBroadcastSMS} loading={sending} variant="danger" disabled={!broadcastMessage.trim()} className="w-full">
                Broadcast to All Residents
              </Button>

              {sendResult && (
                <div className={`mt-4 p-4 rounded-xl ${sendResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-sm font-medium ${sendResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {sendResult.message}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
