import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../context/authStore';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function CustomerProfile() {
  const { fetchMe } = useAuthStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['customer-profile'],
    queryFn: () => api.get('/customer/profile').then(r => r.data),
  });

  const [form, setForm] = useState({ fullName: '', address: '' });

  const startEdit = () => {
    setForm({ fullName: profile?.fullName || '', address: profile?.address || '' });
    setEditing(true);
  };

  const updateMutation = useMutation({
    mutationFn: (data) => api.put('/customer/profile', data),
    onSuccess: () => {
      toast.success('Profile updated');
      setEditing(false);
      qc.invalidateQueries(['customer-profile']);
      fetchMe();
    },
    onError: () => toast.error('Update failed'),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="w-full max-w-xl space-y-6">
      <div>
        <h1 className="section-title">My Profile</h1>
        <p className="section-subtitle">Manage your personal information</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-forest-600 flex items-center justify-center text-white text-2xl font-bold">
            {profile?.fullName?.[0] || 'C'}
          </div>
          <div>
            <p className="font-display font-bold text-xl text-gray-900">{profile?.fullName}</p>
            <p className="text-sm text-gray-500">{profile?.user?.phone}</p>
          </div>
        </div>

        {editing ? (
          <form onSubmit={e => { e.preventDefault(); updateMutation.mutate(form); }} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="input" required />
            </div>
            <div>
              <label className="label">Address</label>
              <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={3} className="input resize-none" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditing(false)} className="btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex-1">
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {[
              { label: 'Full Name', value: profile?.fullName },
              { label: 'Phone', value: profile?.user?.phone ? `+91 ${profile.user.phone}` : '—' },
              { label: 'Address', value: profile?.address || 'Not provided' },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                <p className="text-sm font-medium text-gray-800">{item.value}</p>
              </div>
            ))}
            <button onClick={startEdit} className="btn-outline w-full mt-2">Edit Profile</button>
          </div>
        )}
      </div>
    </div>
  );
}
