import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BuildingOffice2Icon, CalendarDaysIcon, CurrencyRupeeIcon, ClockIcon, CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import StatCard from '../../components/ui/StatCard';
import BookingStatusBadge from '../../components/ui/BookingStatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../context/authStore';
import api from '../../services/api';
import { fmtDate } from '../../utils/date';

export default function OwnerDashboard() {
  const { user } = useAuthStore();
  const isApproved = user?.ownerProfile?.verificationStatus === 'APPROVED';

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['owner-dashboard'],
    queryFn: () => api.get('/owner/dashboard').then(r => r.data),
    enabled: isApproved,
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['owner-bookings-recent'],
    queryFn: () => api.get('/owner/bookings', { params: { limit: 5 } }).then(r => r.data),
    enabled: isApproved,
  });

  if (!isApproved) {
    return (
      <div className="max-w-2xl">
        <h1 className="section-title">Owner Dashboard</h1>
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="font-display font-semibold text-xl text-gray-900 mb-2">Verification Pending</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            Your account is being reviewed by our team. Once approved, you can list your properties and start accepting bookings.
          </p>
          <Link to="/owner/profile" className="btn-outline">Complete Your Profile</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-8">
      <div>
        <h1 className="section-title">Dashboard</h1>
        <p className="section-subtitle">Welcome back, {user?.ownerProfile?.businessName}</p>
      </div>

      {statsLoading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Properties" value={stats?.totalProperties} icon={BuildingOffice2Icon} color="forest" />
          <StatCard label="Total Bookings" value={stats?.totalBookings} icon={CalendarDaysIcon} color="blue" />
          <StatCard label="Pending" value={stats?.pendingRequests} icon={ClockIcon} color="gold" />
          <StatCard label="Confirmed" value={stats?.confirmedBookings} icon={CheckCircleIcon} color="green" />
          <StatCard label="Today's Events" value={stats?.todayEvents} icon={SparklesIcon} color="forest" />
          <StatCard label="Month Revenue" value={stats?.monthRevenue ? `₹${Number(stats.monthRevenue).toLocaleString('en-IN')}` : '₹0'} icon={CurrencyRupeeIcon} color="gold" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent bookings */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-gray-900">Recent Bookings</h2>
            <Link to="/owner/bookings" className="text-sm text-forest-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {(bookingsData?.bookings || []).slice(0, 5).map(b => (
              <Link key={b.id} to={`/owner/bookings/${b.id}`}
                className="flex items-center justify-between p-3 rounded-xl bg-cream-50 hover:bg-cream-100 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{b.customer?.fullName}</p>
                  <p className="text-xs text-gray-500">{b.property?.name} · {fmtDate(b.eventDate)}</p>
                </div>
                <BookingStatusBadge status={b.status} />
              </Link>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card p-5">
          <h2 className="font-display font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { to: '/owner/properties/new', label: '+ Add New Property', cls: 'btn-primary' },
              { to: '/owner/bookings?status=ENQUIRY', label: 'Review Pending Requests', cls: 'btn-outline' },
              { to: '/owner/calendar', label: 'View Event Calendar', cls: 'btn-outline' },
              { to: '/owner/revenue', label: 'Revenue Report', cls: 'btn-outline' },
            ].map(a => (
              <Link key={a.to} to={a.to} className={`${a.cls} w-full text-center block text-sm py-2`}>{a.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
