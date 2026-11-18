import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const ODIA_CATERING = [
  'Dalma', 'Santula', 'Chhena Poda', 'Rasabali', 'Mutton Kasha', 'Fish Curry',
  'Pakhala', 'Besara', 'Macha Ghanta', 'Rice & Dal', 'Pulao', 'Kheer',
];

const DECORATION_THEMES = [
  'Traditional Odia Mandap', 'Flower Decoration', 'Royal Wedding Stage',
  'Pattachitra Theme', 'Fairy Lights', 'Reception Decoration',
  'Rustic Garden', 'Modern Minimal',
];

function CateringForm({ propertyId, pkg, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: pkg?.name || '',
    description: pkg?.description || '',
    isVeg: pkg?.isVeg ?? true,
    pricePerHead: pkg?.pricePerHead || '',
    minGuests: pkg?.minGuests || 50,
    items: pkg?.items || [],
  });

  const mutation = useMutation({
    mutationFn: (data) => pkg
      ? api.put(`/properties/${propertyId}/catering/${pkg.id}`, data)
      : api.post(`/properties/${propertyId}/catering`, data),
    onSuccess: () => {
      toast.success(pkg ? 'Package updated' : 'Package added');
      qc.invalidateQueries(['catering-packages', propertyId]);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error saving'),
  });

  const toggleItem = (item) => {
    setForm(f => ({
      ...f,
      items: f.items.includes(item) ? f.items.filter(i => i !== item) : [...f.items, item],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="font-display font-semibold text-lg text-gray-900">{pkg ? 'Edit' : 'Add'} Catering Package</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Package Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Premium Veg Thali" />
          </div>
          <div>
            <label className="label">Price per Head (₹) *</label>
            <input type="number" className="input" value={form.pricePerHead} onChange={e => setForm(f => ({ ...f, pricePerHead: e.target.value }))} placeholder="e.g. 450" />
          </div>
          <div>
            <label className="label">Minimum Guests</label>
            <input type="number" className="input" value={form.minGuests} onChange={e => setForm(f => ({ ...f, minGuests: Number(e.target.value) }))} />
          </div>
          <div className="col-span-2">
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="label mb-2 block">Type</label>
            <div className="flex gap-3">
              {[{ label: '🥦 Vegetarian', val: true }, { label: '🍖 Non-Veg', val: false }].map(opt => (
                <button key={String(opt.val)} type="button" onClick={() => setForm(f => ({ ...f, isVeg: opt.val }))}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${form.isVeg === opt.val ? 'border-forest-600 bg-forest-50 text-forest-700' : 'border-gray-200 text-gray-600'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <label className="label mb-2 block">Menu Items (select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {ODIA_CATERING.map(item => (
                <button key={item} type="button" onClick={() => toggleItem(item)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${form.items.includes(item) ? 'bg-forest-600 text-white border-forest-600' : 'border-gray-200 text-gray-600 hover:border-forest-300'}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button onClick={() => mutation.mutate(form)} disabled={!form.name || !form.pricePerHead || mutation.isPending} className="btn-primary flex-1">
            {mutation.isPending ? 'Saving…' : 'Save Package'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DecorationForm({ propertyId, pkg, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: pkg?.name || '',
    description: pkg?.description || '',
    price: pkg?.price || '',
  });

  const mutation = useMutation({
    mutationFn: (data) => pkg
      ? api.put(`/properties/${propertyId}/decoration/${pkg.id}`, data)
      : api.post(`/properties/${propertyId}/decoration`, data),
    onSuccess: () => {
      toast.success(pkg ? 'Package updated' : 'Package added');
      qc.invalidateQueries(['decoration-packages', propertyId]);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error saving'),
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 className="font-display font-semibold text-lg text-gray-900">{pkg ? 'Edit' : 'Add'} Decoration Package</h3>

        <div>
          <label className="label">Theme Name *</label>
          <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Package name" />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {DECORATION_THEMES.map(t => (
              <button key={t} type="button" onClick={() => setForm(f => ({ ...f, name: t }))}
                className={`px-2.5 py-1 rounded-full text-xs border transition-all ${form.name === t ? 'bg-gold-500 text-white border-gold-500' : 'border-gray-200 text-gray-600 hover:border-gold-300'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Total Price (₹) *</label>
          <input type="number" className="input" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="e.g. 25000" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button onClick={() => mutation.mutate(form)} disabled={!form.name || !form.price || mutation.isPending} className="btn-primary flex-1">
            {mutation.isPending ? 'Saving…' : 'Save Package'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PackageManager() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('catering');
  const [cateringModal, setCateringModal] = useState(null);
  const [decorationModal, setDecorationModal] = useState(null);

  const { data: properties = [], isLoading: propsLoading } = useQuery({
    queryKey: ['owner-properties-simple'],
    queryFn: () => api.get('/owner/properties').then(r => r.data),
  });
  const [selectedPropId, setSelectedPropId] = useState('');
  const propId = selectedPropId || properties[0]?.id;

  const { data: cateringPkgs = [], isLoading: cLoading } = useQuery({
    queryKey: ['catering-packages', propId],
    queryFn: () => api.get(`/properties/${propId}/catering`).then(r => r.data),
    enabled: !!propId,
  });

  const { data: decorationPkgs = [], isLoading: dLoading } = useQuery({
    queryKey: ['decoration-packages', propId],
    queryFn: () => api.get(`/properties/${propId}/decoration`).then(r => r.data),
    enabled: !!propId,
  });

  const deleteCatering = useMutation({
    mutationFn: (pkgId) => api.delete(`/properties/${propId}/catering/${pkgId}`),
    onSuccess: () => { toast.success('Package removed'); qc.invalidateQueries(['catering-packages', propId]); },
  });

  const deleteDecoration = useMutation({
    mutationFn: (pkgId) => api.delete(`/properties/${propId}/decoration/${pkgId}`),
    onSuccess: () => { toast.success('Package removed'); qc.invalidateQueries(['decoration-packages', propId]); },
  });

  if (propsLoading) return <LoadingSpinner text="Loading properties…" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Packages</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage catering and decoration packages for your venues</p>
        </div>
      </div>

      {/* Property selector */}
      {properties.length > 1 && (
        <div className="card p-4">
          <label className="label">Select Property</label>
          <select className="input" value={propId} onChange={e => setSelectedPropId(e.target.value)}>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[{ key: 'catering', label: '🍽️ Catering' }, { key: 'decoration', label: '🌸 Decoration' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.key ? 'bg-white shadow text-forest-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'catering' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setCateringModal('new')} className="btn-primary">+ Add Catering Package</button>
          </div>
          {cLoading ? <LoadingSpinner /> : !cateringPkgs.length ? (
            <EmptyState icon="🍽️" title="No catering packages" description="Add catering packages for your venue guests." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cateringPkgs.map(pkg => (
                <div key={pkg.id} className="card p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pkg.isVeg ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {pkg.isVeg ? '🥦 Veg' : '🍖 Non-Veg'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-forest-700">₹{Number(pkg.pricePerHead).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-400">per head</p>
                    </div>
                  </div>
                  {pkg.description && <p className="text-sm text-gray-500 mb-2">{pkg.description}</p>}
                  {pkg.items?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {pkg.items.map(item => (
                        <span key={item} className="px-2 py-0.5 bg-cream-100 text-xs text-gray-600 rounded-full">{item}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mb-3">Min. {pkg.minGuests} guests</p>
                  <div className="flex gap-2">
                    <button onClick={() => setCateringModal(pkg)} className="btn-outline text-xs py-1 px-3 flex-1">Edit</button>
                    <button onClick={() => { if (confirm('Remove package?')) deleteCatering.mutate(pkg.id); }} className="text-xs text-red-500 hover:text-red-700 px-3 py-1">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'decoration' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setDecorationModal('new')} className="btn-primary">+ Add Decoration Package</button>
          </div>
          {dLoading ? <LoadingSpinner /> : !decorationPkgs.length ? (
            <EmptyState icon="🌸" title="No decoration packages" description="Add decoration themes for your venue." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {decorationPkgs.map(pkg => (
                <div key={pkg.id} className="card p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                    <div className="text-right">
                      <p className="text-lg font-bold text-forest-700">₹{Number(pkg.price).toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-400">flat rate</p>
                    </div>
                  </div>
                  {pkg.description && <p className="text-sm text-gray-500 mb-3">{pkg.description}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => setDecorationModal(pkg)} className="btn-outline text-xs py-1 px-3 flex-1">Edit</button>
                    <button onClick={() => { if (confirm('Remove package?')) deleteDecoration.mutate(pkg.id); }} className="text-xs text-red-500 hover:text-red-700 px-3 py-1">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {cateringModal && (
        <CateringForm
          propertyId={propId}
          pkg={cateringModal === 'new' ? null : cateringModal}
          onClose={() => setCateringModal(null)}
        />
      )}
      {decorationModal && (
        <DecorationForm
          propertyId={propId}
          pkg={decorationModal === 'new' ? null : decorationModal}
          onClose={() => setDecorationModal(null)}
        />
      )}
    </div>
  );
}
