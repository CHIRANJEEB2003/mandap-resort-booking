import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function PropertyVerificationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const { data: property, isLoading } = useQuery({
    queryKey: ['admin-property', id],
    queryFn: () => api.get(`/admin/properties/${id}`).then(r => r.data),
  });

  const approve = useMutation({
    mutationFn: () => api.post(`/admin/properties/${id}/approve`),
    onSuccess: () => { toast.success('Property approved and live'); qc.invalidateQueries(['admin-pending-properties']); navigate('/admin/properties/verify'); },
  });

  const reject = useMutation({
    mutationFn: (reason) => api.post(`/admin/properties/${id}/reject`, { reason }),
    onSuccess: () => { toast.success('Property rejected'); navigate('/admin/properties/verify'); },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!property) return <div className="text-gray-500 p-8">Property not found</div>;

  const images = property.media?.filter(m => m.mediaType === 'IMAGE') || [];

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
        <h1 className="text-xl font-display font-bold text-gray-900">Property Review</h1>
      </div>

      {/* Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {images.slice(0, 3).map((img, i) => (
            <img key={i} src={img.url} alt={property.name}
              className="aspect-video object-cover rounded-xl w-full" />
          ))}
        </div>
      )}

      <div className="card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-xl text-gray-900">{property.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{property.addressLine}</p>
          </div>
          <span className="badge-yellow">{property.propertyType?.replace('_', ' ')}</span>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">{property.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm border-t border-gray-100 pt-4">
          {[
            { label: 'Owner', value: property.owner?.businessName },
            { label: 'Capacity', value: `${property.totalCapacity} guests` },
            { label: 'Halls', value: `${property.halls?.length || 0} halls` },
            { label: 'AC', value: property.hasAC ? 'Yes' : 'No' },
            { label: 'Pool', value: property.hasPool ? 'Yes' : 'No' },
            { label: 'Rooms', value: property.hasRooms ? 'Yes' : 'No' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
              <p className="font-medium text-gray-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {property.status === 'PENDING_REVIEW' && (
        <div className="space-y-3">
          {showRejectForm ? (
            <div className="card p-4 space-y-3">
              <label className="label">Reason for rejection</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                rows={3} className="input resize-none" placeholder="Describe why this property is being rejected…" />
              <div className="flex gap-3">
                <button onClick={() => setShowRejectForm(false)} className="btn-outline flex-1 text-sm">Cancel</button>
                <button onClick={() => reject.mutate(rejectReason || 'Does not meet listing requirements')}
                  disabled={reject.isPending}
                  className="btn-outline flex-1 text-sm border-red-300 text-red-600 hover:bg-red-50">
                  {reject.isPending ? 'Rejecting…' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => approve.mutate()} disabled={approve.isPending} className="btn-primary flex-1">
                {approve.isPending ? 'Approving…' : '✓ Approve & Publish'}
              </button>
              <button onClick={() => setShowRejectForm(true)} disabled={reject.isPending}
                className="btn-outline flex-1 border-red-300 text-red-600 hover:bg-red-50">
                ✗ Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
