import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  StarIcon as StarSolid,
} from '@heroicons/react/24/solid';
import {
  MagnifyingGlassIcon, EyeIcon, EyeSlashIcon,
  TrashIcon, ArrowPathIcon, ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

// ─── star row ─────────────────────────────────────────────────────────────────

function Stars({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <StarSolid key={i} className={`h-3.5 w-3.5 ${i <= rating ? 'text-[#D6AD45]' : 'text-gray-200'}`} />
      ))}
    </span>
  );
}

// ─── stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }) {
  const cls = {
    gold:   'bg-[#D6AD45]/10 border-[#D6AD45]/20 text-[#b8942d]',
    green:  'bg-green-50 border-green-100 text-green-700',
    blue:   'bg-blue-50 border-blue-100 text-blue-600',
    gray:   'bg-gray-50 border-gray-200 text-gray-600',
  }[color] || 'bg-gray-50 border-gray-200 text-gray-600';

  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">{label}</p>
      <p className="text-2xl font-bold font-display">{value ?? '—'}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function AdminReviews() {
  const qc = useQueryClient();
  const [search, setSearch]     = useState('');
  const [rating, setRating]     = useState('');
  const [published, setPublished] = useState('');
  const [page, setPage]         = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', search, rating, published, page],
    queryFn: () => api.get('/admin/reviews', {
      params: {
        search:    search    || undefined,
        rating:    rating    || undefined,
        published: published || undefined,
        page,
        limit: 20,
      },
    }).then(r => r.data),
    keepPreviousData: true,
  });

  const toggleMut = useMutation({
    mutationFn: (id) => api.put(`/admin/reviews/${id}/toggle`),
    onSuccess: (_, id) => {
      toast.success('Review visibility updated');
      qc.invalidateQueries(['admin-reviews']);
    },
    onError: () => toast.error('Update failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/admin/reviews/${id}`),
    onSuccess: () => { toast.success('Review deleted'); qc.invalidateQueries(['admin-reviews']); },
    onError: () => toast.error('Delete failed'),
  });

  const totalPages  = Math.ceil((data?.total || 0) / 20);
  const publishedCount   = data?.reviews?.filter(r => r.isPublished).length ?? 0;
  const hiddenCount      = data?.reviews?.filter(r => !r.isPublished).length ?? 0;

  const ratingDist = [5, 4, 3, 2, 1].map(r => ({
    r,
    count: data?.reviews?.filter(rv => rv.rating === r).length ?? 0,
  }));

  return (
    <div className="w-full max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Reviews &amp; Feedback</h1>
        <p className="text-sm text-gray-500 mt-1">All customer reviews across mandaps, resorts and rooms</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Reviews"   value={data?.total ?? 0}                                       color="blue" />
        <StatCard label="Avg Rating"      value={data?.avgRating ? `${Number(data.avgRating).toFixed(1)} ★` : '—'} color="gold" />
        <StatCard label="Published"       value={data?.total ? (data.reviews || []).filter(r => r.isPublished).length : 0} sub="visible to customers" color="green" />
        <StatCard label="Hidden"          value={data?.total ? (data.reviews || []).filter(r => !r.isPublished).length : 0} sub="hidden from site"      color="gray" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search reviews, properties, customers…"
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-[#142B0A]/20"
          />
        </div>

        <select value={rating} onChange={e => { setRating(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#142B0A]/20">
          <option value="">All Ratings</option>
          {[5, 4, 3, 2, 1].map(r => (
            <option key={r} value={r}>{'★'.repeat(r)} ({r} star)</option>
          ))}
        </select>

        <select value={published} onChange={e => { setPublished(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#142B0A]/20">
          <option value="">All Visibility</option>
          <option value="true">Published</option>
          <option value="false">Hidden</option>
        </select>

        {(search || rating || published) && (
          <button onClick={() => { setSearch(''); setRating(''); setPublished(''); setPage(1); }}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors">
            Clear filters
          </button>
        )}

        <span className="ml-auto text-sm text-gray-400">{data?.total ?? 0} reviews</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center">
            <ArrowPathIcon className="h-6 w-6 text-gray-300 animate-spin" />
          </div>
        ) : !data?.reviews?.length ? (
          <div className="py-20 flex flex-col items-center gap-3 text-center">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-200" />
            <p className="font-medium text-gray-500">No reviews found</p>
            <p className="text-xs text-gray-400">Customer reviews will appear here after bookings are completed</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Property', 'Customer', 'Rating', 'Comment', 'Date', 'Status', 'Actions'].map(h => (
                      <th key={h} className={`px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.reviews.map(review => (
                    <tr key={review.id} className={`border-b border-gray-100 hover:bg-gray-50/60 transition-colors ${!review.isPublished ? 'opacity-60' : ''}`}>
                      {/* Property */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 text-sm truncate max-w-[160px]">{review.property?.name}</p>
                        <p className="text-xs text-gray-400">{review.property?.propertyType?.replace('_', ' ')}</p>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700 truncate max-w-[130px]">{review.customer?.fullName || '—'}</p>
                        <p className="text-xs text-gray-400 truncate">{review.customer?.user?.phone || review.customer?.user?.email}</p>
                      </td>

                      {/* Rating */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <Stars rating={review.rating} />
                          <span className="text-xs text-gray-500">{review.rating}/5</span>
                        </div>
                      </td>

                      {/* Comment */}
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600 line-clamp-2 max-w-[220px]">
                          {review.comment || <span className="text-gray-400 italic">No comment</span>}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(review.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          review.isPublished
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          {review.isPublished ? 'Published' : 'Hidden'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => toggleMut.mutate(review.id)}
                            disabled={toggleMut.isPending}
                            title={review.isPublished ? 'Hide review' : 'Publish review'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              review.isPublished
                                ? 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {review.isPublished ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this review permanently?')) deleteMut.mutate(review.id);
                            }}
                            disabled={deleteMut.isPending}
                            title="Delete review"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer / pagination */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4 text-xs text-gray-500 flex-wrap">
              <span>Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total} reviews</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-[#142B0A] hover:text-[#142B0A] disabled:opacity-30 transition-all">
                    ‹ Prev
                  </button>
                  <span className="px-3">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-[#142B0A] hover:text-[#142B0A] disabled:opacity-30 transition-all">
                    Next ›
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Rating distribution */}
      {data?.reviews?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Rating Distribution (current page)</h3>
          <div className="space-y-2">
            {ratingDist.map(({ r, count }) => {
              const pct = data.reviews.length ? Math.round((count / data.reviews.length) * 100) : 0;
              return (
                <div key={r} className="flex items-center gap-3 text-sm">
                  <span className="w-10 text-right text-gray-500">{r} ★</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full bg-[#D6AD45] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-gray-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
