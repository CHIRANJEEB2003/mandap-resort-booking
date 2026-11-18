import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import BookingStatusBadge from '../../components/ui/BookingStatusBadge';

export default function OwnerCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: bookings } = useQuery({
    queryKey: ['owner-calendar', year, month],
    queryFn: () => api.get('/owner/calendar', { params: { year, month } }).then(r => r.data),
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = monthStart.getDay();

  const bookingsOnDay = (day) => (bookings || []).filter(b => isSameDay(new Date(b.eventDate), day));
  const selectedBookings = selected ? bookingsOnDay(selected) : [];

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div>
        <h1 className="section-title">Event Calendar</h1>
        <p className="section-subtitle">View confirmed and upcoming events</p>
      </div>

      <div className="card p-5">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1))}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="font-display font-semibold text-lg text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1))}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* DOW headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDow }).map((_, i) => <div key={`empty-${i}`} />)}
          {days.map(day => {
            const events = bookingsOnDay(day);
            const isSelected = selected && isSameDay(day, selected);
            return (
              <button key={day.toISOString()} onClick={() => setSelected(day)}
                className={`relative p-2 rounded-xl text-sm transition-all min-h-[52px] flex flex-col items-center ${
                  isSelected ? 'bg-forest-600 text-white shadow-sm' :
                  isToday(day) ? 'bg-gold-50 text-gold-700 ring-2 ring-gold-300' :
                  events.length > 0 ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'
                }`}>
                <span className="font-medium">{format(day, 'd')}</span>
                {events.length > 0 && (
                  <span className={`mt-0.5 text-xs font-bold ${isSelected ? 'text-green-200' : 'text-green-600'}`}>
                    {events.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day bookings */}
      {selected && (
        <div className="card p-5">
          <h3 className="font-display font-semibold text-gray-900 mb-3">
            {format(selected, 'd MMMM yyyy')} · {selectedBookings.length} event{selectedBookings.length !== 1 ? 's' : ''}
          </h3>
          {selectedBookings.length === 0 ? (
            <p className="text-sm text-gray-500">No events on this day.</p>
          ) : (
            <div className="space-y-3">
              {selectedBookings.map(b => (
                <div key={b.id} className="p-3 bg-cream-50 rounded-xl">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-gray-900">{b.customer?.fullName}</p>
                    <BookingStatusBadge status={b.status} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{b.property?.name} · {b.guestCount} guests · {b.eventType}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
