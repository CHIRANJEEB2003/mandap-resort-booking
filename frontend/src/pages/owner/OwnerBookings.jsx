import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import BookingStatusBadge from '../../components/ui/BookingStatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { fmtDate } from '../../utils/date';

const TABS = [
  { label: 'New Requests', value: 'ENQUIRY' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Pending Payment', value: 'PENDING_PAYMENT' },
  { label: 'All', value: '' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function OwnerBookings() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(searchParams.get('status') || 'ENQUIRY');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['owner-bookings', status, page],
    queryFn: () => api.get('/owner/bookings', { params: { status: status || undefined, page, limit: 15 } }).then(r => r.data),
  });

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div>
        <h1 className="section-title">Booking Requests</h1>
        <p className="section-subtitle">Review and manage venue bookings</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.value} onClick={() => { setStatus(t.value); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              status === t.value ? 'bg-forest-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner /> : !data?.bookings?.length ? (
        <EmptyState icon="📋" title="No bookings" description="No bookings in this status category." />
      ) : (
        <div className="space-y-3">
          {data.bookings.map(b => (
            <Link key={b.id} to={`/owner/bookings/${b.id}`}
              className="card p-5 flex flex-col md:flex-row md:items-center gap-4 hover:shadow-card-hover transition-all block">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{b.customer?.fullName}</p>
                    <p className="text-xs text-gray-500">{b.customer?.user?.phone}</p>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>📅 {fmtDate(b.eventDate)}</span>
                  <span>🏛️ {b.property?.name}</span>
                  <span>👥 {b.guestCount} guests</span>
                  <span>💰 ₹{Number(b.totalAmount).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
