import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { PhotoIcon, PowerIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const CATEGORY_LABELS = { STANDARD: 'Standard', DELUXE: 'Deluxe', LUXURY: 'Luxury' };
const CATEGORY_COLORS = {
  STANDARD: 'bg-blue-100 text-blue-700',
  DELUXE: 'bg-gold-100 text-gold-700',
  LUXURY: 'bg-purple-100 text-purple-700',
};
const STATUS_BADGE = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
};

export default function AdminRooms() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('rooms');
  const [bookingStatus, setBookingStatus] = useState('');
  const [roomCategory, setRoomCategory] = useState('');
  const [roomSearch, setRoomSearch] = useState('');

  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ['admin-rooms', roomCategory, roomSearch],
    queryFn: () => api.get('/rooms/admin/rooms', {
      params: { category: roomCategory || undefined, search: roomSearch || undefined },
    }).then(r => r.data),
    enabled: activeTab === 'rooms',
  });

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['admin-room-bookings', bookingStatus],
    queryFn: () => api.get('/rooms/admin/room-bookings', {
      params: { status: bookingStatus || undefined },
    }).then(r => r.data),
    enabled: activeTab === 'bookings',
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/rooms/admin/rooms/${id}/toggle`),
    onSuccess: () => { toast.success('Room status updated'); qc.invalidateQueries(['admin-rooms']); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div>
        <h1 className="section-title">Room Management</h1>
        <p className="section-subtitle">Manage all resort rooms and room bookings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'rooms', label: 'All Rooms' },
          { key: 'bookings', label: 'Room Bookings' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.key ? 'bg-white shadow-sm text-forest-700' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input value={roomSearch} onChange={e => setRoomSearch(e.target.value)}
                placeholder="Search rooms or resort…" className="input pl-9" />
            </div>
            <select value={roomCategory} onChange={e => setRoomCategory(e.target.value)} className="input w-44">
              <option value="">All Categories</option>
              <option value="STANDARD">Standard</option>
              <option value="DELUXE">Deluxe</option>
              <option value="LUXURY">Luxury</option>
            </select>
            {(roomSearch || roomCategory) && (
              <button onClick={() => { setRoomSearch(''); setRoomCategory(''); }}
                className="text-sm text-gray-400 hover:text-red-500 transition-colors px-2">
                Clear
              </button>
            )}
            {roomsData && (
              <span className="self-center text-sm text-gray-400 ml-auto">{roomsData.total} room{roomsData.total !== 1 ? 's' : ''}</span>
            )}
          </div>

          {roomsLoading ? <LoadingSpinner /> :
           !roomsData?.rooms?.length ? (
            <EmptyState icon="🛏️" title="No rooms found" description="No rooms have been created yet." />
          ) : (
            <div className="space-y-3">
              {roomsData.rooms.map(room => (
                <div key={room.id} className="card p-4 flex items-center gap-4">
                  {room.media?.[0]?.url ? (
                    <img src={room.media[0].url} alt={room.name} className="w-16 h-14 object-cover rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-14 bg-cream-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <PhotoIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[room.category]}`}>
                        {CATEGORY_LABELS[room.category]}
                      </span>
                      {!room.isActive && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900">{room.name}</p>
                    <p className="text-xs text-gray-500">{room.property?.name} · {room.property?.owner?.businessName}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm font-semibold text-forest-600">₹{Number(room.pricePerNight).toLocaleString('en-IN')}/night</span>
                      <span className="text-xs text-gray-400">{room.totalRooms} rooms · {room._count?.bookings || 0} bookings</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleMutation.mutate(room.id)}
                    disabled={toggleMutation.isPending}
                    className={`p-2 rounded-lg transition-all ${
                      room.isActive
                        ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                    }`}
                    title={room.isActive ? 'Deactivate' : 'Activate'}>
                    <PowerIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {roomsData?.total > 20 && (
                <p className="text-center text-sm text-gray-400">Showing first 20 of {roomsData.total} rooms</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            <select value={bookingStatus} onChange={e => setBookingStatus(e.target.value)} className="input w-44">
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {bookingsLoading ? <LoadingSpinner /> :
           !bookingsData?.bookings?.length ? (
            <EmptyState icon="📋" title="No room bookings" description="No room bookings have been made yet." />
          ) : (
            <div className="space-y-3">
              {bookingsData.bookings.map(b => {
                const checkIn = new Date(b.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                const checkOut = new Date(b.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                return (
                  <div key={b.id} className="card p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[b.room?.category] || ''}`}>
                            {b.room?.category}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[b.status] || ''}`}>
                            {b.status}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900">{b.room?.name}</p>
                        <p className="text-xs text-gray-500">{b.room?.property?.name}</p>
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">{b.customer?.fullName}</span>
                          {' · '}{b.customer?.user?.phone}
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {checkIn} → {checkOut} · {b.nights} night{b.nights !== 1 ? 's' : ''} · {b.roomCount} room{b.roomCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-forest-700">₹{Number(b.totalAmount).toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(b.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {bookingsData?.total > 20 && (
                <p className="text-center text-sm text-gray-400">Showing first 20 of {bookingsData.total} bookings</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
