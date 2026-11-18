import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuthStore } from '../../context/authStore';
import {
  HomeIcon, BuildingOffice2Icon, CalendarDaysIcon, CurrencyRupeeIcon,
  UsersIcon, WrenchScrewdriverIcon, UserIcon,
  BuildingLibraryIcon, ArrowRightOnRectangleIcon, GiftIcon, KeyIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/owner', label: 'Dashboard', icon: HomeIcon, end: true },
  { to: '/owner/properties', label: 'Properties', icon: BuildingOffice2Icon },
  { to: '/owner/bookings', label: 'Bookings', icon: CalendarDaysIcon },
  { to: '/owner/rooms', label: 'Room Booking', icon: KeyIcon },
  { to: '/owner/calendar', label: 'Event Calendar', icon: CalendarDaysIcon },
  { to: '/owner/packages', label: 'Packages', icon: GiftIcon },
  { to: '/owner/wedding', label: 'Wedding Packages', icon: SparklesIcon },
  { to: '/owner/revenue', label: 'Revenue', icon: CurrencyRupeeIcon },
  { to: '/owner/resources', label: 'Resources', icon: WrenchScrewdriverIcon },
  { to: '/owner/staff', label: 'Staff', icon: UsersIcon },
  { to: '/owner/profile', label: 'Profile', icon: UserIcon },
];

export default function OwnerLayout() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex bg-cream-100">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <Link to="/" className="flex flex-col gap-1">
            <img src="/logo.png" alt="Mandap & Resort Booking" className="h-8 w-auto object-contain" />
            <span className="text-xs font-medium text-gold-600">Owner Portal</span>
          </Link>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold-500 flex items-center justify-center text-white text-sm font-semibold">
              {user?.ownerProfile?.fullName?.[0] ?? 'O'}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.ownerProfile?.businessName || 'Business'}</p>
              <p className="text-xs text-gray-500">{user?.phone}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-forest-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-forest-700'
                }`
              }>
              <Icon className="h-5 w-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all">
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
          <span className="font-display font-bold text-forest-700">Owner Portal</span>
          <button onClick={logout} className="text-sm text-gray-500">Sign out</button>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
