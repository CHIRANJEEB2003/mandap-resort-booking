import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../context/authStore';
import toast from 'react-hot-toast';
import {
  CogIcon, CurrencyRupeeIcon, ShieldCheckIcon,
  BuildingLibraryIcon, CheckCircleIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';

// ─── section card ─────────────────────────────────────────────────────────────

function SettingSection({ icon: Icon, title, description, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-100">
        <div className="p-2 rounded-lg bg-[#142B0A]/8 text-[#142B0A]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function AdminSettings() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  // ── platform config ──
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['admin-config'],
    queryFn: () => api.get('/admin/config').then(r => r.data),
  });

  // ── finance dashboard for current commission ──
  const { data: finance } = useQuery({
    queryKey: ['admin-finance'],
    queryFn: () => api.get('/admin/finance/dashboard').then(r => r.data),
  });

  // ── local state ──
  const [commission, setCommission]       = useState('');
  const [platformName, setPlatformName]   = useState('');
  const [supportEmail, setSupportEmail]   = useState('');
  const [supportPhone, setSupportPhone]   = useState('');
  const [bookingTimeout, setBookingTimeout] = useState('');

  useEffect(() => {
    if (config) {
      setPlatformName(config.platform_name?.value  || 'Mandap & Resort Booking');
      setSupportEmail(config.support_email?.value  || '');
      setSupportPhone(config.support_phone?.value  || '');
      setBookingTimeout(config.booking_timeout_hours?.value || '24');
    }
  }, [config]);

  // ── mutations ──
  const commissionMut = useMutation({
    mutationFn: () => api.put('/admin/platform-config/commission', { rate: Number(commission) }),
    onSuccess: () => { toast.success('Commission rate updated'); setCommission(''); qc.invalidateQueries(['admin-finance']); },
    onError: () => toast.error('Update failed'),
  });

  const configMut = useMutation({
    mutationFn: (body) => api.put('/admin/config', body),
    onSuccess: () => { toast.success('Settings saved'); qc.invalidateQueries(['admin-config']); },
    onError: () => toast.error('Save failed'),
  });

  const saveGeneral = () => {
    const saves = [
      { key: 'platform_name',          value: { value: platformName } },
      { key: 'support_email',          value: { value: supportEmail } },
      { key: 'support_phone',          value: { value: supportPhone } },
      { key: 'booking_timeout_hours',  value: { value: Number(bookingTimeout) } },
    ];
    // fire each one
    Promise.all(saves.map(s => api.put('/admin/config', s)))
      .then(() => { toast.success('General settings saved'); qc.invalidateQueries(['admin-config']); })
      .catch(() => toast.error('Some settings failed to save'));
  };

  const currentRate = finance
    ? (config?.commission_percent?.value ?? 10)
    : 10;

  return (
    <div className="w-full max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure global platform parameters and defaults</p>
      </div>

      {/* Admin profile summary */}
      <div className="bg-gradient-to-r from-[#142B0A] to-[#1e3b0e] rounded-xl p-5 text-white flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[#D6AD45] flex items-center justify-center text-[#142B0A] text-lg font-bold flex-shrink-0">
          {user?.adminProfile?.fullName?.[0] ?? 'A'}
        </div>
        <div>
          <p className="font-semibold text-white">{user?.adminProfile?.fullName || 'Admin'}</p>
          <p className="text-white/60 text-sm">{user?.email}</p>
          <span className="inline-block mt-1 bg-[#D6AD45]/20 text-[#D6AD45] text-xs font-semibold px-2 py-0.5 rounded-full">Platform Administrator</span>
        </div>
      </div>

      {/* Commission */}
      <SettingSection
        icon={CurrencyRupeeIcon}
        title="Commission Rate"
        description="Percentage deducted from each booking as platform revenue"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Current Rate</p>
            <p className="text-3xl font-bold text-[#142B0A]">{currentRate}%</p>
          </div>
          <div className="flex-1 max-w-xs">
            <label className="block text-xs text-gray-600 font-medium mb-1.5">New Rate (%)</label>
            <div className="flex gap-2">
              <input
                type="number" min={0} max={50} step={0.5}
                value={commission}
                onChange={e => setCommission(e.target.value)}
                placeholder={`e.g. ${currentRate}`}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#142B0A]/30"
              />
              <button
                onClick={() => commissionMut.mutate()}
                disabled={!commission || commissionMut.isPending}
                className="bg-[#142B0A] hover:bg-[#1e3b0e] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {commissionMut.isPending ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : 'Update'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Applies to all future bookings. Current bookings are not affected.</p>
          </div>
        </div>
      </SettingSection>

      {/* General settings */}
      <SettingSection
        icon={BuildingLibraryIcon}
        title="General Settings"
        description="Platform name, contact details and booking defaults"
      >
        {configLoading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
            <ArrowPathIcon className="h-4 w-4 animate-spin" /> Loading config…
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 font-medium mb-1.5">Platform Name</label>
                <input
                  type="text" value={platformName} onChange={e => setPlatformName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#142B0A]/30"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 font-medium mb-1.5">Booking Timeout (hours)</label>
                <input
                  type="number" min={1} max={72} value={bookingTimeout} onChange={e => setBookingTimeout(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#142B0A]/30"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 font-medium mb-1.5">Support Email</label>
                <input
                  type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)}
                  placeholder="support@mandapbooking.in"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#142B0A]/30"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 font-medium mb-1.5">Support Phone</label>
                <input
                  type="tel" value={supportPhone} onChange={e => setSupportPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#142B0A]/30"
                />
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={saveGeneral}
                className="inline-flex items-center gap-2 bg-[#142B0A] hover:bg-[#1e3b0e] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                <CheckCircleIcon className="h-4 w-4" />
                Save General Settings
              </button>
            </div>
          </div>
        )}
      </SettingSection>

      {/* Security / access */}
      <SettingSection
        icon={ShieldCheckIcon}
        title="Access & Security"
        description="Role-based access control and authentication settings"
      >
        <div className="space-y-3">
          {[
            { label: 'Role-based Access Control (RBAC)',   desc: 'Admin / Owner / Customer roles enforced server-side', enabled: true },
            { label: 'Admin Route Protection',              desc: 'All /admin/* routes require ADMIN role JWT', enabled: true },
            { label: 'Owner Route Protection',              desc: 'All /owner/* routes require OWNER role JWT', enabled: true },
            { label: 'JWT Token Auth',                      desc: 'Bearer tokens with 7-day expiry', enabled: true },
            { label: 'Password Hashing (bcrypt)',           desc: 'All passwords hashed with bcrypt, cost factor 12', enabled: true },
          ].map(({ label, desc, enabled }) => (
            <div key={label} className="flex items-center justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <CheckCircleIcon className="h-3.5 w-3.5" />
                {enabled ? 'Active' : 'Disabled'}
              </span>
            </div>
          ))}
        </div>
      </SettingSection>

      {/* System info */}
      <SettingSection
        icon={CogIcon}
        title="System Information"
        description="Current platform stack and environment"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Frontend',  value: 'React 18 + Vite' },
            { label: 'Backend',   value: 'Express.js + Prisma' },
            { label: 'Database',  value: 'PostgreSQL' },
            { label: 'Auth',      value: 'JWT + bcrypt' },
            { label: 'ORM',       value: 'Prisma v5' },
            { label: 'UI',        value: 'Tailwind CSS v3' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg px-3 py-2.5">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </SettingSection>
    </div>
  );
}
