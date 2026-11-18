import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { fmtDate } from '../../utils/date';

export default function PropertyVerification() {
  const { data: properties, isLoading } = useQuery({
    queryKey: ['admin-pending-properties'],
    queryFn: () => api.get('/admin/properties/pending').then(r => r.data),
  });

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div>
        <h1 className="section-title">Property Verification Queue</h1>
        <p className="section-subtitle">Review properties submitted for listing</p>
      </div>

      {isLoading ? <LoadingSpinner /> : !properties?.length ? (
        <EmptyState icon="✅" title="Queue is empty" description="No pending property reviews." />
      ) : (
        <div className="space-y-3">
          {properties.map(p => (
            <Link key={p.id} to={`/admin/properties/verify/${p.id}`}
              className="card p-5 flex flex-col md:flex-row gap-4 hover:shadow-card-hover transition-all block">
              {p.media?.[0]?.url ? (
                <img src={p.media[0].url} alt={p.name} className="w-full md:w-20 h-16 object-cover rounded-xl flex-shrink-0" />
              ) : (
                <div className="w-full md:w-20 h-16 bg-cream-200 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🏛️</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900">{p.name}</p>
                  <span className="badge-yellow flex-shrink-0">Pending Review</span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{p.owner?.businessName} · {p.addressLine}</p>
                <p className="text-xs text-gray-400 mt-1">{p.propertyType?.replace('_', ' ')} · Submitted {fmtDate(p.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
