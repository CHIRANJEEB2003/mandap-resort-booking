import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../context/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next') || null;
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = (id = identifier, pwd = password) => {
    const errs = {};
    if (!id.trim()) errs.identifier = 'Email or mobile number is required';
    if (!pwd) errs.password = 'Password is required';
    return errs;
  };

  const blur = (field) => {
    setTouched(t => ({ ...t, [field]: true }));
    setErrors(validate());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ identifier: true, password: true });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { identifier: identifier.trim(), password });
      setAuth(data);
      toast.success('Welcome back!');
      if (data.role === 'CUSTOMER') {
        try { sessionStorage.setItem('mrb_welcome', 'back'); } catch {}
        navigate(nextPath || '/');
      } else {
        navigate(data.role === 'ADMIN' ? '/admin' : '/owner');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Sign in failed. Please try again.';
      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (f) =>
    `input ${errors[f] && touched[f] ? 'border-red-400 focus:ring-red-400' : ''}`;

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="Mandap & Resort Booking" className="h-16 w-auto object-contain mx-auto" />
          </Link>
          <p className="text-gray-500 text-sm mt-3">Sign in to your account</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Global auth error */}
            {errors.form && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                {errors.form}
              </div>
            )}

            {/* Identifier */}
            <div>
              <label className="label" htmlFor="identifier">Username or Email Address *</label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={e => { setIdentifier(e.target.value); if (touched.identifier) setErrors(validate(e.target.value, password)); }}
                onBlur={() => blur('identifier')}
                placeholder="Enter username or email address"
                className={fieldClass('identifier')}
                autoComplete="username"
                autoFocus
              />
              {errors.identifier && touched.identifier && (
                <p className="mt-1 text-xs text-red-500">{errors.identifier}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="label" htmlFor="password">Password *</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); if (touched.password) setErrors(validate(identifier, e.target.value)); }}
                  onBlur={() => blur('password')}
                  placeholder="Enter your password"
                  className={`${fieldClass('password')} pr-10`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>

            {/* Links */}
            <div className="space-y-2 pt-1">
              <p className="text-center text-sm text-gray-500">
                <Link to="/forgot-password" className="text-forest-600 hover:underline">
                  Forgot your password?
                </Link>
              </p>
              <p className="text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <Link to={nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : '/register'} className="text-forest-600 font-medium hover:underline">
                  Register
                </Link>
              </p>
              <p className="text-center text-sm text-gray-400">
                Admin?{' '}
                <Link to="/admin/login" className="text-gold-600 hover:underline">
                  Admin Login
                </Link>
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
