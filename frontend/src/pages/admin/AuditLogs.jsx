import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { fmtDate } from '../../utils/date';

const ENTITIES = ['', 'booking', 'property', 'owner', 'user', 'payment'];

export default function AuditLogs() {
  const [entity, setEntity] = useState('');
  const [page, setPage] = useState(1);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', entity, page],
    queryFn: () => api.get('/admin/audit-logs', { params: { entity: entity || undefined, page, limit: 50 } }).then(r => r.data),
  });

  return (
    <div className="w-full max-w-6xl space-y-6">
      <div>
        <h1 className="section-title">Audit Logs</h1>
        <p className="section-subtitle">Non-deletable record of all important platform actions</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ENTITIES.map(e => (
          <button key={e || 'all'} onClick={() => { setEntity(e); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
              entity === e ? 'bg-forest-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}>
            {e || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'IP'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {(logs || []).map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                      {fmtDate(log.createdAt, 'd MMM HH:mm:ss')}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs">{log.user?.phone || log.user?.email || 'System'}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-semibold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-lg">{log.action}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs">{log.entity}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{log.entityId?.slice(-12)}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{log.ipAddress || 'â€”'}</td>
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

