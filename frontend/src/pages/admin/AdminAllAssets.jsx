import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon, BuildingLibraryIcon, BuildingOffice2Icon,
  KeyIcon, PhotoIcon, PowerIcon, CheckCircleIcon, XCircleIcon,
  EyeIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid';

// ─── constants ─────────────────────────────────────────────────────────────────

const PROPERTY_STATUS = {
  APPROVED:       { label: 'Live',           cls: 'bg-green-100 text-green-700 border-green-200' },
  PENDING_REVIEW: { label: 'Pending Review', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  REJECTED:       { label: 'Rejected',       cls: 'bg-red-100 text-red-700 border-red-200' },
  DRAFT:          { label: 'Draft',          cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  INACTIVE:       { label: 'Inactive',       cls: 'bg-gray-100 text-gray-500 border-gray-200' },
};
const TYPE_LABEL = {
  MANDAP:'Mandap', MARRIAGE_HALL:'Marriage Hall',
  RESORT:'Resort', BANQUET_HALL:'Banquet Hall', WEDDING_VENUE:'Wedding Venue',
};
const TYPE_EMOJI = {
  MANDAP:'🏛️', MARRIAGE_HALL:'🏢', RESORT:'🏨', BANQUET_HALL:'🎪', WEDDING_VENUE:'💒',
};
const ROOM_CAT = {
  STANDARD: { label:'Standard', cls:'bg-blue-100 text-blue-700' },
  DELUXE:   { label:'Deluxe',   cls:'bg-[#D6AD45]/20 text-[#b8942d]' },
  LUXURY:   { label:'Luxury',   cls:'bg-purple-100 text-purple-700' },
};

// ─── stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }) {
  const colorMap = {
    green:  'bg-green-50 text-green-600 border-green-100',
    gold:   'bg-[#D6AD45]/10 text-[#b8942d] border-[#D6AD45]/20',
    forest: 'bg-[#142B0A]/8 text-[#142B0A] border-[#142B0A]/10',
    blue:   'bg-blue-50 text-blue-600 border-blue-100',
    red:    'bg-red-50 text-red-500 border-red-100',
  };
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${colorMap[color] || colorMap.forest}`}>
      <div className="p-2 rounded-lg bg-white/60">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-60">{label}</p>
        <p className="text-2xl font-bold font-display">{value ?? '—'}</p>
      </div>
    </div>
  );
}

// ─── property row ──────────────────────────────────────────────────────────────

function PropertyRow({ property, onApprove, onReject, approving, rejecting }) {
  const cover = property.media?.[0]?.url;
  const price = property.pricingRules?.[0]?.basePrice;
  const st    = PROPERTY_STATUS[property.status] || PROPERTY_STATUS.DRAFT;
  const isPending = property.status === 'PENDING_REVIEW';

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
      {/* Image + name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-11 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {cover
              ? <img src={cover} alt={property.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-xl">{TYPE_EMOJI[property.propertyType] || '🏛️'}</div>
            }
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 text-sm leading-tight truncate max-w-[200px]">{property.name}</p>
            <p className="text-xs text-gray-400 truncate max-w-[200px] mt-0.5">{property.addressLine || property.city}</p>
          </div>
        </div>
      </td>

      {/* Type */}
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
          {TYPE_EMOJI[property.propertyType]} {TYPE_LABEL[property.propertyType] || property.propertyType}
        </span>
      </td>

      {/* Owner */}
      <td className="px-4 py-3">
        <p className="text-sm text-gray-700 truncate max-w-[140px]">{property.owner?.businessName || property.owner?.fullName || '—'}</p>
      </td>

      {/* Capacity */}
      <td className="px-4 py-3 text-sm text-gray-600 text-center">
        {property.totalCapacity ? Number(property.totalCapacity).toLocaleString('en-IN') : '—'}
      </td>

      {/* Price */}
      <td className="px-4 py-3 text-sm font-semibold text-[#142B0A] text-right">
        {price ? `₹${Number(price).toLocaleString('en-IN')}` : <span className="text-gray-400 font-normal text-xs">On request</span>}
      </td>

      {/* Bookings */}
      <td className="px-4 py-3 text-sm text-center text-gray-500">
        {property._count?.bookings ?? 0}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${st.cls}`}>
          {st.label}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 justify-end">
          {isPending && (
            <>
              <button
                onClick={() => onApprove(property.id)}
                disabled={approving}
                title="Approve"
                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                <CheckCircleIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onReject(property.id)}
                disabled={rejecting}
                title="Reject"
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <XCircleIcon className="h-4 w-4" />
              </button>
            </>
          )}
          <Link
            to={`/admin/properties/verify/${property.id}`}
            className="p-1.5 rounded-lg text-gray-400 hover:text-[#142B0A] hover:bg-gray-100 transition-colors"
            title="View detail"
          >
            <EyeIcon className="h-4 w-4" />
          </Link>
          {property.slug && (
            <Link
              to={`/venue/${property.slug}`}
              target="_blank"
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="View on site"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── room row (compact horizontal) ────────────────────────────────────────────

function RoomCard({ room, onToggle, toggling }) {
  const cat = ROOM_CAT[room.category] || ROOM_CAT.STANDARD;
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
      {/* Image + name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {room.media?.[0]?.url
              ? <img src={room.media[0].url} alt={room.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><PhotoIcon className="h-5 w-5 text-gray-300" /></div>
            }
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 text-sm leading-tight truncate max-w-[180px]">{room.name}</p>
            {!room.isActive && <span className="text-xs text-red-500 font-medium">Inactive</span>}
          </div>
        </div>
      </td>
      {/* Category */}
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.cls}`}>{cat.label}</span>
      </td>
      {/* Resort */}
      <td className="px-4 py-3 text-sm text-gray-600 max-w-[160px] truncate">{room.property?.name || '—'}</td>
      {/* Owner */}
      <td className="px-4 py-3 text-sm text-gray-500 max-w-[140px] truncate">{room.property?.owner?.businessName || '—'}</td>
      {/* Price */}
      <td className="px-4 py-3 text-sm font-semibold text-[#142B0A] whitespace-nowrap text-right">
        ₹{Number(room.pricePerNight).toLocaleString('en-IN')}<span className="text-xs font-normal text-gray-500">/night</span>
      </td>
      {/* Units & bookings */}
      <td className="px-4 py-3 text-xs text-gray-500 text-center whitespace-nowrap">
        {room.totalRooms} units · {room._count?.bookings || 0} bookings
      </td>
      {/* Toggle */}
      <td className="px-4 py-3 text-right">
        <button onClick={() => onToggle(room.id)} disabled={toggling}
          title={room.isActive ? 'Deactivate' : 'Activate'}
          className={`p-1.5 rounded-lg transition-colors ${
            room.isActive ? 'text-green-500 hover:bg-red-50 hover:text-red-500' : 'text-gray-400 hover:bg-green-50 hover:text-green-600'
          }`}>
          <PowerIcon className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

// ─── main page ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'all',    label: 'All Properties', icon: '🏢', category: '' },
  { key: 'mandap', label: 'Mandaps',         icon: '🏛️', category: 'mandap' },
  { key: 'resort', label: 'Resorts',          icon: '🏨', category: 'resort' },
  { key: 'rooms',  label: 'Rooms',            icon: '🛏️', category: null },
];

export default function AdminAllAssets() {
  const qc = useQueryClient();
  const [tab, setTab]       = useState('all');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage]     = useState(1);
  const [roomCat, setRoomCat] = useState('');

  const currentTab = TABS.find(t => t.key === tab);
  const isRooms    = tab === 'rooms';

  // ── stats ──
  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data),
  });

  // ── properties query ──
  const { data: propData, isLoading: propLoading } = useQuery({
    queryKey: ['admin-assets-props', currentTab?.category, search, status, page],
    queryFn: () => api.get('/admin/properties/by-category', {
      params: {
        category: currentTab?.category || undefined,
        search:   search || undefined,
        status:   status || undefined,
        page,
        limit: 15,
      },
    }).then(r => r.data),
    enabled: !isRooms,
    keepPreviousData: true,
  });

  // ── rooms query ──
  const { data: roomData, isLoading: roomLoading } = useQuery({
    queryKey: ['admin-assets-rooms', roomCat, page],
    queryFn: () => api.get('/rooms/admin/rooms', {
      params: { category: roomCat || undefined, page, limit: 20 },
    }).then(r => r.data),
    enabled: isRooms,
    keepPreviousData: true,
  });

  // ── mutations ──
  const approveMut = useMutation({
    mutationFn: (id) => api.post(`/admin/properties/${id}/approve`),
    onSuccess: () => { toast.success('Property approved'); qc.invalidateQueries(['admin-assets-props']); qc.invalidateQueries(['admin-dashboard']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error approving'),
  });
  const rejectMut = useMutation({
    mutationFn: (id) => api.post(`/admin/properties/${id}/reject`, { reason: 'Rejected by admin' }),
    onSuccess: () => { toast.success('Property rejected'); qc.invalidateQueries(['admin-assets-props']); qc.invalidateQueries(['admin-dashboard']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error rejecting'),
  });
  const toggleMut = useMutation({
    mutationFn: (id) => api.put(`/rooms/admin/rooms/${id}/toggle`),
    onSuccess: () => { toast.success('Room status updated'); qc.invalidateQueries(['admin-assets-rooms']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const totalPages = isRooms
    ? Math.ceil((roomData?.total || 0) / 20)
    : Math.ceil((propData?.total || 0) / 15);

  const handleTabChange = (key) => { setTab(key); setPage(1); setSearch(''); setStatus(''); };

  const pendingCount = (propData?.properties || []).filter(p => p.status === 'PENDING_REVIEW').length;

  return (
    <div className="w-full max-w-7xl space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Asset Management</h1>
          <p className="text-sm text-gray-500 mt-1">All mandaps, resorts and rooms on the platform</p>
        </div>
        {pendingCount > 0 && (
          <Link to="/admin/properties/verify"
            className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-yellow-100 transition-colors">
            <span className="w-5 h-5 bg-yellow-400 text-white rounded-full text-xs flex items-center justify-center font-bold">{pendingCount}</span>
            Pending Review
          </Link>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BuildingLibraryIcon} label="Total Mandaps" value={stats?.totalMandaps} color="forest" />
        <StatCard icon={BuildingOffice2Icon} label="Total Resorts"  value={stats?.totalResorts}  color="gold"   />
        <StatCard icon={KeyIcon}             label="Total Rooms"    value={stats?.totalRooms}    color="blue"   />
        <StatCard icon={CheckSolid}          label="Pending Review" value={stats?.pendingProperties} color="red" />
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => handleTabChange(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              tab === t.key ? 'bg-white shadow-sm text-[#142B0A] font-semibold' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <span>{t.icon}</span> {t.label}
            {t.key !== 'rooms' && stats && (
              <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full ml-0.5 font-normal">
                {t.key === 'all'
                  ? (stats.totalMandaps || 0) + (stats.totalResorts || 0)
                  : t.key === 'mandap' ? stats.totalMandaps
                  : stats.totalResorts}
              </span>
            )}
            {t.key === 'rooms' && stats && (
              <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full ml-0.5 font-normal">{stats.totalRooms}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          {isRooms ? (
            <select value={roomCat} onChange={e => { setRoomCat(e.target.value); setPage(1); }} className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#142B0A]/20">
              <option value="">All Categories</option>
              <option value="STANDARD">Standard</option>
              <option value="DELUXE">Deluxe</option>
              <option value="LUXURY">Luxury</option>
            </select>
          ) : (
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or address…"
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-[#142B0A]/20"
            />
          )}
        </div>

        {!isRooms && (
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#142B0A]/20">
            <option value="">All Status</option>
            <option value="APPROVED">Live</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="REJECTED">Rejected</option>
            <option value="DRAFT">Draft</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        )}

        {(search || status || roomCat) && (
          <button onClick={() => { setSearch(''); setStatus(''); setRoomCat(''); setPage(1); }}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors px-2">
            Clear filters
          </button>
        )}

        <div className="ml-auto text-sm text-gray-500 self-center">
          {isRooms
            ? roomData ? `${roomData.total} rooms` : ''
            : propData ? `${propData.total} properties` : ''
          }
        </div>
      </div>

      {/* ── Properties table ── */}
      {!isRooms && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {propLoading ? (
            <div className="p-8 flex items-center justify-center">
              <ArrowPathIcon className="h-6 w-6 text-gray-300 animate-spin" />
            </div>
          ) : !propData?.properties?.length ? (
            <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
              <BuildingOffice2Icon className="h-12 w-12 text-gray-200" />
              <p className="font-medium text-gray-500">No properties found</p>
              <p className="text-xs">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Property', 'Type', 'Owner', 'Capacity', 'Price', 'Bookings', 'Status', 'Actions'].map(h => (
                        <th key={h} className={`px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide ${
                          h === 'Price' || h === 'Bookings' || h === 'Actions' ? 'text-right' : 'text-left'
                        }`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {propData.properties.map(p => (
                      <PropertyRow
                        key={p.id}
                        property={p}
                        onApprove={(id) => approveMut.mutate(id)}
                        onReject={(id) => rejectMut.mutate(id)}
                        approving={approveMut.isPending}
                        rejecting={rejectMut.isPending}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4 text-xs text-gray-500 flex-wrap">
                <span>Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, propData.total)} of {propData.total} properties</span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-[#142B0A] hover:text-[#142B0A] disabled:opacity-30 transition-all">
                      <ChevronLeftIcon className="h-3.5 w-3.5" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      return (
                        <button key={pg} onClick={() => setPage(pg)}
                          className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                            pg === page ? 'bg-[#142B0A] text-white' : 'border border-gray-200 text-gray-600 hover:border-[#142B0A]'
                          }`}>
                          {pg}
                        </button>
                      );
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-[#142B0A] hover:text-[#142B0A] disabled:opacity-30 transition-all">
                      <ChevronRightIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Rooms table ── */}
      {isRooms && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {roomLoading ? (
            <div className="p-8 flex items-center justify-center">
              <ArrowPathIcon className="h-6 w-6 text-gray-300 animate-spin" />
            </div>
          ) : !roomData?.rooms?.length ? (
            <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
              <KeyIcon className="h-12 w-12 text-gray-200" />
              <p className="font-medium text-gray-500">No rooms found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Room', 'Category', 'Resort', 'Owner / Business', 'Price', 'Units & Bookings', 'Status'].map(h => (
                        <th key={h} className={`px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide ${
                          h === 'Price' || h === 'Status' ? 'text-right' : 'text-left'
                        } ${h === 'Units & Bookings' ? 'text-center' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {roomData.rooms.map(r => (
                      <RoomCard key={r.id} room={r} onToggle={(id) => toggleMut.mutate(id)} toggling={toggleMut.isPending} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4 text-xs text-gray-500 flex-wrap">
                <span>Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, roomData.total)} of {roomData.total} rooms</span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-[#142B0A] hover:text-[#142B0A] disabled:opacity-30 transition-all">
                      <ChevronLeftIcon className="h-3.5 w-3.5" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      return (
                        <button key={pg} onClick={() => setPage(pg)}
                          className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                            pg === page ? 'bg-[#142B0A] text-white' : 'border border-gray-200 text-gray-600 hover:border-[#142B0A]'
                          }`}>
                          {pg}
                        </button>
                      );
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-[#142B0A] hover:text-[#142B0A] disabled:opacity-30 transition-all">
                      <ChevronRightIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
