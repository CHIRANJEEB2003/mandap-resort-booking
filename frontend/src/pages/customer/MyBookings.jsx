import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import BookingStatusBadge from '../../components/ui/BookingStatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { fmtDate } from '../../utils/date';
import { TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const TABS = [
  { label: 'All', value: '' },
  { label: 'Enquiry', value: 'ENQUIRY' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Pending Payment', value: 'PENDING_PAYMENT' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const REMOVABLE = ['COMPLETED', 'CANCELLED'];

export default function MyBookings() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings', status, page],
    queryFn: () => api.get('/bookings/my/bookings', { params: { status: status || undefined, page, limit: 10 } }).then(r => r.data),
  });

  const hideMutation = useMutation({
    mutationFn: (bookingId) => api.post(`/bookings/${bookingId}/hide`),
    onSuccess: () => {
      toast.success('Removed from history');
      qc.invalidateQueries(['my-bookings']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not remove'),
  });

  const bookings = data?.bookings || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div>
        <h1 className="section-title">My Bookings</h1>
        <p className="section-subtitle">Track all your venue booking requests</p>
      </div>

      {/* Status tabs */}
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

      {isLoading ? <LoadingSpinner /> : bookings.length === 0 ? (
        <EmptyState icon="📅" title="No bookings found"
          action={<Link to="/search" className="btn-primary text-sm">Browse Venues</Link>} />
      ) : (
        <>
          <div className="space-y-3">
            {bookings.map(b => (
              <div key={b.id} className="card p-5 flex flex-col md:flex-row md:items-center gap-4 hover:shadow-card-hover transition-all">
                <Link to={`/customer/bookings/${b.id}`} className="flex flex-col md:flex-row md:items-center gap-4 flex-1 min-w-0">
                  {b.property?.media?.[0]?.url && (
                    <img src={b.property.media[0].url} alt={b.property.name}
                      className="w-full md:w-20 h-24 md:h-14 object-cover rounded-xl flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900">{b.property?.name}</p>
                      <BookingStatusBadge status={b.status} />
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {fmtDate(b.eventDate, 'd MMMM yyyy')} · {b.eventType} · {b.guestCount} guests
                    </p>
                    <p className="text-sm font-semibold text-forest-700 mt-1">
                      ₹{Number(b.totalAmount).toLocaleString('en-IN')}
                    </p>
                    {/* Refund info on cancelled bookings */}
                    {b.status === 'CANCELLED' && b.refundAmount != null && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Refund: ₹{Number(b.refundAmount).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                </Link>

                {/* Remove from history */}
                {REMOVABLE.includes(b.status) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Remove this booking from your history? The booking record will still be accessible by the venue and admin.')) {
                        hideMutation.mutate(b.id);
                      }
                    }}
                    disabled={hideMutation.isPending}
                    title="Remove from history"
                    className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-40 hover:border-gray-300 transition-colors">
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-40 hover:border-gray-300 transition-colors">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
