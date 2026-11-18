import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import BookingStatusBadge from '../../components/ui/BookingStatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { fmtDate } from '../../utils/date';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const STATUSES = ['', 'ENQUIRY', 'PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
const STATUS_LABELS = {
  '': 'All', ENQUIRY: 'Enquiry', PENDING_PAYMENT: 'Pending Payment',
  CONFIRMED: 'Confirmed', CANCELLED: 'Cancelled', COMPLETED: 'Completed',
};

export default function AdminBookings() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', status, search, page],
    queryFn: () => api.get('/admin/bookings', {
      params: { status: status || undefined, search: search || undefined, page, limit: 20 },
    }).then(r => r.data),
  });

  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <div className="w-full max-w-6xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="section-title">All Bookings</h1>
        <p className="section-subtitle">{data?.total ?? 0} total bookings across all venues</p>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 flex-wrap">
        {STATUSES.map(s => (
          <button key={s || 'all'} onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              status === s
                ? 'bg-forest-700 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search customer or property..." className="input pl-9" />
      </div>

      {isLoading ? <LoadingSpinner /> : !data?.bookings?.length ? (
        <EmptyState icon="📋" title="No bookings found" description="Adjust your filters to see bookings." />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Customer', 'Property', 'Event Date', 'Guests', 'Amount', 'Status', 'Booked On'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.bookings.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 leading-tight">{b.customer?.fullName || 'â€”'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{b.customer?.user?.phone || b.customer?.user?.email || ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700 leading-tight">{b.property?.name || 'â€”'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{b.property?.propertyType?.replace('_', ' ')}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(b.eventDate)}</td>
                      <td className="px-4 py-3 text-gray-600">{b.guestCount}</td>
                      <td className="px-4 py-3 font-semibold text-forest-700 whitespace-nowrap">
                        ₹{Number(b.totalAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3"><BookingStatusBadge status={b.status} /></td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(b.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap text-xs text-gray-500">
              <span>
                {data.total > 0
                  ? `Showing ${((page - 1) * 20) + 1}â€“${Math.min(page * 20, data.total)} of ${data.total}`
                  : '0 results'}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 rounded-lg border border-gray-200 hover:border-forest-600 disabled:opacity-30 transition-all">
                    <ChevronLeftIcon className="h-3.5 w-3.5" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button key={pg} onClick={() => setPage(pg)}
                        className={`w-7 h-7 rounded-lg font-medium transition-all ${
                          pg === page ? 'bg-forest-700 text-white' : 'border border-gray-200 text-gray-600 hover:border-forest-600'
                        }`}>
                        {pg}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 hover:border-forest-600 disabled:opacity-30 transition-all">
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

