import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { fmtDate } from '../../utils/date';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';

const STATUS_BADGE = {
  APPROVED: 'badge-green',
  PENDING_REVIEW: 'badge-yellow',
  REJECTED: 'badge-red',
  DRAFT: 'badge-gray',
  INACTIVE: 'badge-gray',
};

const TYPE_LABEL = {
  MANDAP: 'Mandap',
  MARRIAGE_HALL: 'Marriage Hall',
};

export default function ManageMandaps() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-mandaps', search, status, page],
    queryFn: () => api.get('/admin/properties/by-category', {
      params: { category: 'mandap', search: search || undefined, status: status || undefined, page, limit: 20 },
    }).then(r => r.data),
  });

  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="section-title">Manage Mandaps</h1>
          <p className="section-subtitle">All mandap and marriage hall listings</p>
        </div>
        <Link to="/admin/add-venue" className="btn-primary flex items-center gap-2 text-sm">
          <PlusIcon className="h-4 w-4" />
          Add Venue
        </Link>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search mandaps..." className="input pl-9" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input w-48">
          <option value="">All Status</option>
          <option value="APPROVED">Live</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="REJECTED">Rejected</option>
          <option value="DRAFT">Draft</option>
        </select>
        {data && <span className="self-center text-sm text-gray-400 ml-auto">{data.total} total</span>}
      </div>

      {isLoading ? <LoadingSpinner /> : !data?.properties?.length ? (
        <EmptyState icon="🏛️" title="No mandaps found" description="Mandaps registered by owners will appear here." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Property', 'Type', 'Owner', 'Capacity', 'Bookings', 'Status', 'Listed', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.properties.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.addressLine}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{TYPE_LABEL[p.propertyType] || p.propertyType}</td>
                  <td className="px-4 py-3 text-gray-600">{p.owner?.businessName}</td>
                  <td className="px-4 py-3 text-gray-500">{p.totalCapacity}</td>
                  <td className="px-4 py-3 text-gray-500">{p._count?.bookings ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={STATUS_BADGE[p.status] || 'badge-gray'}>
                      {p.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{fmtDate(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/add-venue/${p.id}`}
                      className="text-xs text-forest-600 hover:text-forest-800 font-medium transition-colors">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4 flex-wrap text-xs text-gray-500">
            <span>Showing {((page - 1) * 20) + 1} - {Math.min(page * 20, data.total)} of {data.total} mandap{data.total !== 1 ? 's' : ''}</span>
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
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${pg === page ? 'bg-forest-700 text-white' : 'border border-gray-200 hover:border-forest-600'}`}>
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
      )}
    </div>
  );
}

