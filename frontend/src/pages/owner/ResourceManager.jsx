import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../context/authStore';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

export default function ResourceManager() {
  const { data: properties, isLoading: propsLoading } = useQuery({
    queryKey: ['owner-properties'],
    queryFn: () => api.get('/owner/properties').then(r => r.data),
  });

  if (propsLoading) return <LoadingSpinner />;

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div>
        <h1 className="section-title">Resource Manager</h1>
        <p className="section-subtitle">Track team availability and resource inventory</p>
      </div>

      {!properties?.length ? (
        <EmptyState icon="📦" title="No properties found" description="Add a property first to manage its resources." />
      ) : (
        <div className="space-y-6">
          {properties.map(p => (
            <PropertyResources key={p.id} propertyId={p.id} propertyName={p.name} />
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyResources({ propertyId, propertyName }) {
  const { data: resources, isLoading } = useQuery({
    queryKey: ['property-resources', propertyId],
    queryFn: () => api.get(`/properties/${propertyId}/resources`).then(r => r.data),
  });

  const CATEGORY_ICONS = {
    MANDAP_HALL: '🏛️', DECORATION_TEAM: '🌸', FLOWER_DECORATION_TEAM: '💐',
    CLEANING_TEAM: '🧹', CATERING_TEAM: '🍽️', MANAGEMENT_TEAM: '👔',
    SECURITY_TEAM: '👮', CUSTOM: '📦',
  };

  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-gray-900 mb-4">{propertyName}</h2>
      {isLoading ? <LoadingSpinner size="sm" /> : !resources?.length ? (
        <p className="text-sm text-gray-500">No resources configured for this property.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {resources.map(r => {
            const available = r.totalQty - r.maintenanceQty;
            const pct = Math.round((available / r.totalQty) * 100);
            return (
              <div key={r.id} className="p-3 bg-cream-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span>{CATEGORY_ICONS[r.resourceType?.category] || '📦'}</span>
                  <p className="text-sm font-semibold text-gray-800">{r.resourceType?.name}</p>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Available: {available}/{r.totalQty}</span>
                  <span className={pct > 50 ? 'text-green-600' : pct > 25 ? 'text-yellow-600' : 'text-red-600'}>
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
