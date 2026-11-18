import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  MapPinIcon,
  CalendarDaysIcon,
  MoonIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  XCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const STATUS_BADGE = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
  COMPLETED: 'bg-gray-100 text-gray-600',
};

const CATEGORY_BADGE = {
  STANDARD: 'bg-blue-100 text-blue-700',
  DELUXE: 'bg-gold-100 text-gold-700',
  LUXURY: 'bg-purple-100 text-purple-700',
};

function fmt(n) {
  return Number(n).toLocaleString('en-IN');
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function RoomBookingDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['room-booking', id],
    queryFn: () => api.get(`/rooms/bookings/${id}`).then((r) => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      api.post(`/rooms/bookings/${id}/cancel`, { reason: cancelReason || undefined }).then((r) => r.data),
    onSuccess: () => {
      toast.success('Booking cancelled');
      setShowCancelConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['room-booking', id] });
      queryClient.invalidateQueries({ queryKey: ['my-room-bookings'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Could not cancel booking');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-forest-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="text-center py-16 max-w-lg mx-auto">
        <p className="text-red-500 mb-4">Booking not found or you don't have access.</p>
        <Link to="/customer/room-bookings" className="btn-outline">Back to My Bookings</Link>
      </div>
    );
  }

  const { room } = booking;
  const photos = room?.media || [];
  const property = room?.property;
  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status);
  const baseAmount = Number(booking.totalAmount) - Number(booking.taxAmount);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      <Link to="/customer/room-bookings" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeftIcon className="h-4 w-4" />
        My Room Bookings
      </Link>

      {/* Photo gallery */}
      {photos.length > 0 && (
        <div className="rounded-2xl overflow-hidden mb-6">
          <div className="h-64 relative bg-gray-100">
            <img
              src={photos[photoIndex]?.url}
              alt={room.name}
              className="w-full h-full object-cover"
            />
            {photos.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === photoIndex ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card p-6 mb-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="font-display text-xl font-bold text-gray-900">{room.name}</h1>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_BADGE[room.category]}`}>
                {room.category}
              </span>
            </div>
            {property && (
              <p className="text-gray-600 font-medium">{property.name}</p>
            )}
            {property?.addressLine && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPinIcon className="h-4 w-4" />
                {property.addressLine}
              </p>
            )}
          </div>
          <span className={`text-sm font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${STATUS_BADGE[booking.status]}`}>
            {booking.status}
          </span>
        </div>

        <div className="text-xs text-gray-400 font-mono mb-5">
          Ref: {booking.id.slice(0, 8).toUpperCase()}
        </div>

        {/* Booking details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Check-in</span>
            <span className="font-medium text-gray-900 flex items-center gap-1.5">
              <CalendarDaysIcon className="h-4 w-4 text-forest-500" />
              {formatDate(booking.checkIn)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Check-out</span>
            <span className="font-medium text-gray-900 flex items-center gap-1.5">
              <CalendarDaysIcon className="h-4 w-4 text-forest-500" />
              {formatDate(booking.checkOut)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Duration</span>
            <span className="font-medium text-gray-900 flex items-center gap-1.5">
              <MoonIcon className="h-4 w-4 text-forest-500" />
              {booking.nights} night{booking.nights !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Rooms / Guests</span>
            <span className="font-medium text-gray-900 flex items-center gap-1.5">
              <UserGroupIcon className="h-4 w-4 text-forest-500" />
              {booking.roomCount} room{booking.roomCount !== 1 ? 's' : ''} · {booking.guestCount} guest{booking.guestCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Base amount</span>
            <span>₹{fmt(baseAmount)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>GST (18%)</span>
            <span>₹{fmt(booking.taxAmount)}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-100 pt-2">
            <span>Total amount</span>
            <span>₹{fmt(booking.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-forest-600 font-medium">
            <span>Advance payable (30%)</span>
            <span>₹{fmt(booking.advanceAmount)}</span>
          </div>
        </div>

        {booking.notes && (
          <div className="mt-4 bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Special Requests</p>
            <p className="text-sm text-gray-700">{booking.notes}</p>
          </div>
        )}

        {booking.status === 'CANCELLED' && booking.cancelReason && (
          <div className="mt-4 bg-red-50 rounded-xl p-3 flex items-start gap-2">
            <XCircleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-red-400 uppercase tracking-wide mb-0.5">Cancellation Reason</p>
              <p className="text-sm text-red-700">{booking.cancelReason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Customize Food Menu */}
      <div className="card p-4 border border-[#D6AD45]/30 bg-[#D6AD45]/5 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
              <SparklesIcon className="h-4 w-4 text-[#D6AD45]" />
              Food Menu Customization
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Select breakfast, lunch, dinner or party packages for your stay</p>
          </div>
          <Link
            to={`/customer/menu?roomBookingId=${id}`}
            className="flex-shrink-0 bg-[#1E3B0E] hover:bg-[#142B0A] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all whitespace-nowrap"
          >
            Customize Food Menu
          </Link>
        </div>
      </div>

      {/* Cancel */}
      {canCancel && !showCancelConfirm && (
        <button
          onClick={() => setShowCancelConfirm(true)}
          className="w-full btn-outline border-red-300 text-red-600 hover:bg-red-50"
        >
          Cancel Booking
        </button>
      )}

      {showCancelConfirm && (
        <div className="card p-5 border-red-200">
          <p className="font-medium text-gray-900 mb-3">Are you sure you want to cancel this booking?</p>
          <textarea
            className="input resize-none mb-3"
            rows={2}
            placeholder="Reason for cancellation (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <div className="flex gap-3">
            <button onClick={() => setShowCancelConfirm(false)} className="btn-outline flex-1">
              Keep Booking
            </button>
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
            >
              {cancelMutation.isPending ? 'Cancelling…' : 'Yes, Cancel'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
