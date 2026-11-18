import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon, ClipboardDocumentIcon, EyeIcon, EyeSlashIcon,
} from '@heroicons/react/24/outline';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;

const OWNER_TYPES = [
  { value: 'RESORT',  label: 'Resort Owner' },
  { value: 'MANDAP',  label: 'Mandap Owner' },
  { value: 'GENERAL', label: 'Both (Mandap & Resort Owner)' },
];

const OWNER_TYPE_LABEL = {
  RESORT:  'Resort Owner',
  MANDAP:  'Mandap Owner',
  GENERAL: 'Both (Mandap & Resort Owner)',
};

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-500">{msg}</p>;
}

function validate(form) {
  const errs = {};
  if (!form.fullName.trim()) errs.fullName = 'Full name is required';
  if (!form.businessName.trim()) errs.businessName = 'Venue name is required';
  if (!form.phone) errs.phone = 'Mobile number is required';
  else if (!PHONE_RE.test(form.phone)) errs.phone = 'Enter a valid 10-digit Indian mobile number';
  if (!form.email.trim()) errs.email = 'Email address is required';
  else if (!EMAIL_RE.test(form.email)) errs.email = 'Enter a valid email address';
  if (!form.password) errs.password = 'Password is required';
  else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
  if (!form.confirmPassword) errs.confirmPassword = 'Please confirm the password';
  else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
  return errs;
}

export default function RegisterOwner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') || 'RESORT';

  const [form, setForm] = useState({
    ownerType: OWNER_TYPES.some(t => t.value === defaultType) ? defaultType : 'RESORT',
    fullName: '',
    businessName: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [created, setCreated] = useState(null); // credential summary after success

  const set = (k, v) => {
    const next = { ...form, [k]: v };
    setForm(next);
    if (touched[k]) {
      const errs = validate(next);
      setErrors(e => ({ ...e, [k]: errs[k] }));
    }
  };

  const blur = (k) => {
    setTouched(t => ({ ...t, [k]: true }));
    const errs = validate(form);
    setErrors(e => ({ ...e, [k]: errs[k] }));
  };

  const mutation = useMutation({
    mutationFn: (data) => api.post('/admin/register-owner', data),
    onSuccess: (res) => {
      toast.success('Owner registered successfully');
      setCreated({ ...form });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      if (msg.toLowerCase().includes('phone')) setErrors(e => ({ ...e, phone: msg }));
      if (msg.toLowerCase().includes('email')) setErrors(e => ({ ...e, email: msg }));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(form).map(k => [k, true]));
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const { confirmPassword, ...payload } = form;
    mutation.mutate(payload);
  };

  const inputClass = (k) =>
    `input ${errors[k] && touched[k] ? 'border-red-400 focus:ring-red-400' : ''}`;

  const copyText = (text) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success('Copied'),
      () => toast.error('Copy failed — select manually'),
    );
  };

  // ── Credential summary shown after successful creation ──────────────────────
  if (created) {
    return (
      <div className="max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <CheckCircleIcon className="h-8 w-8 text-green-500" />
          <div>
            <h1 className="section-title">Owner Registered</h1>
            <p className="section-subtitle">Share these credentials with the owner securely</p>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Login Credentials</h2>

          {[
            { label: 'Full Name',  value: created.fullName },
            { label: 'Email',      value: created.email },
            { label: 'Mobile',     value: `+91 ${created.phone}` },
            { label: 'Password',   value: created.password },
            { label: 'Venue',      value: created.businessName },
            { label: 'Owner Type', value: OWNER_TYPE_LABEL[created.ownerType] || created.ownerType },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="min-w-0">
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="text-sm text-gray-900 font-medium truncate">{value}</p>
              </div>
              <button
                onClick={() => copyText(value)}
                className="p-1.5 text-gray-400 hover:text-forest-600 hover:bg-forest-50 rounded-lg transition-colors flex-shrink-0"
                title="Copy"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800">
            Share these credentials privately. The owner should change their password after first login.
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setCreated(null); setForm({ ownerType: 'RESORT', fullName: '', businessName: '', phone: '', email: '', address: '', password: '', confirmPassword: '' }); setErrors({}); setTouched({}); }}
            className="btn-primary flex-1"
          >
            Register Another Owner
          </button>
          <Link to="/admin/resort-owners" className="btn-outline flex-1 text-center">
            View All Owners
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div>
        <h1 className="section-title">Owner Registration</h1>
        <p className="section-subtitle">Register a new venue owner — credentials will be shared with the owner</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="card p-6 space-y-5">

        {/* Owner Type */}
        <div>
          <label className="label">Owner Type *</label>
          <select value={form.ownerType} onChange={e => set('ownerType', e.target.value)} className="input">
            {OWNER_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Name + Venue */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Owner Full Name *</label>
            <input value={form.fullName} onChange={e => set('fullName', e.target.value)}
              onBlur={() => blur('fullName')}
              className={inputClass('fullName')} placeholder="Owner's full name" />
            {touched.fullName && <FieldError msg={errors.fullName} />}
          </div>
          <div>
            <label className="label">Venue Name *</label>
            <input value={form.businessName} onChange={e => set('businessName', e.target.value)}
              onBlur={() => blur('businessName')}
              className={inputClass('businessName')} placeholder="Venue or business name" />
            {touched.businessName && <FieldError msg={errors.businessName} />}
          </div>
        </div>

        {/* Phone + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Mobile Number *</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-sm text-gray-600">+91</span>
              <input type="tel" value={form.phone}
                onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                onBlur={() => blur('phone')}
                className={`input rounded-l-none ${errors.phone && touched.phone ? 'border-red-400 focus:ring-red-400' : ''}`}
                placeholder="10-digit number" />
            </div>
            {touched.phone && <FieldError msg={errors.phone} />}
          </div>
          <div>
            <label className="label">Email Address *</label>
            <input type="email" value={form.email}
              onChange={e => set('email', e.target.value)}
              onBlur={() => blur('email')}
              className={inputClass('email')} placeholder="owner@example.com" />
            {touched.email && <FieldError msg={errors.email} />}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="label">Complete Address</label>
          <textarea value={form.address} onChange={e => set('address', e.target.value)}
            rows={2} className="input resize-none" placeholder="Owner's full address" />
        </div>

        {/* Password + Confirm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Password *</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                onBlur={() => blur('password')}
                className={`input pr-10 ${errors.password && touched.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                placeholder="Minimum 8 characters"
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            {touched.password && <FieldError msg={errors.password} />}
          </div>
          <div>
            <label className="label">Confirm Password *</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={e => set('confirmPassword', e.target.value)}
                onBlur={() => blur('confirmPassword')}
                className={`input pr-10 ${errors.confirmPassword && touched.confirmPassword ? 'border-red-400 focus:ring-red-400' : ''}`}
                placeholder="Re-enter password"
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            {touched.confirmPassword && <FieldError msg={errors.confirmPassword} />}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-outline flex-1">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
            {mutation.isPending ? 'Registering...' : 'Register Owner'}
          </button>
        </div>
      </form>
    </div>
  );
}
