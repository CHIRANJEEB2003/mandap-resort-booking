import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

const ROLES = ['Manager', 'Coordinator', 'Security', 'Cleaner', 'Decorator', 'Caterer', 'Other'];

export default function StaffManager() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ fullName: '', phone: '', role: ROLES[0] });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const { data: staff, isLoading } = useQuery({
    queryKey: ['owner-staff'],
    queryFn: () => api.get('/owner/staff').then(r => r.data),
  });

  const addMutation = useMutation({
    mutationFn: (data) => editItem ? api.put(`/owner/staff/${editItem.id}`, data) : api.post('/owner/staff', data),
    onSuccess: () => { toast.success(editItem ? 'Staff updated' : 'Staff added'); qc.invalidateQueries(['owner-staff']); setShowForm(false); setEditItem(null); setForm({ fullName: '', phone: '', role: ROLES[0] }); },
    onError: () => toast.error('Error saving staff'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/owner/staff/${id}`),
    onSuccess: () => { toast.success('Staff removed'); qc.invalidateQueries(['owner-staff']); },
  });

  const startEdit = (member) => { setEditItem(member); setForm({ fullName: member.fullName, phone: member.phone, role: member.role }); setShowForm(true); };

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Staff Manager</h1>
          <p className="section-subtitle">Manage your team members</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditItem(null); setForm({ fullName: '', phone: '', role: ROLES[0] }); }}
          className="btn-primary flex items-center gap-2 text-sm">
          <PlusIcon className="h-4 w-4" /> Add Staff
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h2 className="font-display font-semibold text-gray-900 mb-4">{editItem ? 'Edit Staff' : 'Add Staff Member'}</h2>
          <form onSubmit={e => { e.preventDefault(); addMutation.mutate(form); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="input" required />
              </div>
              <div>
                <label className="label">Phone *</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" required />
              </div>
            </div>
            <div>
              <label className="label">Role *</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={addMutation.isPending} className="btn-primary flex-1">
                {addMutation.isPending ? 'Saving…' : editItem ? 'Update' : 'Add Staff'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? <LoadingSpinner /> : !staff?.length ? (
        <EmptyState icon="👥" title="No staff yet" description="Add team members to assign them to events." />
      ) : (
        <div className="space-y-3">
          {staff.map(m => (
            <div key={m.id} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center text-gold-700 font-bold text-sm flex-shrink-0">
                {m.fullName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">{m.fullName}</p>
                <p className="text-xs text-gray-500">{m.role} · +91 {m.phone}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(m)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <PencilSquareIcon className="h-4 w-4 text-gray-500" />
                </button>
                {confirmDeleteId === m.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => { deleteMutation.mutate(m.id); setConfirmDeleteId(null); }}
                      className="text-xs px-2 py-1 bg-red-500 text-white rounded-lg">Yes</button>
                    <button onClick={() => setConfirmDeleteId(null)}
                      className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-lg">No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(m.id)}
                    className="p-2 hover:bg-red-50 rounded-xl transition-colors">
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
