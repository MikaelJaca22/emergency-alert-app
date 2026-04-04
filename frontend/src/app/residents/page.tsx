'use client';

import { useState, useEffect } from 'react';
import DashboardLayout, { Header } from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';
import { Resident } from '@/types';

export default function ResidentsPage() {
  const { showToast } = useToast();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      const response = await api.get('/residents');
      setResidents(response.data);
    } catch (error) {
      console.error('Failed to fetch residents:', error);
      showToast('Failed to load residents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Resident['status']) => {
    const variants = {
      safe: { variant: 'success' as const, label: 'Safe' },
      needs_help: { variant: 'danger' as const, label: 'Needs Help' },
      no_response: { variant: 'warning' as const, label: 'No Response' },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant} dot>{label}</Badge>;
  };

  return (
    <DashboardLayout>
      <Header
        title="Registered Residents"
        description="View all registered residents in the system"
      />

      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Resident Directory ({residents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {residents.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl">
              <p className="text-slate-500">No residents registered yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Address</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Contact</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {residents.map((resident) => (
                    <tr key={resident.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">{resident.full_name}</td>
                      <td className="py-3 px-4 text-slate-600">{resident.address || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{resident.contact_number || '-'}</td>
                      <td className="py-3 px-4">{getStatusBadge(resident.status)}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(resident.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
