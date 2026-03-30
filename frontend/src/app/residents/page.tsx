'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import api from '@/lib/api';
import { Resident, CreateResidentData } from '@/types';

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [formData, setFormData] = useState<CreateResidentData>({
    full_name: '',
    address: '',
    contact_number: '',
    zone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      const response = await api.get('/residents');
      setResidents(response.data);
    } catch (error) {
      console.error('Failed to fetch residents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResident = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/residents', formData);
      setModalOpen(false);
      setFormData({ full_name: '', address: '', contact_number: '', zone: '' });
      await fetchResidents();
    } catch (error) {
      console.error('Failed to create resident:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResident) return;
    setSubmitting(true);
    try {
      await api.put(`/residents/${editingResident.id}`, formData);
      setEditModalOpen(false);
      setEditingResident(null);
      setFormData({ full_name: '', address: '', contact_number: '', zone: '' });
      await fetchResidents();
    } catch (error) {
      console.error('Failed to update resident:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteResident = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resident?')) return;
    try {
      await api.delete(`/residents/${id}`);
      await fetchResidents();
    } catch (error) {
      console.error('Failed to delete resident:', error);
    }
  };

  const openEditModal = (resident: Resident) => {
    setEditingResident(resident);
    setFormData({
      full_name: resident.full_name,
      address: resident.address,
      contact_number: resident.contact_number,
      zone: resident.zone || '',
    });
    setEditModalOpen(true);
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
        title="Manage Residents"
        description="Add and manage community residents"
      />

      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Resident Database</CardTitle>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Resident
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : residents.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-slate-500 mb-4">No residents found. Add residents to get started.</p>
                <Button onClick={() => setModalOpen(true)}>Add First Resident</Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {residents.map((resident) => (
                    <TableRow key={resident.id}>
                      <TableCell className="font-medium">{resident.full_name}</TableCell>
                      <TableCell>{resident.address}</TableCell>
                      <TableCell>{resident.contact_number}</TableCell>
                      <TableCell>{resident.zone || '-'}</TableCell>
                      <TableCell>{getStatusBadge(resident.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(resident)}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteResident(resident.id)}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
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

      {/* Add Resident Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Resident"
        description="Add a new resident to the database"
        variant="success"
      >
        <form onSubmit={handleCreateResident} className="space-y-5">
          <Input
            label="Full Name"
            placeholder="e.g. Juan Dela Cruz"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />
          <Input
            label="Address"
            placeholder="e.g. 123 Main Street, Zone 4"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />
          <Input
            label="Contact Number"
            placeholder="e.g. +63 912 345 6789"
            value={formData.contact_number}
            onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
            required
          />
          <Input
            label="Zone (Optional)"
            placeholder="e.g. Zone 4"
            value={formData.zone}
            onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              className="flex-1"
              loading={submitting}
            >
              Save Resident
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Resident Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Resident"
        description="Update resident information"
        variant="default"
      >
        <form onSubmit={handleEditResident} className="space-y-5">
          <Input
            label="Full Name"
            placeholder="e.g. Juan Dela Cruz"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />
          <Input
            label="Address"
            placeholder="e.g. 123 Main Street, Zone 4"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />
          <Input
            label="Contact Number"
            placeholder="e.g. +63 912 345 6789"
            value={formData.contact_number}
            onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
            required
          />
          <Input
            label="Zone (Optional)"
            placeholder="e.g. Zone 4"
            value={formData.zone}
            onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={submitting}
            >
              Update Resident
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
