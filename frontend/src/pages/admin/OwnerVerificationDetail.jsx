import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

export default function OwnerVerificationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const { data: owner, isLoading } = useQuery({
    queryKey: ['admin-owner', id],
    queryFn: () => api.get(`/admin/owners/${id}`).then(r => r.data),
  });

  const approve = useMutation({
    mutationFn: () => api.post(`/admin/owners/${id}/approve`),
    onSuccess: () => { toast.success('Owner approved'); qc.invalidateQueries(['admin-pending-owners']); navigate('/admin/owners/verify'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  const reject = useMutation({
    mutationFn: (reason) => api.post(`/admin/owners/${id}/reject`, { reason }),
    onSuccess: () => { toast.success('Owner rejected'); navigate('/admin/owners/verify'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!owner) return <div className="text-gray-500 p-8">Owner not found</div>;

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
        <h1 className="text-xl font-display font-bold text-gray-900">Owner Verification</h1>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gold-100 flex items-center justify-center text-gold-700 text-xl font-bold">
            {owner.fullName?.[0]}
          </div>
          <div>
            <p className="font-display font-bold text-xl text-gray-900">{owner.businessName}</p>
            <p className="text-sm text-gray-500">{owner.fullName} · {owner.user?.phone}</p>
            {owner.user?.email && <p className="text-sm text-gray-500">{owner.user.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-4">
          {[
            { label: 'Address', value: owner.address },
            { label: 'GST', value: owner.gstNumber || '—' },
            { label: 'PAN', value: owner.panNumber || '—' },
            { label: 'Properties', value: `${owner.properties?.length || 0} listed` },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
              <p className="font-medium text-gray-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Documents */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-gray-900 mb-4">Submitted Documents</h2>
        {!owner.documents?.length ? (
          <p className="text-sm text-gray-500">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {owner.documents.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium text-gray-800">{d.docType}</p>
                <div className="flex items-center gap-3">
                  {d.verified ? <span className="badge-green">Verified</span> : <span className="badge-yellow">Unverified</span>}
                  <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">View →</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {owner.verificationStatus === 'PENDING' && (
        <div className="space-y-3">
          {showRejectForm ? (
            <div className="card p-4 space-y-3">
              <label className="label">Reason for rejection</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                rows={3} className="input resize-none" placeholder="Describe why this owner is being rejected…" />
              <div className="flex gap-3">
                <button onClick={() => setShowRejectForm(false)} className="btn-outline flex-1 text-sm">Cancel</button>
                <button onClick={() => reject.mutate(rejectReason)} disabled={reject.isPending || !rejectReason.trim()}
                  className="btn-outline flex-1 text-sm border-red-300 text-red-600 hover:bg-red-50">
                  {reject.isPending ? 'Rejecting…' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => approve.mutate()} disabled={approve.isPending}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                <CheckCircleIcon className="h-5 w-5" />
                {approve.isPending ? 'Approving…' : 'Approve Owner'}
              </button>
              <button onClick={() => setShowRejectForm(true)} disabled={reject.isPending}
                className="btn-outline flex-1 border-red-300 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2">
                <XCircleIcon className="h-5 w-5" /> Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
