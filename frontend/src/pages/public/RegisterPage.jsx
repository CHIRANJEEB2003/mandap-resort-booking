import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../context/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  EyeIcon, EyeSlashIcon, InformationCircleIcon,
} from '@heroicons/react/24/outline';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;

function validate(form) {
  const errs = {};
  if (!form.fullName.trim()) errs.fullName = 'Full name is required';
  if (!form.email.trim()) errs.email = 'Email address is required';
  else if (!EMAIL_RE.test(form.email)) errs.email = 'Enter a valid email address';
  if (!form.phone) errs.phone = 'Mobile number is required';
  else if (!PHONE_RE.test(form.phone)) errs.phone = 'Enter a valid 10-digit Indian mobile number';
  if (!form.password) errs.password = 'Password is required';
  else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
  if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
  else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
  return errs;
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-500">{msg}</p>;
}

function PasswordInput({ id, label, value, onChange, show, onToggle, error, placeholder }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label} *</label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`input pr-10 ${error ? 'border-red-400 focus:ring-red-400' : ''}`}
        />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
          {show ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
      <FieldError msg={error} />
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next') || null;
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(form).map(k => [k, true]));
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone,
        password: form.password,
        role: 'CUSTOMER',
      });
      setAuth(data);
      toast.success('Account created! Welcome aboard.');
      try { sessionStorage.setItem('mrb_welcome', 'new'); } catch {}
      navigate(nextPath || '/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
      if (msg.toLowerCase().includes('email')) setErrors(e => ({ ...e, email: msg }));
      if (msg.toLowerCase().includes('mobile') || msg.toLowerCase().includes('phone')) {
        setErrors(e => ({ ...e, phone: msg }));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `input ${errors[field] && touched[field] ? 'border-red-400 focus:ring-red-400' : ''}`;

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="Mandap & Resort Booking" className="h-16 w-auto object-contain mx-auto" />
          </Link>
          <p className="text-gray-500 text-sm mt-3">Create your free customer account</p>
        </div>

        {/* Owner notice */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
          <InformationCircleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Are you a venue owner?</span> Owner accounts are created by an administrator. Please contact your admin for login credentials.
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Full Name */}
            <div>
              <label className="label" htmlFor="fullName">Full Name *</label>
              <input id="fullName" type="text" value={form.fullName}
                onChange={e => set('fullName', e.target.value)}
                onBlur={() => blur('fullName')}
                placeholder="Your full name"
                className={inputClass('fullName')} />
              {touched.fullName && <FieldError msg={errors.fullName} />}
            </div>

            {/* Email */}
            <div>
              <label className="label" htmlFor="email">Email Address *</label>
              <input id="email" type="email" value={form.email}
                onChange={e => set('email', e.target.value)}
                onBlur={() => blur('email')}
                placeholder="you@example.com"
                className={inputClass('email')}
                autoComplete="email" />
              {touched.email && <FieldError msg={errors.email} />}
            </div>

            {/* Mobile */}
            <div>
              <label className="label" htmlFor="phone">Mobile Number *</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-sm text-gray-600 select-none">
                  +91
                </span>
                <input id="phone" type="tel" value={form.phone}
                  onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onBlur={() => blur('phone')}
                  placeholder="10-digit number" maxLength={10}
                  className={`input rounded-l-none ${errors.phone && touched.phone ? 'border-red-400 focus:ring-red-400' : ''}`} />
              </div>
              {touched.phone && <FieldError msg={errors.phone} />}
            </div>

            {/* Password */}
            <PasswordInput
              id="password" label="Create Password" value={form.password}
              onChange={e => set('password', e.target.value)}
              show={showPwd} onToggle={() => setShowPwd(v => !v)}
              error={touched.password ? errors.password : ''}
              placeholder="Minimum 8 characters"
            />

            {/* Confirm Password */}
            <PasswordInput
              id="confirmPassword" label="Confirm Password" value={form.confirmPassword}
              onChange={e => set('confirmPassword', e.target.value)}
              show={showConfirm} onToggle={() => setShowConfirm(v => !v)}
              error={touched.confirmPassword ? errors.confirmPassword : ''}
              placeholder="Re-enter your password"
            />

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'} className="text-forest-600 font-medium hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
