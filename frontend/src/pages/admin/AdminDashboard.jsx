import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  BuildingOffice2Icon, BuildingLibraryIcon, KeyIcon,
  CalendarDaysIcon, ClockIcon, CheckCircleIcon,
  UsersIcon, CurrencyRupeeIcon, ChartBarIcon,
  ArrowRightOnRectangleIcon, XMarkIcon, ShieldCheckIcon,
  ChatBubbleLeftRightIcon, CogIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../services/api';
import { useAuthStore } from '../../context/authStore';

/* ─── Stat card ─── */
function StatCard({ label, value, icon: Icon, color, link, sub }) {
  const palette = {
    forest: 'bg-[#1E3B0E]/8 text-[#1E3B0E] border-[#1E3B0E]/12',
    green:  'bg-emerald-50 text-emerald-700 border-emerald-100',
    gold:   'bg-[#D6AD45]/10 text-[#9a7a1e] border-[#D6AD45]/25',
    blue:   'bg-sky-50 text-sky-700 border-sky-100',
    red:    'bg-rose-50 text-rose-600 border-rose-100',
  };
  const cls = palette[color] || palette.forest;

  const inner = (
    <div className={`group relative rounded-2xl border p-4 flex items-center gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${cls}`}>
      {/* subtle shimmer on hover */}
      <div className="absolute inset-0 rounded-2xl bg-white/0 group-hover:bg-white/20 transition-colors pointer-events-none" />
      <div className="p-2.5 rounded-xl bg-white/70 flex-shrink-0 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 truncate">{label}</p>
        <p className="text-2xl font-display font-black leading-tight mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-[11px] opacity-50 mt-0.5">{sub}</p>}
      </div>
    </div>
  );

  return link ? <Link to={link} className="block">{inner}</Link> : inner;
}

/* ─── Quick action card ─── */
function QuickLink({ to, icon, label, desc, accent }) {
  return (
    <Link to={to}
      className="group flex items-start gap-3.5 p-4 bg-white rounded-2xl border border-gray-100 hover:border-[#1E3B0E]/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="font-semibold text-sm text-gray-900 group-hover:text-[#1E3B0E] transition-colors">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{desc}</p>
      </div>
    </Link>
  );
}

/* ─── Section label ─── */
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{children}</p>
      <div className="flex-1 h-px bg-gradient-to-r from-[#D6AD45]/40 to-transparent" />
    </div>
  );
}

/* ─── Main ─── */
export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data),
  });
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignOut = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  if (isLoading) return <LoadingSpinner text="Loading dashboard…" />;

  return (
    <div className="w-full space-y-6">

      {/* ── Sign-out confirmation ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-display font-bold text-gray-900">Sign Out</h3>
              <button onClick={() => setShowConfirm(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to sign out of the admin panel?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSignOut}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#142B0A] text-sm font-medium text-white hover:bg-[#1E3B0E] transition-colors flex items-center justify-center gap-2">
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-[#142B0A] text-white">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none select-none" aria-hidden>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="mandap-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="1.5" fill="#D6AD45"/>
                <circle cx="0"  cy="0"  r="1" fill="#D6AD45"/>
                <circle cx="60" cy="0"  r="1" fill="#D6AD45"/>
                <circle cx="0"  cy="60" r="1" fill="#D6AD45"/>
                <circle cx="60" cy="60" r="1" fill="#D6AD45"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mandap-grid)"/>
          </svg>
        </div>
        {/* Gold top-line accent */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#D6AD45] to-transparent" />

        <div className="relative px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          {/* Left: title */}
          <div className="flex items-center gap-4 min-w-0">
            {/* Avatar */}
            <div className="w-11 h-11 rounded-xl bg-[#D6AD45] flex items-center justify-center text-[#142B0A] font-black text-lg flex-shrink-0 shadow-lg">
              {user?.adminProfile?.fullName?.[0] ?? 'A'}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-display font-black leading-tight truncate">
                Welcome back, {user?.adminProfile?.fullName?.split(' ')[0] || 'Admin'}
              </h1>
              <p className="text-white/50 text-xs mt-0.5">Admin Dashboard &nbsp;·&nbsp; Mandap &amp; Resort Booking</p>
            </div>
          </div>

          {/* Right: sign-out */}
          <button onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 text-white text-sm font-semibold transition-all duration-200 flex-shrink-0">
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

        {/* Gold bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D6AD45]/60 to-transparent" />
      </div>

      {/* ── 6 key metrics — full row ── */}
      <section>
        <SectionLabel>Summary</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Mandaps"  value={stats?.totalMandaps}      icon={BuildingLibraryIcon} color="forest" link="/admin/mandaps" />
          <StatCard label="Total Resorts"  value={stats?.totalResorts}      icon={BuildingOffice2Icon} color="forest" link="/admin/resorts" />
          <StatCard label="Total Rooms"    value={stats?.totalRooms}        icon={KeyIcon}             color="blue"   link="/admin/rooms" />
          <StatCard label="All Bookings"   value={stats?.totalBookings}     icon={CalendarDaysIcon}    color="forest" link="/admin/bookings" />
          <StatCard label="Pending"        value={stats?.pendingBookings}   icon={ClockIcon}           color="gold"   link="/admin/bookings" sub="Awaiting action" />
          <StatCard label="Confirmed"      value={stats?.confirmedBookings} icon={CheckCircleIcon}     color="green"  link="/admin/bookings" />
        </div>
      </section>

      {/* ── Platform overview ── */}
      <section>
        <SectionLabel>Platform Overview</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Clients" value={stats?.totalCustomers} icon={UsersIcon}         color="blue" />
          <StatCard label="Total Owners"  value={stats?.totalOwners}    icon={UsersIcon}         color="forest" />
          <StatCard
            label="Booking Value"
            value={stats?.totalBookingValue ? `₹${Number(stats.totalBookingValue).toLocaleString('en-IN')}` : '₹0'}
            icon={CurrencyRupeeIcon} color="gold"
          />
          <StatCard
            label="Platform Revenue"
            value={stats?.platformRevenue ? `₹${Number(stats.platformRevenue).toLocaleString('en-IN')}` : '₹0'}
            icon={ChartBarIcon} color="forest"
          />
        </div>
      </section>

      {/* ── Quick actions — 4 columns ── */}
      <section>
        <SectionLabel>Quick Actions</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickLink to="/admin/assets"             icon="🏢" label="All Assets"        desc="Mandaps, Resorts & Rooms" />
          <QuickLink to="/admin/bookings"           icon="📅" label="All Bookings"      desc={`${stats?.totalBookings ?? 0} total bookings`} />
          <QuickLink to="/admin/owners/verify"      icon="✅" label="Owner Requests"   desc={`${stats?.pendingOwners ?? 0} pending`} />
          <QuickLink to="/admin/properties/verify"  icon="🔍" label="Property Requests" desc="Approve listings" />
          <QuickLink to="/admin/resort-owners"      icon="🏨" label="Resort Owners"    desc={`${stats?.totalOwners ?? 0} registered`} />
          <QuickLink to="/admin/mandap-owners"      icon="🏛️" label="Mandap Owners"    desc="Manage mandap owners" />
          <QuickLink to="/admin/reviews"            icon="💬" label="Reviews"           desc={`${stats?.totalReviews ?? 0} reviews`} />
          <QuickLink to="/admin/settings"           icon="⚙️" label="Settings"          desc="Commission & configuration" />
        </div>
      </section>

    </div>
  );
}
