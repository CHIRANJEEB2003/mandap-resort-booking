import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import BookingStatusBadge from '../../components/ui/BookingStatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { fmtDate } from '../../utils/date';

export default function OwnerBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => api.get(`/bookings/${id}`).then(r => r.data),
  });

  const confirmMutation = useMutation({
    mutationFn: () => api.post(`/bookings/${id}/confirm`),
    onSuccess: () => { toast.success('Booking confirmed'); qc.invalidateQueries(['booking', id]); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason) => api.post(`/bookings/${id}/reject`, { reason }),
    onSuccess: () => { toast.success('Booking rejected'); qc.invalidateQueries(['booking', id]); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!booking) return <div className="text-gray-500 p-8">Booking not found</div>;

  const canAct = booking.status === 'ENQUIRY';

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
        <div>
          <h1 className="text-xl font-display font-bold text-gray-900">Booking #{id.slice(-8).toUpperCase()}</h1>
        </div>
      </div>

      {/* Customer info */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Customer</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-forest-600 flex items-center justify-center text-white font-semibold">
            {booking.customer?.fullName?.[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{booking.customer?.fullName}</p>
            <p className="text-xs text-gray-500">📞 +91 {booking.customer?.user?.phone}</p>
          </div>
        </div>
      </div>

      {/* Booking info */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Event Details</h2>
          <BookingStatusBadge status={booking.status} />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Property', value: booking.property?.name },
            { label: 'Hall', value: booking.hall?.name || 'Not specified' },
            { label: 'Event Date', value: fmtDate(booking.eventDate, 'd MMMM yyyy') },
            { label: 'Event Type', value: booking.eventType },
            { label: 'Guest Count', value: `${booking.guestCount} guests` },
            { label: 'Total Amount', value: `₹${Number(booking.totalAmount).toLocaleString('en-IN')}` },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
              <p className="font-medium text-gray-800">{item.value}</p>
            </div>
          ))}
        </div>
        {booking.notes && (
          <div className="mt-4 p-3 bg-cream-100 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Customer notes</p>
            <p className="text-sm text-gray-700">{booking.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {canAct && (
        <div className="flex gap-3">
          <button onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending}
            className="btn-primary flex-1">
            {confirmMutation.isPending ? 'Confirming…' : '✓ Confirm Booking'}
          </button>
          <button
            onClick={() => { const r = prompt('Reason for rejection (optional):') ?? ''; rejectMutation.mutate(r); }}
            disabled={rejectMutation.isPending}
            className="btn-outline flex-1 border-red-300 text-red-600 hover:bg-red-50">
            {rejectMutation.isPending ? 'Rejecting…' : '✗ Reject'}
          </button>
        </div>
      )}
    </div>
  );
}
