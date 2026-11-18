import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../context/authStore';
import {
  HomeIcon, CalendarDaysIcon, UserIcon, BellIcon,
  BuildingLibraryIcon, ArrowRightOnRectangleIcon, BuildingOffice2Icon,
  MagnifyingGlassIcon, KeyIcon, SparklesIcon, CurrencyRupeeIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

// NavLink for routes inside /customer layout
function InternalNavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'bg-forest-600 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-50 hover:text-forest-700'
        }`
      }>
      <Icon className="h-4 w-4 flex-shrink-0" />
      {label}
    </NavLink>
  );
}

// Plain Link for routes outside /customer layout (no active state needed)
function ExternalNavItem({ to, label, icon: Icon }) {
  return (
    <Link to={to}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-forest-700 transition-all">
      <Icon className="h-4 w-4 flex-shrink-0" />
      {label}
    </Link>
  );
}

function NavSection({ label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
      >
        {label}
        <ChevronDownIcon className={`h-3 w-3 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="mt-1 space-y-0.5">{children}</div>}
    </div>
  );
}

export default function CustomerLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-cream-100">
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 shadow-sm flex-shrink-0">

        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2">
            <BuildingLibraryIcon className="h-6 w-6 text-forest-600" />
            <div>
              <span className="font-display font-bold text-forest-700 text-base block leading-tight">Mandap</span>
              <span className="text-gold-600 text-xs block -mt-0.5">& Resort Booking</span>
            </div>
          </Link>
        </div>

        {/* Profile */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-forest-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {user?.customerProfile?.fullName?.[0] ?? 'C'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{user?.customerProfile?.fullName || 'Customer'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || user?.phone}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">

          {/* Overview */}
          <NavSection label="Overview" defaultOpen>
            <InternalNavItem to="/customer" label="Dashboard"  icon={HomeIcon} end />
            <InternalNavItem to="/customer/notifications" label="Notifications" icon={BellIcon} />
          </NavSection>

          {/* Browse */}
          <NavSection label="Browse Venues" defaultOpen>
            <ExternalNavItem to="/"                                label="Home"             icon={HomeIcon} />
            <ExternalNavItem to="/search"                          label="Search Venues"    icon={MagnifyingGlassIcon} />
            <ExternalNavItem to="/search?propertyType=MANDAP"      label="Browse Mandaps"   icon={BuildingLibraryIcon} />
            <ExternalNavItem to="/search?propertyType=RESORT"      label="Browse Resorts"   icon={BuildingOffice2Icon} />
            <ExternalNavItem to="/room-booking"                    label="Room Booking"     icon={KeyIcon} />
          </NavSection>

          {/* My Bookings */}
          <NavSection label="My Bookings" defaultOpen>
            <InternalNavItem to="/customer/bookings"      label="My Mandap Bookings"  icon={CalendarDaysIcon} />
            <InternalNavItem to="/customer/room-bookings" label="My Room Bookings"    icon={BuildingOffice2Icon} />
          </NavSection>

          {/* Menu & Payments */}
          <NavSection label="Menu & Payments" defaultOpen>
            <InternalNavItem to="/customer/menu"     label="Customize Food Menu" icon={SparklesIcon} />
          </NavSection>

          {/* Account */}
          <NavSection label="Account">
            <InternalNavItem to="/customer/profile"  label="My Profile"  icon={UserIcon} />
          </NavSection>

        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-gray-100">
          <button onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all">
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-display font-bold text-forest-700 text-sm">Mandap & Resort</Link>
          <div className="flex items-center gap-3">
            <Link to="/customer/notifications"><BellIcon className="h-5 w-5 text-gray-500" /></Link>
            <button onClick={logout} className="text-xs text-gray-500">Sign out</button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
