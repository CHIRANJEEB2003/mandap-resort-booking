import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { fmtDate } from '../../utils/date';

export default function OwnerVerification() {
  const { data: owners, isLoading } = useQuery({
    queryKey: ['admin-pending-owners'],
    queryFn: () => api.get('/admin/owners/pending').then(r => r.data),
  });

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div>
        <h1 className="section-title">Owner Verification Queue</h1>
        <p className="section-subtitle">Review and verify property owner applications</p>
      </div>

      {isLoading ? <LoadingSpinner /> : !owners?.length ? (
        <EmptyState icon="✅" title="Queue is empty" description="No pending owner verification requests." />
      ) : (
        <div className="space-y-3">
          {owners.map(o => (
            <Link key={o.id} to={`/admin/owners/verify/${o.id}`}
              className="card p-5 flex flex-col md:flex-row md:items-center gap-4 hover:shadow-card-hover transition-all block">
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center text-gold-700 font-bold flex-shrink-0">
                    {o.fullName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{o.businessName}</p>
                    <p className="text-sm text-gray-500">{o.fullName} · {o.user?.phone}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Applied: {fmtDate(o.createdAt)} · {o.documents?.length || 0} document{o.documents?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
              <span className="badge-yellow self-start md:self-center">Pending</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
