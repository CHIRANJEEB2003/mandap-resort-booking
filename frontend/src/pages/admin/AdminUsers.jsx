import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { fmtDate } from '../../utils/date';

const ROLE_BADGE = { CUSTOMER: 'badge-blue', OWNER: 'badge-green', ADMIN: 'badge-gray' };
const STATUS_BADGE = { ACTIVE: 'badge-green', SUSPENDED: 'badge-yellow', BLOCKED: 'badge-red' };

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, role, page],
    queryFn: () => api.get('/admin/users', { params: { search: search || undefined, role: role || undefined, page, limit: 20 } }).then(r => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }) => api.put(`/admin/users/${userId}/status`, { status }),
    onSuccess: () => { toast.success('User status updated'); qc.invalidateQueries(['admin-users']); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  return (
    <div className="w-full max-w-6xl space-y-6">
      <div>
        <h1 className="section-title">User Management</h1>
        <p className="section-subtitle">{data?.total || 0} total users</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input type="search" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search phone or email..." className="input max-w-xs" />
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }} className="input max-w-xs">
          <option value="">All Roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="OWNER">Owner</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['User', 'Phone', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data?.users || []).map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{u.customerProfile?.fullName || u.ownerProfile?.fullName || u.email || 'â€”'}</p>
                      {u.email && <p className="text-xs text-gray-400">{u.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.phone}</td>
                    <td className="px-4 py-3"><span className={ROLE_BADGE[u.role] || 'badge-gray'}>{u.role}</span></td>
                    <td className="px-4 py-3"><span className={STATUS_BADGE[u.status] || 'badge-gray'}>{u.status}</span></td>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.status}
                        onChange={e => statusMutation.mutate({ userId: u.id, status: e.target.value })}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-forest-500">
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspend</option>
                        <option value="BLOCKED">Block</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

