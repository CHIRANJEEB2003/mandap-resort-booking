import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { PlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

const STATUS_BADGE = {
  DRAFT: 'badge-gray', PENDING_REVIEW: 'badge-yellow', APPROVED: 'badge-green',
  REJECTED: 'badge-red', INACTIVE: 'badge-gray',
};
const STATUS_LABELS = {
  DRAFT: 'Draft', PENDING_REVIEW: 'Pending Review', APPROVED: 'Live', REJECTED: 'Rejected', INACTIVE: 'Inactive',
};

export default function OwnerProperties() {
  const { data: properties, isLoading } = useQuery({
    queryKey: ['owner-properties'],
    queryFn: () => api.get('/owner/properties').then(r => r.data),
  });

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="section-title">My Properties</h1>
          <p className="section-subtitle">Manage your listed venues</p>
        </div>
        <Link to="/owner/properties/new" className="btn-primary flex items-center gap-2 text-sm">
          <PlusIcon className="h-4 w-4" /> Add Property
        </Link>
      </div>

      {isLoading ? <LoadingSpinner /> : !properties?.length ? (
        <EmptyState icon="🏛️" title="No properties yet"
          description="Add your first venue to start accepting bookings."
          action={<Link to="/owner/properties/new" className="btn-primary text-sm">Add Property</Link>} />
      ) : (
        <div className="space-y-4">
          {properties.map(p => (
            <div key={p.id} className="card p-5 flex flex-col md:flex-row gap-4">
              {p.media?.[0]?.url ? (
                <img src={p.media[0].url} alt={p.name} className="w-full md:w-24 h-20 object-cover rounded-xl flex-shrink-0" />
              ) : (
                <div className="w-full md:w-24 h-20 bg-cream-200 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🏛️</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-semibold text-gray-900">{p.name}</h3>
                  <span className={STATUS_BADGE[p.status] || 'badge-gray'}>{STATUS_LABELS[p.status] || p.status}</span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{p.addressLine}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {p.halls?.length || 0} halls · Capacity: {p.totalCapacity}
                  {p.hasAC ? ' · AC' : ''}{p.hasPool ? ' · Pool' : ''}
                </p>
                {p.rejectionReason && (
                  <p className="text-xs text-red-600 mt-1 font-medium">Rejection: {p.rejectionReason}</p>
                )}
              </div>
              <Link to={`/owner/properties/${p.id}/edit`}
                className="btn-outline text-sm flex items-center gap-2 self-start">
                <PencilSquareIcon className="h-4 w-4" /> Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
