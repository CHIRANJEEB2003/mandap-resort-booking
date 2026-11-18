import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarDaysIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import StatCard from '../../components/ui/StatCard';
import BookingStatusBadge from '../../components/ui/BookingStatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { useAuthStore } from '../../context/authStore';
import api from '../../services/api';
import { fmtDate } from '../../utils/date';

export default function CustomerDashboard() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => api.get('/bookings/my/bookings', { params: { limit: 5 } }).then(r => r.data),
  });

  const bookings = data?.bookings || [];
  const total = data?.total || 0;

  const countByStatus = (status) => bookings.filter(b => b.status === status).length;

  return (
    <div className="w-full max-w-5xl space-y-8">
      <div>
        <h1 className="section-title">Welcome, {user?.customerProfile?.fullName || 'Guest'} 👋</h1>
        <p className="section-subtitle">Manage your bookings and profile</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Bookings" value={total} icon={CalendarDaysIcon} color="forest" />
        <StatCard label="Pending" value={bookings.filter(b => b.status === 'ENQUIRY').length} icon={ClockIcon} color="gold" />
        <StatCard label="Confirmed" value={bookings.filter(b => b.status === 'CONFIRMED').length} icon={CheckCircleIcon} color="green" />
        <StatCard label="Cancelled" value={bookings.filter(b => b.status === 'CANCELLED').length} icon={XCircleIcon} color="red" />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-gray-900 text-lg">Recent Bookings</h2>
          <Link to="/customer/bookings" className="text-sm text-forest-600 font-medium hover:underline">View all</Link>
        </div>

        {isLoading ? <LoadingSpinner /> : bookings.length === 0 ? (
          <EmptyState icon="📅" title="No bookings yet" description="Start by browsing venues and booking your event."
            action={<Link to="/search" className="btn-primary text-sm">Browse Venues</Link>} />
        ) : (
          <div className="space-y-3">
            {bookings.map(b => (
              <Link key={b.id} to={`/customer/bookings/${b.id}`}
                className="flex items-center justify-between p-4 rounded-xl bg-cream-50 hover:bg-cream-100 transition-colors">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{b.property?.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {fmtDate(b.eventDate)} · {b.eventType} · {b.guestCount} guests
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <BookingStatusBadge status={b.status} />
                  <p className="text-xs text-gray-500">₹{Number(b.totalAmount).toLocaleString('en-IN')}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
