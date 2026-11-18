import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuthStore } from '../../context/authStore';
import {
  HomeIcon, UsersIcon, BuildingOffice2Icon, CalendarDaysIcon,
  CurrencyRupeeIcon, ChartBarIcon, ClipboardDocumentListIcon,
  MapPinIcon, ShieldCheckIcon, ArrowRightOnRectangleIcon,
  UserPlusIcon, BuildingStorefrontIcon, BuildingLibraryIcon, KeyIcon,
  ClipboardDocumentCheckIcon, ChevronDownIcon, ChatBubbleLeftRightIcon,
  CogIcon, SparklesIcon, PhotoIcon, PlusCircleIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'bg-gold-500/20 text-gold-300 font-semibold'
            : 'text-forest-100 hover:bg-white/8 hover:text-white'
        }`
      }>
      <Icon className="h-4 w-4 flex-shrink-0" />
      {label}
    </NavLink>
  );
}

function NavGroup({ label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-bold text-forest-300 uppercase tracking-widest hover:text-white transition-colors"
      >
        {label}
        <ChevronDownIcon className={`h-3 w-3 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="mt-1 space-y-0.5">{children}</div>}
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuthStore();

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 bg-[#142B0A] text-white flex-shrink-0 h-full">
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-white/10">
          <Link to="/admin" className="flex flex-col items-center gap-2">
            <img src="/logo.png" alt="Mandap & Resort Booking" className="w-32 h-auto object-contain brightness-0 invert" />
            <span className="text-[#D6AD45] text-xs font-bold tracking-wide">Admin Dashboard</span>
          </Link>
        </div>

        {/* Profile */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#D6AD45] flex items-center justify-center text-[#142B0A] text-sm font-bold flex-shrink-0">
              {user?.adminProfile?.fullName?.[0] ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white leading-tight truncate">{user?.adminProfile?.fullName || 'Admin'}</p>
              <p className="text-xs text-white/50 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto scrollbar-thin">

          {/* Overview */}
          <NavGroup label="Overview" defaultOpen>
            <NavItem to="/admin" label="Dashboard" icon={HomeIcon} end />
          </NavGroup>

          {/* Asset Management */}
          <NavGroup label="Asset Management" defaultOpen>
            <NavItem to="/admin/add-venue" label="Add Venue"      icon={PlusCircleIcon} />
            <NavItem to="/admin/assets"    label="All Assets"     icon={BuildingOffice2Icon} />
            <NavItem to="/admin/mandaps"   label="Mandap Assets"  icon={BuildingLibraryIcon} />
            <NavItem to="/admin/resorts"   label="Resort Assets"  icon={BuildingOffice2Icon} />
            <NavItem to="/admin/rooms"     label="Room Assets"    icon={KeyIcon} />
          </NavGroup>

          {/* Booking Management */}
          <NavGroup label="Booking Management" defaultOpen>
            <NavItem to="/admin/bookings"      label="All Bookings"    icon={CalendarDaysIcon} />
            <NavItem to="/admin/room-bookings" label="Room Bookings"   icon={ClipboardDocumentListIcon} />
          </NavGroup>

          {/* Owner Management */}
          <NavGroup label="Owner Management">
            <NavItem to="/admin/resort-owners"   label="Resort Owners"  icon={BuildingStorefrontIcon} />
            <NavItem to="/admin/mandap-owners"   label="Mandap Owners"  icon={BuildingLibraryIcon} />
            <NavItem to="/admin/register-owner"  label="Owner Registration"  icon={UserPlusIcon} />
          </NavGroup>

          {/* Verification */}
          <NavGroup label="Verification">
            <NavItem to="/admin/owners/verify"      label="Owner Requests"    icon={ShieldCheckIcon} />
            <NavItem to="/admin/properties/verify"  label="Property Requests" icon={BuildingOffice2Icon} />
          </NavGroup>

          {/* Client Management */}
          <NavGroup label="Client Management">
            <NavItem to="/admin/users"      label="All Clients"     icon={UsersIcon} />
          </NavGroup>

          {/* Wedding Packages */}
          <NavGroup label="Wedding & Events">
            <NavItem to="/admin/wedding-packages" label="Wedding Packages" icon={SparklesIcon} />
          </NavGroup>

          {/* Menu & Assets */}
          <NavGroup label="Menu & Content">
            <NavItem to="/admin/menus"      label="Menu Customization" icon={SparklesIcon} />
            <NavItem to="/admin/locations"  label="Locations"          icon={MapPinIcon} />
          </NavGroup>

          {/* Reviews */}
          <NavGroup label="Reviews & Feedback">
            <NavItem to="/admin/reviews"    label="All Reviews"     icon={ChatBubbleLeftRightIcon} />
          </NavGroup>

          {/* Payments & Reports */}
          <NavGroup label="Payments & Reports">
            <NavItem to="/admin/finance"    label="Payment Management" icon={CurrencyRupeeIcon} />
            <NavItem to="/admin/reports"    label="Reports & Analytics" icon={ChartBarIcon} />
            <NavItem to="/admin/audit-logs" label="Audit Logs"          icon={ClipboardDocumentListIcon} />
          </NavGroup>

          {/* Settings */}
          <NavGroup label="Settings">
            <NavItem to="/admin/settings"   label="Platform Settings"  icon={CogIcon} />
          </NavGroup>

        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-white/10">
          <button onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-red-900/40 hover:text-red-300 transition-all">
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden bg-[#142B0A] text-white px-4 h-14 flex items-center justify-between flex-shrink-0">
          <span className="font-display font-bold text-sm">Admin Panel</span>
          <button onClick={logout} className="text-xs text-white/60">Sign out</button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
          {/* ── Watermark ── fixed to viewport, centered in content area */}
          <div
            className="fixed inset-0 md:left-64 flex items-center justify-center pointer-events-none select-none"
            style={{ zIndex: 1 }}
            aria-hidden="true"
          >
            <div className="flex flex-col items-center gap-3 px-8" style={{ opacity: 0.09 }}>
              <img
                src="/logo.png"
                alt=""
                className="w-28 sm:w-36 md:w-44 lg:w-52 h-auto object-contain"
                style={{ filter: 'grayscale(1)' }}
              />
              <p className="text-[#1E3B0E] text-center font-display font-black tracking-widest text-lg sm:text-2xl md:text-3xl lg:text-4xl leading-tight">
                Mandap &amp; Resort<br />Booking
              </p>
            </div>
          </div>
          {/* Content renders above watermark */}
          <div className="relative" style={{ zIndex: 2 }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
