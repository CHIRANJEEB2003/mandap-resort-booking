import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { fmtDate } from '../../utils/date';
import { MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const STATUS_BADGE = {
  PENDING: 'badge-yellow',
  APPROVED: 'badge-green',
  REJECTED: 'badge-red',
  SUSPENDED: 'badge-gray',
};

export default function ManageResortOwners() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-resort-owners', search, status, page],
    queryFn: () => api.get('/admin/owners/by-type', {
      params: { type: 'RESORT', search: search || undefined, status: status || undefined, page, limit: 20 },
    }).then(r => r.data),
  });

  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Resort Owners</h1>
          <p className="section-subtitle">Manage registered resort venue owners</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or business..." className="input pl-9" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input w-44">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {isLoading ? <LoadingSpinner /> : !data?.owners?.length ? (
        <EmptyState icon="🏨" title="No resort owners found" description="Register one using the button above." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Owner', 'Business', 'Phone', 'Properties', 'Status', 'Joined'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.owners.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{o.fullName}</td>
                  <td className="px-4 py-3 text-gray-600">{o.businessName}</td>
                  <td className="px-4 py-3 text-gray-500">{o.user?.phone}</td>
                  <td className="px-4 py-3 text-gray-500">{o._count?.properties ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={STATUS_BADGE[o.verificationStatus] || 'badge-gray'}>
                      {o.verificationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{fmtDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4 flex-wrap text-xs text-gray-500">
            <span>{data.total} total resort owner{data.total !== 1 ? 's' : ''}</span>
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

