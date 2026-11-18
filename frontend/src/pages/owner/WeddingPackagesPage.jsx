import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  PlusIcon, PencilIcon, TrashIcon, XMarkIcon, PhotoIcon,
  SparklesIcon, CameraIcon, StarIcon,
} from '@heroicons/react/24/outline';

const CEREMONY_TYPES = [
  { value: 'MEHENDI',  label: 'Mehendi',   color: 'bg-orange-100 text-orange-700' },
  { value: 'HALDI',    label: 'Haldi',     color: 'bg-yellow-100 text-yellow-700' },
  { value: 'MARRIAGE', label: 'Marriage',  color: 'bg-rose-100 text-rose-700' },
  { value: 'RECEPTION',label: 'Reception', color: 'bg-purple-100 text-purple-700' },
  { value: 'COMPLETE', label: 'Complete Wedding', color: 'bg-forest-100 text-forest-700' },
];

const PHOTO_TYPES = [
  { value: 'PRE_WEDDING', label: 'Pre-wedding' },
  { value: 'WEDDING',     label: 'Wedding' },
  { value: 'CINEMATIC',   label: 'Cinematic Video' },
  { value: 'DRONE',       label: 'Drone Photography' },
  { value: 'ALBUM',       label: 'Wedding Album' },
  { value: 'CANDID',      label: 'Candid' },
  { value: 'TRADITIONAL', label: 'Traditional' },
  { value: 'COMPLETE',    label: 'Complete Package' },
];

const DECOR_TYPES = [
  { value: 'MEHENDI',  label: 'Mehendi Decor' },
  { value: 'HALDI',    label: 'Haldi Decor' },
  { value: 'STAGE',    label: 'Wedding Stage' },
  { value: 'RECEPTION',label: 'Reception Decor' },
  { value: 'MANDAP',   label: 'Mandap Decoration' },
  { value: 'ENTRANCE', label: 'Entrance Decoration' },
  { value: 'FLORAL',   label: 'Floral Decoration' },
  { value: 'LIGHTING', label: 'Lighting Decoration' },
  { value: 'COMPLETE', label: 'Complete Wedding Decor' },
  { value: 'GENERAL',  label: 'General' },
];

const GALLERY_CATEGORIES = [
  { value: 'GENERAL',    label: 'General' },
  { value: 'INTERIOR',   label: 'Interior' },
  { value: 'EXTERIOR',   label: 'Exterior' },
  { value: 'STAGE',      label: 'Wedding Stage' },
  { value: 'DECORATION', label: 'Decoration' },
  { value: 'ROOM',       label: 'Rooms' },
  { value: 'POOL',       label: 'Pool Area' },
];

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-500">{msg}</p>;
}

// ── Generic Modal Shell ───────────────────────────────────────────────────────
function Modal({ title, onClose, onSave, saving, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-display font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">{children}</div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button onClick={onSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Wedding Packages Tab ──────────────────────────────────────────────────────
function WeddingPackagesTab({ propertyId }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const { data: packages = [] } = useQuery({
    queryKey: ['owner-wedding-pkgs', propertyId],
    queryFn: () => api.get('/wedding/owner/packages', { params: { propertyId } }).then(r => r.data),
    enabled: Boolean(propertyId),
  });

  const save = useMutation({
    mutationFn: (data) => editing?.id
      ? api.put(`/wedding/owner/packages/${editing.id}`, data).then(r => r.data)
      : api.post('/wedding/owner/packages', data).then(r => r.data),
    onSuccess: () => { toast.success('Package saved'); qc.invalidateQueries(['owner-wedding-pkgs', propertyId]); setEditing(null); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/wedding/owner/packages/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['owner-wedding-pkgs', propertyId]); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const openNew = () => { setForm({ propertyId, name: '', ceremonyType: 'MARRIAGE', description: '', guestCapacity: 100, durationDays: 1, startingPrice: '', includedServices: '', images: '', coverImageUrl: '' }); setEditing({}); };
  const openEdit = (p) => { setForm({ ...p, includedServices: (p.includedServices || []).join('\n'), images: (p.images || []).join('\n') }); setEditing(p); };
  const handleSave = () => {
    if (!form.name || !form.startingPrice) return toast.error('Name and starting price required');
    save.mutate({ ...form, propertyId, includedServices: form.includedServices.split('\n').filter(Boolean), images: form.images.split('\n').filter(Boolean), guestCapacity: Number(form.guestCapacity), durationDays: Number(form.durationDays), startingPrice: Number(form.startingPrice) });
  };

  const ctLabel = (v) => CEREMONY_TYPES.find(c => c.value === v)?.label || v;
  const ctColor = (v) => CEREMONY_TYPES.find(c => c.value === v)?.color || 'bg-gray-100 text-gray-600';

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="btn-primary flex items-center gap-2 text-sm"><PlusIcon className="h-4 w-4" /> Add Package</button>
      </div>

      {packages.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <SparklesIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No wedding packages yet. Add your first package.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map(p => (
            <div key={p.id} className="card p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ctColor(p.ceremonyType)}`}>{ctLabel(p.ceremonyType)}</span>
                  {!p.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}
                </div>
                <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">₹{Number(p.startingPrice).toLocaleString('en-IN')} starting · {p.guestCapacity} guests · {p.durationDays} day{p.durationDays !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"><PencilIcon className="h-4 w-4" /></button>
                <button onClick={() => { if (confirm('Delete this package?')) del.mutate(p.id); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><TrashIcon className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <Modal title={editing.id ? 'Edit Package' : 'Add Package'} onClose={() => setEditing(null)} onSave={handleSave} saving={save.isPending}>
          <div>
            <label className="label">Package Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Grand Mehendi Ceremony" />
          </div>
          <div>
            <label className="label">Ceremony Type *</label>
            <select className="input" value={form.ceremonyType} onChange={e => setForm(f => ({ ...f, ceremonyType: e.target.value }))}>
              {CEREMONY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what's included..." />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Starting Price (₹) *</label>
              <input className="input" type="number" min="0" value={form.startingPrice} onChange={e => setForm(f => ({ ...f, startingPrice: e.target.value }))} />
            </div>
            <div>
              <label className="label">Guest Capacity</label>
              <input className="input" type="number" min="1" value={form.guestCapacity} onChange={e => setForm(f => ({ ...f, guestCapacity: e.target.value }))} />
            </div>
            <div>
              <label className="label">Duration (days)</label>
              <input className="input" type="number" min="1" value={form.durationDays} onChange={e => setForm(f => ({ ...f, durationDays: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Included Services (one per line)</label>
            <textarea className="input resize-none" rows={4} value={form.includedServices} onChange={e => setForm(f => ({ ...f, includedServices: e.target.value }))} placeholder="DJ & Sound System&#10;Floral Decoration&#10;Catering for 200&#10;Photography" />
          </div>
          <div>
            <label className="label">Photo URLs (one per line)</label>
            <textarea className="input resize-none" rows={3} value={form.images} onChange={e => setForm(f => ({ ...f, images: e.target.value }))} placeholder="https://..." />
          </div>
          <div>
            <label className="label">Cover Image URL</label>
            <input className="input" value={form.coverImageUrl} onChange={e => setForm(f => ({ ...f, coverImageUrl: e.target.value }))} placeholder="https://..." />
          </div>
          {editing.id && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded" checked={form.isActive !== false} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              Active (visible to clients)
            </label>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── Photography Services Tab ──────────────────────────────────────────────────
function PhotographyTab({ propertyId }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const { data: services = [] } = useQuery({
    queryKey: ['owner-photography', propertyId],
    queryFn: () => api.get('/wedding/owner/photography', { params: { propertyId } }).then(r => r.data),
    enabled: Boolean(propertyId),
  });

  const save = useMutation({
    mutationFn: (data) => editing?.id
      ? api.put(`/wedding/owner/photography/${editing.id}`, data).then(r => r.data)
      : api.post('/wedding/owner/photography', data).then(r => r.data),
    onSuccess: () => { toast.success('Service saved'); qc.invalidateQueries(['owner-photography', propertyId]); setEditing(null); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/wedding/owner/photography/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['owner-photography', propertyId]); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const openNew = () => { setForm({ propertyId, name: '', serviceType: 'WEDDING', description: '', price: '', images: '' }); setEditing({}); };
  const openEdit = (s) => { setForm({ ...s, images: (s.images || []).join('\n') }); setEditing(s); };
  const handleSave = () => {
    if (!form.name || !form.price) return toast.error('Name and price required');
    save.mutate({ ...form, propertyId, price: Number(form.price), images: form.images.split('\n').filter(Boolean) });
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="btn-primary flex items-center gap-2 text-sm"><PlusIcon className="h-4 w-4" /> Add Service</button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CameraIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No photography services yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map(s => (
            <div key={s.id} className={`card p-4 ${!s.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">{PHOTO_TYPES.find(t => t.value === s.serviceType)?.label || s.serviceType}</span>
                  <p className="font-semibold text-gray-900 mt-1 truncate">{s.name}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"><PencilIcon className="h-4 w-4" /></button>
                  <button onClick={() => { if (confirm('Delete?')) del.mutate(s.id); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><TrashIcon className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="text-lg font-bold text-forest-700">₹{Number(s.price).toLocaleString('en-IN')}</p>
              {s.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.description}</p>}
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <Modal title={editing.id ? 'Edit Photography Service' : 'Add Photography Service'} onClose={() => setEditing(null)} onSave={handleSave} saving={save.isPending}>
          <div>
            <label className="label">Service Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Candid Wedding Photography" />
          </div>
          <div>
            <label className="label">Service Type *</label>
            <select className="input" value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}>
              {PHOTO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Price (₹) *</label>
            <input className="input" type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Sample Photo URLs (one per line)</label>
            <textarea className="input resize-none" rows={3} value={form.images} onChange={e => setForm(f => ({ ...f, images: e.target.value }))} placeholder="https://..." />
          </div>
          {editing.id && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded" checked={form.isActive !== false} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              Active
            </label>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── Decoration Services Tab ───────────────────────────────────────────────────
function DecorationTab({ propertyId }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const { data: services = [] } = useQuery({
    queryKey: ['owner-decoration', propertyId],
    queryFn: () => api.get('/wedding/owner/decoration', { params: { propertyId } }).then(r => r.data),
    enabled: Boolean(propertyId),
  });

  const save = useMutation({
    mutationFn: (data) => editing?.id
      ? api.put(`/wedding/owner/decoration/${editing.id}`, data).then(r => r.data)
      : api.post('/wedding/owner/decoration', data).then(r => r.data),
    onSuccess: () => { toast.success('Service saved'); qc.invalidateQueries(['owner-decoration', propertyId]); setEditing(null); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/wedding/owner/decoration/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['owner-decoration', propertyId]); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const openNew = () => { setForm({ propertyId, name: '', serviceType: 'GENERAL', description: '', price: '', images: '' }); setEditing({}); };
  const openEdit = (s) => { setForm({ ...s, images: (s.images || []).join('\n') }); setEditing(s); };
  const handleSave = () => {
    if (!form.name || !form.price) return toast.error('Name and price required');
    save.mutate({ ...form, propertyId, price: Number(form.price), images: form.images.split('\n').filter(Boolean) });
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="btn-primary flex items-center gap-2 text-sm"><PlusIcon className="h-4 w-4" /> Add Service</button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <StarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No decoration services yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map(s => (
            <div key={s.id} className={`card p-4 ${!s.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <span className="text-xs bg-pink-100 text-pink-700 font-semibold px-2 py-0.5 rounded-full">{DECOR_TYPES.find(t => t.value === s.serviceType)?.label || s.serviceType}</span>
                  <p className="font-semibold text-gray-900 mt-1 truncate">{s.name}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"><PencilIcon className="h-4 w-4" /></button>
                  <button onClick={() => { if (confirm('Delete?')) del.mutate(s.id); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><TrashIcon className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="text-lg font-bold text-forest-700">₹{Number(s.price).toLocaleString('en-IN')}</p>
              {s.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.description}</p>}
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <Modal title={editing.id ? 'Edit Decoration Service' : 'Add Decoration Service'} onClose={() => setEditing(null)} onSave={handleSave} saving={save.isPending}>
          <div>
            <label className="label">Service Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Grand Floral Mandap Decor" />
          </div>
          <div>
            <label className="label">Service Type</label>
            <select className="input" value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}>
              {DECOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Price (₹) *</label>
            <input className="input" type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Photo URLs (one per line)</label>
            <textarea className="input resize-none" rows={3} value={form.images} onChange={e => setForm(f => ({ ...f, images: e.target.value }))} placeholder="https://..." />
          </div>
          {editing.id && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded" checked={form.isActive !== false} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              Active
            </label>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── Gallery Tab ───────────────────────────────────────────────────────────────
function GalleryTab({ propertyId }) {
  const qc = useQueryClient();
  const [catFilter, setCatFilter] = useState('ALL');
  const [addForm, setAddForm] = useState(null);

  const { data: photos = [] } = useQuery({
    queryKey: ['owner-gallery', propertyId, catFilter],
    queryFn: () => api.get('/wedding/owner/gallery', { params: { propertyId, category: catFilter !== 'ALL' ? catFilter : undefined } }).then(r => r.data),
    enabled: Boolean(propertyId),
  });

  const addMut = useMutation({
    mutationFn: (data) => api.post('/wedding/owner/gallery', data).then(r => r.data),
    onSuccess: () => { toast.success('Photo added'); qc.invalidateQueries(['owner-gallery', propertyId]); setAddForm(null); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/wedding/owner/gallery/${id}`, data).then(r => r.data),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries(['owner-gallery', propertyId]); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const delMut = useMutation({
    mutationFn: (id) => api.delete(`/wedding/owner/gallery/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['owner-gallery', propertyId]); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1 flex-wrap flex-1">
          {[{ value: 'ALL', label: 'All' }, ...GALLERY_CATEGORIES].map(c => (
            <button key={c.value} onClick={() => setCatFilter(c.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${catFilter === c.value ? 'bg-forest-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {c.label}
            </button>
          ))}
        </div>
        <button onClick={() => setAddForm({ propertyId, url: '', category: 'GENERAL', altText: '', isCover: false })} className="btn-primary flex items-center gap-2 text-sm flex-shrink-0">
          <PlusIcon className="h-4 w-4" /> Add Photo
        </button>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <PhotoIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No photos in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map(p => (
            <div key={p.id} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100">
              <img src={p.url} alt={p.altText || ''} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
              {p.isCover && (
                <span className="absolute top-1 left-1 bg-gold-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Cover</span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                <select
                  className="text-xs bg-white rounded px-2 py-1 w-full"
                  value={p.category}
                  onChange={e => updateMut.mutate({ id: p.id, category: e.target.value })}
                >
                  {GALLERY_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateMut.mutate({ id: p.id, isCover: !p.isCover })}
                    className="text-xs bg-gold-500 text-white px-2 py-1 rounded"
                    title={p.isCover ? 'Unset Cover' : 'Set as Cover'}
                  >
                    {p.isCover ? '★ Cover' : '☆ Cover'}
                  </button>
                  <button onClick={() => { if (confirm('Delete photo?')) delMut.mutate(p.id); }} className="text-xs bg-red-500 text-white px-2 py-1 rounded">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {addForm && (
        <Modal title="Add Photo" onClose={() => setAddForm(null)} onSave={() => { if (!addForm.url) return toast.error('URL required'); addMut.mutate(addForm); }} saving={addMut.isPending}>
          <div>
            <label className="label">Photo URL *</label>
            <input className="input" value={addForm.url} onChange={e => setAddForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}>
              {GALLERY_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Alt Text / Caption</label>
            <input className="input" value={addForm.altText} onChange={e => setAddForm(f => ({ ...f, altText: e.target.value }))} placeholder="Photo description" />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded" checked={addForm.isCover} onChange={e => setAddForm(f => ({ ...f, isCover: e.target.checked }))} />
            Set as cover photo
          </label>
          {addForm.url && (
            <img src={addForm.url} alt="Preview" className="w-full h-40 object-cover rounded-xl" onError={e => e.target.remove()} />
          )}
        </Modal>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'packages',    label: 'Wedding Packages', icon: SparklesIcon },
  { key: 'photography', label: 'Photography',       icon: CameraIcon },
  { key: 'decoration',  label: 'Decoration',        icon: StarIcon },
  { key: 'gallery',     label: 'Photo Gallery',     icon: PhotoIcon },
];

export default function WeddingPackagesPage() {
  const [activeTab, setActiveTab] = useState('packages');
  const [selectedProperty, setSelectedProperty] = useState('');

  const { data: properties = [] } = useQuery({
    queryKey: ['owner-properties-list'],
    queryFn: () => api.get('/owner/properties').then(r => r.data?.properties || r.data || []),
  });

  const propId = selectedProperty || properties[0]?.id || '';

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="section-title">Wedding Packages & Services</h1>
          <p className="section-subtitle">Manage ceremony packages, photography, decoration, and gallery</p>
        </div>
        {properties.length > 1 && (
          <select
            className="input w-56"
            value={propId}
            onChange={e => setSelectedProperty(e.target.value)}
          >
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-forest-600 text-forest-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {!propId ? (
          <div className="text-center py-12 text-gray-400">No properties found. Add a property first.</div>
        ) : (
          <>
            {activeTab === 'packages'    && <WeddingPackagesTab propertyId={propId} />}
            {activeTab === 'photography' && <PhotographyTab     propertyId={propId} />}
            {activeTab === 'decoration'  && <DecorationTab      propertyId={propId} />}
            {activeTab === 'gallery'     && <GalleryTab         propertyId={propId} />}
          </>
        )}
      </div>
    </div>
  );
}
