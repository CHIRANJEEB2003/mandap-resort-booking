import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../../services/api';
import BookingStatusBadge from '../../components/ui/BookingStatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { fmtDate } from '../../utils/date';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline, SparklesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function fmt(n) { return Number(n || 0).toLocaleString('en-IN'); }

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => api.get(`/bookings/${id}`).then(r => r.data),
  });

  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [hoverRating, setHoverRating] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const cancelMutation = useMutation({
    mutationFn: (reason) => api.post(`/bookings/${id}/cancel`, { reason }),
    onSuccess: () => {
      toast.success('Booking cancelled successfully');
      setShowCancelConfirm(false);
      qc.invalidateQueries(['booking', id]);
      qc.invalidateQueries(['my-bookings']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error cancelling'),
  });

  const reviewMutation = useMutation({
    mutationFn: (data) => api.post(`/bookings/${id}/review`, data),
    onSuccess: () => { toast.success('Review submitted! Thank you.'); qc.invalidateQueries(['booking', id]); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error submitting review'),
  });

  if (isLoading) return <LoadingSpinner text="Loading booking…" />;
  if (!booking) return <div className="text-gray-500 text-sm p-8">Booking not found</div>;

  const canCancel = ['ENQUIRY', 'PENDING_PAYMENT', 'CONFIRMED'].includes(booking.status);
  const canPay = booking.status === 'PENDING_PAYMENT';
  const canReview = booking.status === 'COMPLETED' && !booking.review;

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
        <div>
          <h1 className="text-xl font-display font-bold text-gray-900">Booking #{id.slice(-8).toUpperCase()}</h1>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg text-gray-900">{booking.property?.name}</h2>
          <BookingStatusBadge status={booking.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Event Date', value: fmtDate(booking.eventDate, 'd MMMM yyyy') },
            { label: 'Event Type', value: booking.eventType },
            { label: 'Guests', value: `${booking.guestCount} guests` },
            { label: 'Hall', value: booking.hall?.name || 'Not specified' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
              <p className="font-medium text-gray-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Price breakdown */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Price Breakdown</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600"><span>Base amount</span><span>₹{Number(booking.baseAmount).toLocaleString('en-IN')}</span></div>
          {Number(booking.servicesAmount) > 0 && (
            <div className="flex justify-between text-gray-600"><span>Services</span><span>₹{Number(booking.servicesAmount).toLocaleString('en-IN')}</span></div>
          )}
          <div className="flex justify-between text-gray-600"><span>GST (18%)</span><span>₹{Number(booking.taxAmount).toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2">
            <span>Total</span><span>₹{Number(booking.totalAmount).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-gold-600 font-semibold">
            <span>Advance Due</span><span>₹{Number(booking.advanceAmount).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Customize Food Menu */}
      <div className="card p-4 border border-[#D6AD45]/30 bg-[#D6AD45]/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
              <SparklesIcon className="h-4 w-4 text-[#D6AD45]" />
              Food Menu Customization
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Select your preferred food menu, packages and items for this booking</p>
          </div>
          <Link
            to={`/customer/menu?bookingId=${id}`}
            className="flex-shrink-0 bg-[#1E3B0E] hover:bg-[#142B0A] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all whitespace-nowrap"
          >
            Customize Food Menu
          </Link>
        </div>
      </div>

      {/* Cancellation details (if cancelled) */}
      {booking.status === 'CANCELLED' && booking.refundAmount != null && (
        <div className="card p-5 border border-red-100 bg-red-50/40">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
            Cancellation Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Cancelled on</span>
              <span>{fmtDate(booking.cancelledAt, 'd MMM yyyy')}</span>
            </div>
            {booking.cancelReason && (
              <div className="flex justify-between text-gray-600">
                <span>Reason</span>
                <span className="text-right max-w-[55%]">{booking.cancelReason}</span>
              </div>
            )}
            <div className="border-t border-red-100 pt-2 mt-2 space-y-1.5">
              <div className="flex justify-between text-gray-600">
                <span>Advance paid (30%)</span>
                <span>₹{fmt(booking.advanceAmount)}</span>
              </div>
              <div className="flex justify-between text-green-700 font-medium">
                <span>Your refund (10% of total)</span>
                <span>₹{fmt(booking.refundAmount)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Retained by venue (20% of total)</span>
                <span>₹{fmt(booking.ownerRetentionAmount)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 pt-1">Refund will be credited to your original payment method within 5–7 business days.</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {canPay && (
          <button onClick={() => navigate(`/payment/${id}`)} className="btn-gold flex-1">Pay Advance ₹{fmt(booking.advanceAmount)}</button>
        )}
        {canCancel && !showCancelConfirm && (
          <button onClick={() => setShowCancelConfirm(true)}
            className="btn-outline flex-1 border-red-300 text-red-600 hover:bg-red-50">
            Cancel Booking
          </button>
        )}
      </div>

      {/* Cancel confirmation with refund preview */}
      {canCancel && showCancelConfirm && (
        <div className="card p-5 border border-red-200 bg-red-50/30">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
            Confirm Cancellation
          </h3>
          <p className="text-sm text-gray-600 mb-3">Are you sure you want to cancel this booking? This cannot be undone.</p>
          <div className="bg-white rounded-xl p-3 border border-red-100 text-sm space-y-1.5 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cancellation Breakdown</p>
            <div className="flex justify-between text-gray-600">
              <span>Total booking amount</span><span>₹{fmt(booking.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-green-700 font-medium">
              <span>You will receive (10%)</span><span>₹{fmt(Number(booking.totalAmount) * 0.10)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Venue retains (20%)</span><span>₹{fmt(Number(booking.totalAmount) * 0.20)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCancelConfirm(false)}
              className="btn-outline flex-1">Keep Booking</button>
            <button
              onClick={() => cancelMutation.mutate('Customer requested cancellation')}
              disabled={cancelMutation.isPending}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60">
              {cancelMutation.isPending ? 'Cancelling…' : 'Yes, Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* Existing review */}
      {booking.review && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Your Review</h3>
          <div className="flex gap-0.5 mb-2">
            {Array.from({ length: 5 }, (_, i) => (
              <StarSolid key={i} className={`h-5 w-5 ${i < booking.review.rating ? 'text-gold-400' : 'text-gray-200'}`} />
            ))}
          </div>
          {booking.review.comment && <p className="text-sm text-gray-600">{booking.review.comment}</p>}
        </div>
      )}

      {/* Submit review */}
      {canReview && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Leave a Review</h3>
          <div className="flex gap-1 mb-4">
            {Array.from({ length: 5 }, (_, i) => (
              <button key={i} type="button"
                onClick={() => setReviewForm(f => ({ ...f, rating: i + 1 }))}
                onMouseEnter={() => setHoverRating(i + 1)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110">
                {(hoverRating || reviewForm.rating) > i
                  ? <StarSolid className="h-7 w-7 text-gold-400" />
                  : <StarOutline className="h-7 w-7 text-gray-300" />}
              </button>
            ))}
            {reviewForm.rating > 0 && (
              <span className="ml-2 text-sm text-gray-500 self-center">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewForm.rating]}
              </span>
            )}
          </div>
          <textarea
            value={reviewForm.comment}
            onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
            rows={3} placeholder="Share your experience… (optional)"
            className="input resize-none mb-4"
          />
          <button
            onClick={() => reviewMutation.mutate(reviewForm)}
            disabled={reviewForm.rating === 0 || reviewMutation.isPending}
            className="btn-primary w-full">
            {reviewMutation.isPending ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      )}
    </div>
  );
}
