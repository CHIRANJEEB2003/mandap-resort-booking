import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../context/authStore';
import toast from 'react-hot-toast';
import {
  MapPinIcon,
  UserGroupIcon,
  MoonIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronLeftIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const CATEGORY_BADGE = {
  STANDARD: 'bg-blue-100 text-blue-700',
  DELUXE: 'bg-gold-100 text-gold-700',
  LUXURY: 'bg-purple-100 text-purple-700',
};

const CATEGORY_LABEL = { STANDARD: 'Standard', DELUXE: 'Deluxe', LUXURY: 'Luxury' };

const today = new Date().toISOString().split('T')[0];

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function computeNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut) - new Date(checkIn);
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function fmt(n) {
  return Number(n).toLocaleString('en-IN');
}

function BookingForm({ room, onCancel, onSuccess }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    checkIn: today,
    checkOut: addDays(today, 1),
    roomCount: 1,
    guestCount: 1,
    notes: '',
  });

  const nights = computeNights(form.checkIn, form.checkOut);
  const baseAmount = Number(room.pricePerNight) * nights * form.roomCount;
  const tax = Math.round(baseAmount * 0.18 * 100) / 100;
  const grandTotal = baseAmount + tax;
  const advance = Math.round(grandTotal * 0.3 * 100) / 100;

  const { data: availability } = useQuery({
    queryKey: ['room-availability', room.id, form.checkIn, form.checkOut],
    queryFn: () =>
      api
        .get(`/rooms/${room.id}/availability`, { params: { checkIn: form.checkIn, checkOut: form.checkOut } })
        .then((r) => r.data),
    enabled: Boolean(form.checkIn && form.checkOut && nights > 0),
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/rooms/bookings', data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Room booked successfully!');
      navigate('/customer/room-bookings');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (nights <= 0) { toast.error('Check-out must be after check-in'); return; }
    mutation.mutate({
      roomId: room.id,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      roomCount: Number(form.roomCount),
      guestCount: Number(form.guestCount),
      notes: form.notes || undefined,
    });
  };

  return (
    <div className="mt-4 p-5 bg-cream-50 rounded-2xl border border-forest-100">
      <h4 className="font-display font-semibold text-gray-900 mb-4">Book: {room.name}</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Check-in *</label>
            <input
              type="date"
              className="input"
              min={today}
              value={form.checkIn}
              onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value, checkOut: addDays(e.target.value, 1) }))}
              required
            />
          </div>
          <div>
            <label className="label">Check-out *</label>
            <input
              type="date"
              className="input"
              min={addDays(form.checkIn, 1)}
              value={form.checkOut}
              onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))}
              required
            />
          </div>
        </div>

        {availability && nights > 0 && (
          <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${availability.available ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {availability.available
              ? <CheckCircleIcon className="h-4 w-4" />
              : <ExclamationCircleIcon className="h-4 w-4" />}
            {availability.available
              ? `${availability.availableRooms} room${availability.availableRooms !== 1 ? 's' : ''} available`
              : 'No rooms available for selected dates'}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Rooms *</label>
            <select
              className="input"
              value={form.roomCount}
              onChange={(e) => setForm((f) => ({ ...f, roomCount: Number(e.target.value) }))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Guests *</label>
            <input
              type="number"
              className="input"
              min={1}
              max={room.maxGuests * form.roomCount}
              value={form.guestCount}
              onChange={(e) => setForm((f) => ({ ...f, guestCount: Number(e.target.value) }))}
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Special Requests</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Any special requests..."
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        {nights > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>₹{fmt(room.pricePerNight)} × {nights} night{nights !== 1 ? 's' : ''} × {form.roomCount} room{form.roomCount !== 1 ? 's' : ''}</span>
              <span>₹{fmt(baseAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>GST (18%)</span>
              <span>₹{fmt(tax)}</span>
            </div>
            <div className="border-t border-gray-100 pt-1.5 flex justify-between font-semibold text-gray-900">
              <span>Total</span>
              <span>₹{fmt(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-forest-600 font-medium">
              <span>Advance to pay (30%)</span>
              <span>₹{fmt(advance)}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="btn-outline flex-1">
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || (availability && !availability.available)}
            className="btn-primary flex-1"
          >
            {mutation.isPending ? 'Booking…' : user ? 'Confirm Booking' : 'Sign In to Book'}
          </button>
        </div>
      </form>
    </div>
  );
}

function RoomCard({ room, isSelected, onSelect, onDeselect }) {
  const cover = room.media?.find((m) => m.isCover) || room.media?.[0];
  const facilities = Array.isArray(room.facilities) ? room.facilities : [];

  return (
    <div className={`card overflow-hidden transition-all ${isSelected ? 'ring-2 ring-forest-500' : ''}`}>
      <div className="h-48 bg-gray-100 relative overflow-hidden">
        {cover ? (
          <img src={cover.url} alt={room.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-forest-50 to-gold-50">
            <SparklesIcon className="h-12 w-12 text-forest-200" />
          </div>
        )}
        <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_BADGE[room.category]}`}>
          {CATEGORY_LABEL[room.category]}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-display font-semibold text-gray-900 mb-1">{room.name}</h3>
        {room.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{room.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <span className="flex items-center gap-1">
            <UserGroupIcon className="h-4 w-4" />
            Up to {room.maxGuests} guests
          </span>
          <span className="flex items-center gap-1">
            <MoonIcon className="h-4 w-4" />
            {room.totalRooms} room{room.totalRooms !== 1 ? 's' : ''}
          </span>
        </div>

        {facilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {facilities.slice(0, 4).map((f) => (
              <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
            ))}
            {facilities.length > 4 && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{facilities.length - 4} more</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-2xl font-bold text-forest-700">₹{Number(room.pricePerNight).toLocaleString('en-IN')}</span>
            <span className="text-sm text-gray-500"> / night</span>
          </div>
          {isSelected ? (
            <button onClick={onDeselect} className="btn-outline text-sm px-4">
              Close
            </button>
          ) : (
            <button onClick={onSelect} className="btn-primary text-sm px-4">
              Book Now
            </button>
          )}
        </div>

        {isSelected && (
          <BookingForm room={room} onCancel={onDeselect} />
        )}
      </div>
    </div>
  );
}

const ALL_CATEGORIES = ['STANDARD', 'DELUXE', 'LUXURY'];

export default function ResortRoomsPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const { data: rooms = [], isLoading, isError } = useQuery({
    queryKey: ['resort-rooms', propertyId],
    queryFn: () => api.get('/rooms', { params: { propertyId } }).then((r) => r.data),
    enabled: Boolean(propertyId),
  });

  const property = rooms[0]?.property;
  const availableCategories = [...new Set(rooms.map((r) => r.category))];

  const filteredRooms =
    activeCategory === 'ALL'
      ? rooms
      : rooms.filter((r) => r.category === activeCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-2 border-forest-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isError || rooms.length === 0) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-lg">No rooms found for this property.</p>
        <button onClick={() => navigate('/room-booking')} className="btn-outline">
          Back to Resorts
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Hero */}
      <div className="bg-forest-700 text-white py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/room-booking')}
            className="flex items-center gap-1 text-forest-300 hover:text-white text-sm mb-4 transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            All Resorts
          </button>
          <h1 className="font-display text-3xl font-bold mb-1">{property?.name}</h1>
          {property?.addressLine && (
            <p className="text-forest-200 flex items-center gap-1.5">
              <MapPinIcon className="h-4 w-4" />
              {property.addressLine}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Category tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === 'ALL'
                ? 'bg-forest-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-forest-300'
            }`}
          >
            All Rooms
          </button>
          {ALL_CATEGORIES.filter((c) => availableCategories.includes(c)).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-forest-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-forest-300'
              }`}
            >
              {CATEGORY_LABEL[cat]}
            </button>
          ))}
        </div>

        {filteredRooms.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No rooms in this category.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                isSelected={selectedRoomId === room.id}
                onSelect={() => {
                  if (!token || user?.role !== 'CUSTOMER') {
                    navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`);
                  } else {
                    setSelectedRoomId(room.id);
                  }
                }}
                onDeselect={() => setSelectedRoomId(null)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
