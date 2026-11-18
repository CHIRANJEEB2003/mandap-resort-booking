import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  BuildingOffice2Icon, MapPinIcon, UserCircleIcon, ChevronLeftIcon,
  PlusIcon, XMarkIcon, EyeIcon, EyeSlashIcon,
} from '@heroicons/react/24/outline';

const PROPERTY_TYPES = [
  { value: 'RESORT', label: 'Resort' },
  { value: 'BANQUET_HALL', label: 'Banquet Hall' },
  { value: 'WEDDING_VENUE', label: 'Wedding Venue' },
  { value: 'MANDAP', label: 'Mandap' },
  { value: 'MARRIAGE_HALL', label: 'Marriage Hall' },
];

const TARGET_DISTRICT_KEYS = ['puri', 'jagatsinghpur', 'khordha', 'cuttack', 'bhubaneswar'];

const STATUSES = [
  { value: 'APPROVED', label: 'Approved — Live on site' },
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'DRAFT', label: 'Draft — not visible' },
  { value: 'INACTIVE', label: 'Inactive — hidden' },
];

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-500">{msg}</p>;
}

function validate(form) {
  const errs = {};
  if (!form.name.trim()) errs.name = 'Venue name is required';
  if (!form.propertyType) errs.propertyType = 'Please select a venue type';
  if (!form.description.trim()) errs.description = 'Description is required';
  if (!form.locationNodeId) errs.locationNodeId = 'Please select a district';
  if (!form.addressLine.trim()) errs.addressLine = 'Full address is required';
  if (!form.ownerId) errs.ownerId = 'Please assign an owner';
  if (!form.totalCapacity || Number(form.totalCapacity) < 1) errs.totalCapacity = 'Capacity must be at least 1';
  return errs;
}

const OWNER_TYPES = [
  { value: 'GENERAL', label: 'General' },
  { value: 'RESORT', label: 'Resort' },
  { value: 'BANQUET', label: 'Banquet Hall' },
  { value: 'WEDDING', label: 'Wedding Venue' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;

function validateOwner(f) {
  const e = {};
  if (!f.fullName.trim()) e.fullName = 'Full name is required';
  if (!f.businessName.trim()) e.businessName = 'Business name is required';
  if (!f.email.trim()) e.email = 'Email is required';
  else if (!EMAIL_RE.test(f.email)) e.email = 'Enter a valid email';
  if (!f.phone) e.phone = 'Mobile number is required';
  else if (!PHONE_RE.test(f.phone)) e.phone = 'Enter a valid 10-digit number';
  if (!f.password) e.password = 'Password is required';
  else if (f.password.length < 8) e.password = 'Minimum 8 characters';
  if (!f.confirmPassword) e.confirmPassword = 'Please confirm password';
  else if (f.password !== f.confirmPassword) e.confirmPassword = 'Passwords do not match';
  return e;
}

function AddOwnerModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    fullName: '', businessName: '', email: '', phone: '',
    password: '', confirmPassword: '', ownerType: 'GENERAL', address: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const setF = (k, v) => {
    const next = { ...form, [k]: v };
    setForm(next);
    if (touched[k]) setErrors(e => ({ ...e, [k]: validateOwner(next)[k] }));
  };
  const blur = (k) => {
    setTouched(t => ({ ...t, [k]: true }));
    setErrors(e => ({ ...e, [k]: validateOwner(form)[k] }));
  };

  const mutation = useMutation({
    mutationFn: (data) => api.post('/admin/register-owner', data).then(r => r.data),
    onSuccess: (data) => {
      toast.success('Owner registered successfully');
      onCreated(data.user);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to register owner';
      toast.error(msg);
      if (msg.toLowerCase().includes('email')) setErrors(e => ({ ...e, email: msg }));
      if (msg.toLowerCase().includes('phone')) setErrors(e => ({ ...e, phone: msg }));
    },
  });

  const handleSubmit = (evt) => {
    evt.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(form).map(k => [k, true]));
    setTouched(allTouched);
    const errs = validateOwner(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    mutation.mutate({
      fullName: form.fullName.trim(),
      businessName: form.businessName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone,
      password: form.password,
      ownerType: form.ownerType,
      address: form.address.trim(),
    });
  };

  const inp = (k) => `input ${errors[k] && touched[k] ? 'border-red-400 focus:ring-red-400' : ''}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-display font-bold text-gray-900 text-lg">Register New Owner</h2>
          <button type="button" onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form id="add-owner-form" onSubmit={handleSubmit} noValidate className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input value={form.fullName} onChange={e => setF('fullName', e.target.value)}
                onBlur={() => blur('fullName')} placeholder="Owner full name"
                className={inp('fullName')} />
              {touched.fullName && <FieldError msg={errors.fullName} />}
            </div>
            <div>
              <label className="label">Business Name *</label>
              <input value={form.businessName} onChange={e => setF('businessName', e.target.value)}
                onBlur={() => blur('businessName')} placeholder="Venue / business name"
                className={inp('businessName')} />
              {touched.businessName && <FieldError msg={errors.businessName} />}
            </div>
          </div>

          <div>
            <label className="label">Email Address *</label>
            <input type="email" value={form.email} onChange={e => setF('email', e.target.value)}
              onBlur={() => blur('email')} placeholder="owner@example.com"
              className={inp('email')} />
            {touched.email && <FieldError msg={errors.email} />}
          </div>

          <div>
            <label className="label">Mobile Number *</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-sm text-gray-600 select-none">+91</span>
              <input type="tel" value={form.phone}
                onChange={e => setF('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                onBlur={() => blur('phone')} placeholder="10-digit number" maxLength={10}
                className={`input rounded-l-none ${errors.phone && touched.phone ? 'border-red-400 focus:ring-red-400' : ''}`} />
            </div>
            {touched.phone && <FieldError msg={errors.phone} />}
          </div>

          <div>
            <label className="label">Owner Type</label>
            <select value={form.ownerType} onChange={e => setF('ownerType', e.target.value)} className="input">
              {OWNER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Address</label>
            <textarea value={form.address} onChange={e => setF('address', e.target.value)}
              rows={2} className="input resize-none" placeholder="Owner address (optional)" />
          </div>

          <div>
            <label className="label">Password *</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={form.password}
                onChange={e => setF('password', e.target.value)} onBlur={() => blur('password')}
                placeholder="Min 8 characters" className={`${inp('password')} pr-10`} />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                {showPwd ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            {touched.password && <FieldError msg={errors.password} />}
          </div>

          <div>
            <label className="label">Confirm Password *</label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                onChange={e => setF('confirmPassword', e.target.value)} onBlur={() => blur('confirmPassword')}
                placeholder="Re-enter password" className={`${inp('confirmPassword')} pr-10`} />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                {showConfirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            {touched.confirmPassword && <FieldError msg={errors.confirmPassword} />}
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button type="submit" form="add-owner-form" disabled={mutation.isPending}
            className="btn-primary flex-1">
            {mutation.isPending ? 'Registering...' : 'Register Owner'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AddEditVenue() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();
  const [showAddOwner, setShowAddOwner] = useState(false);

  const [form, setForm] = useState({
    name: '', propertyType: 'RESORT', description: '',
    locationNodeId: '', addressLine: '', ownerId: '',
    totalCapacity: '', parkingCapacity: '',
    hasAC: false, hasPool: false, hasRooms: false, outdoorArea: false,
    termsConditions: '', status: 'APPROVED',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const { data: locations } = useQuery({
    queryKey: ['admin-locations'],
    queryFn: () => api.get('/admin/locations').then(r => r.data),
  });

  const districts = useMemo(() => {
    if (!locations) return [];
    const odisha = locations.find(s => s.code === 'OD');
    if (!odisha?.nodes?.length) return [];
    const target = odisha.nodes.filter(n =>
      TARGET_DISTRICT_KEYS.some(k => n.name.toLowerCase().includes(k))
    );
    return target.length > 0 ? target : odisha.nodes;
  }, [locations]);

  const { data: owners = [] } = useQuery({
    queryKey: ['owners-dropdown'],
    queryFn: () => api.get('/admin/owners-dropdown').then(r => r.data),
  });

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['admin-property-detail', id],
    queryFn: () => api.get(`/admin/properties/${id}`).then(r => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existing) return;
    setForm({
      name: existing.name || '',
      propertyType: existing.propertyType || 'RESORT',
      description: existing.description || '',
      locationNodeId: String(existing.locationNodeId || ''),
      addressLine: existing.addressLine || '',
      ownerId: existing.owner?.id || existing.ownerId || '',
      totalCapacity: String(existing.totalCapacity || ''),
      parkingCapacity: String(existing.parkingCapacity || ''),
      hasAC: existing.hasAC || false,
      hasPool: existing.hasPool || false,
      hasRooms: existing.hasRooms || false,
      outdoorArea: existing.outdoorArea || false,
      termsConditions: existing.termsConditions || '',
      status: existing.status || 'APPROVED',
    });
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? api.put(`/admin/venues/${id}`, data)
        : api.post('/admin/venues', data),
    onSuccess: () => {
      toast.success(isEdit ? 'Venue updated' : 'Venue created');
      navigate(-1);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save venue'),
  });

  const set = (k, v) => {
    const next = { ...form, [k]: v };
    setForm(next);
    if (touched[k]) {
      const errs = validate(next);
      setErrors(prev => ({ ...prev, [k]: errs[k] }));
    }
  };

  const blur = (k) => {
    setTouched(t => ({ ...t, [k]: true }));
    const errs = validate(form);
    setErrors(prev => ({ ...prev, [k]: errs[k] }));
  };

  const handleSubmit = (evt) => {
    evt.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(form).map(k => [k, true]));
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Please fix the errors before saving');
      return;
    }
    mutation.mutate({
      ...form,
      locationNodeId: form.locationNodeId,
      totalCapacity: Number(form.totalCapacity),
      parkingCapacity: form.parkingCapacity ? Number(form.parkingCapacity) : undefined,
    });
  };

  if (isEdit && loadingExisting) return <LoadingSpinner />;

  const inputCls = (k) =>
    `input ${errors[k] && touched[k] ? 'border-red-400 focus:ring-red-400' : ''}`;

  const handleOwnerCreated = (newUser) => {
    const profile = newUser.ownerProfile;
    if (profile) {
      queryClient.setQueryData(['owners-dropdown'], (prev = []) => [
        ...prev,
        { id: profile.id, fullName: profile.fullName, businessName: profile.businessName, ownerType: profile.ownerType },
      ]);
      setForm(f => ({ ...f, ownerId: profile.id }));
    }
    queryClient.invalidateQueries({ queryKey: ['owners-dropdown'] });
    setShowAddOwner(false);
  };

  return (
    <>
    {showAddOwner && (
      <AddOwnerModal onClose={() => setShowAddOwner(false)} onCreated={handleOwnerCreated} />
    )}
    <form onSubmit={handleSubmit} noValidate className="w-full max-w-2xl space-y-6">

      {/* Header */}
      <div>
        <button type="button" onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-forest-700 transition-colors mb-2">
          <ChevronLeftIcon className="h-4 w-4" />
          Back
        </button>
        <h1 className="section-title">{isEdit ? 'Edit Venue' : 'Add New Venue'}</h1>
        <p className="section-subtitle">
          {isEdit ? 'Update venue details below' : 'Create a new venue and assign it to an owner'}
        </p>
      </div>

      {/* Basic Details */}
      <div className="card p-6 space-y-4">
        <h2 className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <BuildingOffice2Icon className="h-4 w-4 text-forest-600" />
          Venue Details
        </h2>

        <div>
          <label className="label">Venue Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            onBlur={() => blur('name')} placeholder="e.g. Sunrise Resort & Banquet"
            className={inputCls('name')} />
          {touched.name && <FieldError msg={errors.name} />}
        </div>

        <div>
          <label className="label">Venue Type *</label>
          <select value={form.propertyType} onChange={e => set('propertyType', e.target.value)}
            onBlur={() => blur('propertyType')} className={inputCls('propertyType')}>
            {PROPERTY_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {touched.propertyType && <FieldError msg={errors.propertyType} />}
        </div>

        <div>
          <label className="label">Description *</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            onBlur={() => blur('description')} rows={4} className={`${inputCls('description')} resize-none`}
            placeholder="Describe the venue, facilities, and what makes it special..." />
          {touched.description && <FieldError msg={errors.description} />}
        </div>
      </div>

      {/* Location */}
      <div className="card p-6 space-y-4">
        <h2 className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <MapPinIcon className="h-4 w-4 text-forest-600" />
          Location
        </h2>

        <div>
          <label className="label">District *</label>
          <select value={form.locationNodeId} onChange={e => set('locationNodeId', e.target.value)}
            onBlur={() => blur('locationNodeId')} className={inputCls('locationNodeId')}>
            <option value="">Select district...</option>
            {districts.map(d => (
              <option key={d.id} value={String(d.id)}>{d.name}</option>
            ))}
          </select>
          {touched.locationNodeId && <FieldError msg={errors.locationNodeId} />}
          {locations && districts.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              No Odisha districts found. Add them from{' '}
              <Link to="/admin/locations" className="underline">Location Manager</Link>.
            </p>
          )}
        </div>

        <div>
          <label className="label">Full Address *</label>
          <textarea value={form.addressLine} onChange={e => set('addressLine', e.target.value)}
            onBlur={() => blur('addressLine')} rows={2}
            className={`${inputCls('addressLine')} resize-none`}
            placeholder="Plot no., street, area, landmark, city, PIN code..." />
          {touched.addressLine && <FieldError msg={errors.addressLine} />}
        </div>
      </div>

      {/* Owner */}
      <div className="card p-6 space-y-4">
        <h2 className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <UserCircleIcon className="h-4 w-4 text-forest-600" />
          Owner Assignment
        </h2>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">Assign to Owner *</label>
            <button type="button" onClick={() => setShowAddOwner(true)}
              className="flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-900 transition-colors">
              <PlusIcon className="h-3.5 w-3.5" />
              Add New Owner
            </button>
          </div>
          <select value={form.ownerId} onChange={e => set('ownerId', e.target.value)}
            onBlur={() => blur('ownerId')} className={inputCls('ownerId')}>
            <option value="">Select owner...</option>
            {owners.map(o => (
              <option key={o.id} value={o.id}>
                {o.businessName} — {o.fullName} ({o.ownerType})
              </option>
            ))}
          </select>
          {touched.ownerId && <FieldError msg={errors.ownerId} />}
          {owners.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              No owners found. Use "+ Add New Owner" above to register one.
            </p>
          )}
        </div>
      </div>

      {/* Capacity & Facilities */}
      <div className="card p-6 space-y-4">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Capacity & Facilities
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Guest Capacity *</label>
            <input type="number" min="1" value={form.totalCapacity}
              onChange={e => set('totalCapacity', e.target.value)}
              onBlur={() => blur('totalCapacity')}
              placeholder="e.g. 500" className={inputCls('totalCapacity')} />
            {touched.totalCapacity && <FieldError msg={errors.totalCapacity} />}
          </div>
          <div>
            <label className="label">Parking Capacity</label>
            <input type="number" min="0" value={form.parkingCapacity}
              onChange={e => set('parkingCapacity', e.target.value)}
              placeholder="e.g. 100" className="input" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'hasAC', label: 'Air Conditioning' },
            { key: 'hasPool', label: 'Swimming Pool' },
            { key: 'hasRooms', label: 'Rooms Available' },
            { key: 'outdoorArea', label: 'Outdoor Area' },
          ].map(({ key, label }) => (
            <label key={key}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-forest-400 transition-colors select-none">
              <input type="checkbox" checked={form[key]}
                onChange={e => set(key, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-forest-600 focus:ring-forest-500" />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Additional */}
      <div className="card p-6 space-y-4">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Additional Details
        </h2>

        <div>
          <label className="label">Terms & Conditions</label>
          <textarea value={form.termsConditions} onChange={e => set('termsConditions', e.target.value)}
            rows={3} className="input resize-none"
            placeholder="Booking terms, cancellation policy, advance payment requirements..." />
        </div>

        <div>
          <label className="label">Listing Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className="input">
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            Approved venues are immediately visible to customers.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pb-6">
        <button type="button" onClick={() => navigate(-1)} className="btn-outline flex-1">
          Cancel
        </button>
        <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
          {mutation.isPending
            ? (isEdit ? 'Saving...' : 'Creating...')
            : (isEdit ? 'Save Changes' : 'Create Venue')}
        </button>
      </div>

    </form>
    </>
  );
}
