import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../context/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { BuildingLibraryIcon, LockClosedIcon, ArrowLeftIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setAuth, user, token } = useAuthStore();

  // Already authenticated as admin — skip to dashboard
  useEffect(() => {
    if (token && user?.role === 'ADMIN') {
      navigate('/admin', { replace: true });
    }
  }, [token, user, navigate]);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/admin/login', form);
      setAuth(data);
      toast.success('Welcome, Admin');
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-forest-800 flex items-center justify-center px-4">
      {/* Back to User Login */}
      <Link to="/login"
        className="absolute top-5 left-5 flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium group">
        <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to User Login
      </Link>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-forest-600 rounded-xl3 mb-4">
            <BuildingLibraryIcon className="h-7 w-7 text-gold-300" />
          </div>
          <h1 className="font-display font-bold text-white text-2xl">Admin Panel</h1>
          <p className="text-forest-300 text-sm mt-1">Mandap & Resort Booking</p>
        </div>

        <div className="bg-white rounded-xl3 shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required placeholder="admin@example.com" className="input" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required placeholder="••••••••" className="input pr-10"
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
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2">
              <LockClosedIcon className="h-4 w-4" />
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
