import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import {
  PlusIcon, PencilSquareIcon, TrashIcon, PhotoIcon,
  XMarkIcon, CheckIcon,
} from '@heroicons/react/24/outline';

const CATEGORY_LABELS = { STANDARD: 'Standard', DELUXE: 'Deluxe', LUXURY: 'Luxury' };
const CATEGORY_COLORS = {
  STANDARD: 'bg-blue-100 text-blue-700',
  DELUXE: 'bg-gold-100 text-gold-700',
  LUXURY: 'bg-purple-100 text-purple-700',
};
const ROOM_FACILITIES = [
  'AC', 'WiFi', 'TV', 'Hot Water', 'Mini Fridge', 'Wardrobe',
  'Balcony', 'City View', 'Pool View', 'King Bed', 'Twin Beds',
  'Attached Bathroom', 'Bathtub', 'Work Desk',
];

// â”€â”€â”€ Room Form Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function RoomFormModal({ propertyId, room, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    propertyId,
    category: room?.category || 'STANDARD',
    name: room?.name || '',
    description: room?.description || '',
    pricePerNight: room?.pricePerNight || '',
    totalRooms: room?.totalRooms || '',
    maxGuests: room?.maxGuests || 2,
    facilities: room?.facilities || [],
  });

  const mutation = useMutation({
    mutationFn: (data) => room
      ? api.put(`/rooms/owner/rooms/${room.id}`, data)
      : api.post('/rooms/owner/rooms', data),
    onSuccess: () => {
      toast.success(room ? 'Room updated' : 'Room added');
      qc.invalidateQueries(['owner-rooms']);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error saving room'),
  });

  const toggleFacility = (f) => {
    setForm(prev => ({
      ...prev,
      facilities: prev.facilities.includes(f)
        ? prev.facilities.filter(x => x !== f)
        : [...prev.facilities, f],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Room name is required');
    if (!form.pricePerNight) return toast.error('Price per night is required');
    if (!form.totalRooms) return toast.error('Total rooms is required');
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-lg text-gray-900">{room ? 'Edit' : 'Add'} Room</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div>
            <label className="label">Category *</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                <button key={val} type="button"
                  onClick={() => setForm(f => ({ ...f, category: val }))}
                  className={`py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.category === val ? 'border-forest-600 bg-forest-50 text-forest-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="label">Room Name *</label>
            <input className="input" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Standard Room with Garden View" />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of the room..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Price / Night (₹) *</label>
              <input className="input" type="number" min="0" value={form.pricePerNight}
                onChange={e => setForm(f => ({ ...f, pricePerNight: e.target.value }))} />
            </div>
            <div>
              <label className="label">Total Rooms *</label>
              <input className="input" type="number" min="1" value={form.totalRooms}
                onChange={e => setForm(f => ({ ...f, totalRooms: e.target.value }))} />
            </div>
            <div>
              <label className="label">Max Guests</label>
              <input className="input" type="number" min="1" max="10" value={form.maxGuests}
                onChange={e => setForm(f => ({ ...f, maxGuests: e.target.value }))} />
            </div>
          </div>

          {/* Facilities */}
          <div>
            <label className="label">Facilities</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {ROOM_FACILITIES.map(f => (
                <button key={f} type="button"
                  onClick={() => toggleFacility(f)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    form.facilities.includes(f)
                      ? 'bg-forest-600 text-white border-forest-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-forest-300'
                  }`}>
                  {form.facilities.includes(f) && <CheckIcon className="h-3 w-3 inline mr-1" />}
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? 'Saving...' : room ? 'Update Room' : 'Add Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function OwnerRooms() {
  const qc = useQueryClient();
  const [modalState, setModalState] = useState(null); // { propertyId, room? }
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [activeBookingsTab, setActiveBookingsTab] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('');

  const { data: properties, isLoading } = useQuery({
    queryKey: ['owner-rooms'],
    queryFn: () => api.get('/rooms/owner/rooms').then(r => r.data),
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['owner-room-bookings', bookingStatus],
    queryFn: () => api.get(`/rooms/owner/room-bookings${bookingStatus ? `?status=${bookingStatus}` : ''}`).then(r => r.data),
    enabled: activeBookingsTab,
  });

  const deleteMutation = useMutation({
    mutationFn: (roomId) => api.delete(`/rooms/owner/rooms/${roomId}`),
    onSuccess: () => { toast.success('Room deactivated'); qc.invalidateQueries(['owner-rooms']); setConfirmDelete(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  const confirmBookingMutation = useMutation({
    mutationFn: (id) => api.post(`/rooms/owner/room-bookings/${id}/confirm`),
    onSuccess: () => { toast.success('Booking confirmed'); qc.invalidateQueries(['owner-room-bookings']); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  const rejectBookingMutation = useMutation({
    mutationFn: (id) => api.post(`/rooms/owner/room-bookings/${id}/reject`),
    onSuccess: () => { toast.success('Booking rejected'); qc.invalidateQueries(['owner-room-bookings']); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  const totalRooms = properties?.reduce((s, p) => s + (p.rooms?.length || 0), 0) || 0;

  const STATUS_BADGE = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    COMPLETED: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Room Management</h1>
          <p className="section-subtitle">Manage your resort rooms and bookings</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{totalRooms} room type{totalRooms !== 1 ? 's' : ''} listed</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: false, label: 'My Rooms' },
          { key: true, label: 'Room Bookings' },
        ].map(t => (
          <button key={String(t.key)} onClick={() => setActiveBookingsTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeBookingsTab === t.key ? 'bg-white shadow-sm text-forest-700' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Rooms Tab */}
      {!activeBookingsTab && (
        isLoading ? <LoadingSpinner /> :
        !properties?.length ? (
          <EmptyState icon="🏨" title="No resort properties found"
            description="Only resort properties can have rooms. Make sure you have a resort property listed." />
        ) : (
          <div className="space-y-6">
            {properties.map(property => (
              <div key={property.id} className="card overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-semibold text-gray-900">{property.name}</h2>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">{property.propertyType?.toLowerCase().replace('_', ' ')}</p>
                  </div>
                  <button
                    onClick={() => setModalState({ propertyId: property.id })}
                    className="btn-primary text-sm flex items-center gap-1.5">
                    <PlusIcon className="h-4 w-4" /> Add Room
                  </button>
                </div>

                {!property.rooms?.length ? (
                  <div className="p-8 text-center text-gray-400 text-sm">No rooms added yet</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {property.rooms.map(room => (
                      <div key={room.id} className="p-4 flex items-center gap-4">
                        {/* Cover photo */}
                        {room.media?.[0]?.url ? (
                          <img src={room.media[0].url} alt={room.name}
                            className="w-16 h-14 object-cover rounded-lg flex-shrink-0" />
                        ) : (
                          <div className="w-16 h-14 bg-cream-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <PhotoIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[room.category]}`}>
                              {CATEGORY_LABELS[room.category]}
                            </span>
                            {!room.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>}
                          </div>
                          <p className="font-medium text-gray-900 mt-1">{room.name}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-forest-600 font-semibold">₹{Number(room.pricePerNight).toLocaleString('en-IN')}/night</span>
                            <span className="text-xs text-gray-400">{room.totalRooms} rooms · {room.maxGuests} guests max</span>
                          </div>
                          {room.facilities?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {room.facilities.slice(0, 4).map(f => (
                                <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
                              ))}
                              {room.facilities.length > 4 && (
                                <span className="text-xs text-gray-400">+{room.facilities.length - 4} more</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => setModalState({ propertyId: property.id, room })}
                            className="p-2 text-gray-400 hover:text-forest-600 hover:bg-forest-50 rounded-lg transition-all">
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button onClick={() => setConfirmDelete(room)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Room Bookings Tab */}
      {activeBookingsTab && (
        <div className="space-y-4">
          {/* Status filter */}
          <div className="flex gap-2 flex-wrap">
            {['', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].map(s => (
              <button key={s} onClick={() => setBookingStatus(s)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  bookingStatus === s ? 'bg-forest-600 text-white border-forest-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                {s || 'All'}
              </button>
            ))}
          </div>

          {!bookingsData?.bookings?.length ? (
            <EmptyState icon="📋" title="No room bookings" description="Room booking requests will appear here." />
          ) : (
            <div className="space-y-3">
              {bookingsData.bookings.map(b => {
                const checkIn = new Date(b.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                const checkOut = new Date(b.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                return (
                  <div key={b.id} className="card p-5">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[b.room?.category] || ''}`}>
                            {b.room?.category}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[b.status] || ''}`}>{b.status}</span>
                        </div>
                        <p className="font-medium text-gray-900">{b.room?.name}</p>
                        <p className="text-sm text-gray-500">{b.customer?.fullName} · {b.customer?.user?.phone}</p>
                        <div className="text-sm text-gray-600 mt-1">
                          {checkIn} → {checkOut} · {b.nights} night{b.nights > 1 ? 's' : ''} · {b.roomCount} room{b.roomCount > 1 ? 's' : ''}
                        </div>
                        <p className="text-sm font-semibold text-forest-700 mt-1">
                          ₹{Number(b.totalAmount).toLocaleString('en-IN')} total · Advance ₹{Number(b.advanceAmount).toLocaleString('en-IN')}
                        </p>
                      </div>
                      {b.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button onClick={() => rejectBookingMutation.mutate(b.id)}
                            disabled={rejectBookingMutation.isPending}
                            className="btn-outline text-sm border-red-200 text-red-600 hover:bg-red-50">
                            Reject
                          </button>
                          <button onClick={() => confirmBookingMutation.mutate(b.id)}
                            disabled={confirmBookingMutation.isPending}
                            className="btn-primary text-sm">
                            Confirm
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Room Modal */}
      {modalState && (
        <RoomFormModal
          propertyId={modalState.propertyId}
          room={modalState.room}
          onClose={() => setModalState(null)}
        />
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-display font-semibold text-gray-900">Deactivate Room?</h3>
            <p className="text-sm text-gray-500">
              "{confirmDelete.name}" will be hidden from customers. Existing bookings won't be affected.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-outline flex-1">Cancel</button>
              <button onClick={() => deleteMutation.mutate(confirmDelete.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2 text-sm font-medium transition-colors">
                {deleteMutation.isPending ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

