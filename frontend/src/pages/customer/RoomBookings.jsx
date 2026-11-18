import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { MoonIcon, UserGroupIcon, CalendarDaysIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';

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
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function RoomBookings() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-room-bookings'],
    queryFn: () => api.get('/rooms/bookings/my').then((r) => r.data),
  });

  const bookings = data?.bookings || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-forest-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isError) {
    return <div className="text-center py-16 text-red-500">Failed to load room bookings.</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">My Room Bookings</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-20 card">
          <BuildingOffice2Icon className="h-14 w-14 text-gray-300 mx-auto mb-4" />
          <h2 className="font-display font-semibold text-xl text-gray-700 mb-2">No room bookings yet</h2>
          <p className="text-gray-500 mb-6">Browse our premium resorts and book your first stay.</p>
          <Link to="/room-booking" className="btn-primary">
            Browse Resorts
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const coverUrl = booking.room?.media?.[0]?.url;
            return (
              <div key={booking.id} className="card overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Thumbnail */}
                  <div className="sm:w-32 h-32 sm:h-auto flex-shrink-0 bg-gray-100">
                    {coverUrl ? (
                      <img src={coverUrl} alt={booking.room.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-forest-50">
                        <BuildingOffice2Icon className="h-8 w-8 text-forest-200" />
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display font-semibold text-gray-900">{booking.room?.name}</h3>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_BADGE[booking.room?.category]}`}>
                            {booking.room?.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{booking.room?.property?.name}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${STATUS_BADGE[booking.status]}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1.5">
                        <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                        {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                        <span className="text-gray-400">({booking.nights} night{booking.nights !== 1 ? 's' : ''})</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MoonIcon className="h-4 w-4 text-gray-400" />
                        {booking.roomCount} room{booking.roomCount !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <UserGroupIcon className="h-4 w-4 text-gray-400" />
                        {booking.guestCount} guest{booking.guestCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="text-sm">
                        <span className="text-gray-500">Total </span>
                        <span className="font-semibold text-gray-900">₹{fmt(booking.totalAmount)}</span>
                        <span className="text-gray-400 ml-2">· Advance ₹{fmt(booking.advanceAmount)}</span>
                      </div>
                      <Link
                        to={`/customer/room-bookings/${booking.id}`}
                        className="btn-outline text-sm px-4 py-1.5"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
