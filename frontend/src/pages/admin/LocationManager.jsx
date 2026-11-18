import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function LocationManager() {
  const qc = useQueryClient();
  const [stateForm, setStateForm] = useState({ name: '', code: '' });
  const [nodeForm, setNodeForm] = useState({ stateId: '', parentId: '', name: '', slug: '', level: 1 });

  const { data: states, isLoading } = useQuery({
    queryKey: ['admin-locations'],
    queryFn: () => api.get('/admin/locations').then(r => r.data),
  });

  const addState = useMutation({
    mutationFn: () => api.post('/admin/locations/state', stateForm),
    onSuccess: () => { toast.success('State added'); qc.invalidateQueries(['admin-locations']); setStateForm({ name: '', code: '' }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  const addNode = useMutation({
    mutationFn: () => api.post('/admin/locations/node', { ...nodeForm, stateId: nodeForm.stateId, parentId: nodeForm.parentId || undefined, level: Number(nodeForm.level) }),
    onSuccess: () => { toast.success('Location node added'); qc.invalidateQueries(['admin-locations']); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div>
        <h1 className="section-title">Location Manager</h1>
        <p className="section-subtitle">Manage the India 5-tier location hierarchy</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add State */}
        <div className="card p-5">
          <h2 className="font-display font-semibold text-gray-900 mb-4">Add State</h2>
          <form onSubmit={e => { e.preventDefault(); addState.mutate(); }} className="space-y-3">
            <div>
              <label className="label">State Name</label>
              <input value={stateForm.name} onChange={e => setStateForm(f => ({ ...f, name: e.target.value }))} className="input" required placeholder="e.g. Gujarat" />
            </div>
            <div>
              <label className="label">State Code</label>
              <input value={stateForm.code} onChange={e => setStateForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="input" required placeholder="e.g. GJ" maxLength={4} />
            </div>
            <button type="submit" disabled={addState.isPending} className="btn-primary w-full">
              {addState.isPending ? 'Adding…' : 'Add State'}
            </button>
          </form>
        </div>

        {/* Add node */}
        <div className="card p-5">
          <h2 className="font-display font-semibold text-gray-900 mb-4">Add Location Node</h2>
          <form onSubmit={e => { e.preventDefault(); addNode.mutate(); }} className="space-y-3">
            <div>
              <label className="label">State</label>
              <select value={nodeForm.stateId} onChange={e => setNodeForm(f => ({ ...f, stateId: e.target.value }))} className="input" required>
                <option value="">Select state</option>
                {(states || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Level (1=District, 2=City, 3=Block, 4=Village)</label>
              <select value={nodeForm.level} onChange={e => setNodeForm(f => ({ ...f, level: e.target.value }))} className="input">
                {[1,2,3,4].map(l => <option key={l} value={l}>Level {l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Name</label>
              <input value={nodeForm.name} onChange={e => setNodeForm(f => ({ ...f, name: e.target.value }))} className="input" required placeholder="e.g. Ahmedabad" />
            </div>
            <div>
              <label className="label">Slug</label>
              <input value={nodeForm.slug} onChange={e => setNodeForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} className="input" required placeholder="e.g. ahmedabad" />
            </div>
            <button type="submit" disabled={addNode.isPending} className="btn-primary w-full">
              {addNode.isPending ? 'Adding…' : 'Add Node'}
            </button>
          </form>
        </div>
      </div>

      {/* State list */}
      <div className="card p-5">
        <h2 className="font-display font-semibold text-gray-900 mb-4">States ({states?.length || 0})</h2>
        {isLoading ? <LoadingSpinner size="sm" /> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(states || []).map(s => (
              <div key={s.id} className="p-2.5 bg-cream-50 rounded-xl">
                <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                <p className="text-xs text-gray-400">{s.code} · {s.nodes?.length || 0} districts</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
