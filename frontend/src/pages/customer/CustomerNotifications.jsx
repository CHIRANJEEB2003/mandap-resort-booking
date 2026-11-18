import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { BellIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

export default function CustomerNotifications() {
  const qc = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/customer/notifications').then(r => r.data),
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.put('/customer/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });

  if (isLoading) return <LoadingSpinner />;

  const unread = notifications?.filter(n => !n.isRead).length || 0;

  // ── Empty state: full-area centered layout ──────────────────────────────────
  if (!notifications?.length) {
    return (
      <>
        <style>{`
          @keyframes bellRing {
            0%, 55%, 100% { transform: rotate(0deg); }
            5%  { transform: rotate(16deg); }
            15% { transform: rotate(-13deg); }
            25% { transform: rotate(10deg); }
            35% { transform: rotate(-7deg); }
            45% { transform: rotate(4deg); }
          }
        `}</style>
        <div
          className="flex flex-col items-center justify-center text-center px-6"
          style={{ minHeight: 'calc(100vh - 8rem)' }}
        >
          <div style={{ animation: 'bellRing 3.5s ease-in-out infinite', display: 'inline-block', marginBottom: 28 }}>
            <BellIcon className="h-28 w-28 text-gray-300" strokeWidth={0.9} />
          </div>
          <h3 className="text-2xl font-display font-semibold text-gray-700 mb-3">No Notifications</h3>
          <p className="text-sm text-gray-400 max-w-xs">You're all caught up!</p>
        </div>
      </>
    );
  }

  // ── Notification list ───────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Notifications</h1>
          {unread > 0 && <p className="section-subtitle">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button onClick={() => readAllMutation.mutate()} className="text-sm text-forest-600 font-medium hover:underline">
            Mark all read
          </button>
        )}
      </div>
      <div className="space-y-2">
        {notifications.map(n => (
          <div key={n.id}
            className={`card p-4 flex items-start gap-3 ${!n.isRead ? 'border-l-4 border-l-forest-500' : ''}`}>
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.isRead ? 'bg-gray-200' : 'bg-forest-500'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{n.title}</p>
              <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>
              <p className="text-xs text-gray-400 mt-1">
                {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : '—'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
