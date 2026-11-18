import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { SparklesIcon, CameraIcon, StarIcon } from '@heroicons/react/24/outline';

const CEREMONY_BADGE = {
  MEHENDI: 'bg-orange-100 text-orange-700',
  HALDI: 'bg-yellow-100 text-yellow-700',
  MARRIAGE: 'bg-rose-100 text-rose-700',
  RECEPTION: 'bg-purple-100 text-purple-700',
  COMPLETE: 'bg-forest-100 text-forest-700',
};
const CEREMONY_LABEL = { MEHENDI: 'Mehendi', HALDI: 'Haldi', MARRIAGE: 'Marriage', RECEPTION: 'Reception', COMPLETE: 'Complete' };
const CEREMONY_TYPES = ['ALL', 'MEHENDI', 'HALDI', 'MARRIAGE', 'RECEPTION', 'COMPLETE'];

function fmt(n) { return Number(n).toLocaleString('en-IN'); }

function SummaryCard({ label, value, icon: Icon, color }) {
  const cls = { green: 'bg-green-50 text-green-700 border-green-100', gold: 'bg-[#D6AD45]/10 text-[#b8942d] border-[#D6AD45]/20', forest: 'bg-[#1E3B0E]/8 text-[#1E3B0E] border-[#1E3B0E]/10', blue: 'bg-blue-50 text-blue-600 border-blue-100' };
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${cls[color] || cls.forest}`}>
      <div className="p-2 rounded-lg bg-white/60"><Icon className="h-5 w-5" /></div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
        <p className="text-2xl font-display font-bold">{value ?? '—'}</p>
      </div>
    </div>
  );
}

export default function AdminWeddingPackages() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('packages');
  const [ceremonyFilter, setCeremonyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: overview } = useQuery({
    queryKey: ['admin-wedding-overview'],
    queryFn: () => api.get('/wedding/admin/overview').then(r => r.data),
  });

  const { data: packagesData } = useQuery({
    queryKey: ['admin-wedding-packages', ceremonyFilter, statusFilter],
    queryFn: () => api.get('/wedding/admin/packages', {
      params: {
        ceremonyType: ceremonyFilter !== 'ALL' ? ceremonyFilter : undefined,
        isActive: statusFilter || undefined,
      },
    }).then(r => r.data),
    enabled: activeTab === 'packages',
  });

  const { data: photoServices = [] } = useQuery({
    queryKey: ['admin-photography'],
    queryFn: () => api.get('/wedding/admin/photography').then(r => r.data),
    enabled: activeTab === 'photography',
  });

  const { data: decorServices = [] } = useQuery({
    queryKey: ['admin-decoration'],
    queryFn: () => api.get('/wedding/admin/decoration').then(r => r.data),
    enabled: activeTab === 'decoration',
  });

  const togglePkg = useMutation({
    mutationFn: ({ id, isActive }) => api.put(`/wedding/admin/packages/${id}/toggle`, { isActive }).then(r => r.data),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries(['admin-wedding-packages']); },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  });

  const packages = packagesData?.packages || [];

  const TABS = [
    { key: 'packages', label: 'Wedding Packages', icon: SparklesIcon },
    { key: 'photography', label: 'Photography', icon: CameraIcon },
    { key: 'decoration', label: 'Decoration', icon: StarIcon },
  ];

  return (
    <div className="w-full max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="section-title">Wedding Packages Management</h1>
        <p className="section-subtitle">View and manage all wedding packages, photography, and decoration services</p>
      </div>

      {/* Overview */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label="Total Packages"  value={overview.totalWeddingPkgs}  icon={SparklesIcon} color="forest" />
          <SummaryCard label="Active Packages" value={overview.activeWeddingPkgs} icon={SparklesIcon} color="green" />
          <SummaryCard label="Photography Svcs" value={overview.totalPhotography} icon={CameraIcon}   color="blue" />
          <SummaryCard label="Decoration Svcs" value={overview.totalDecoration}   icon={StarIcon}     color="gold" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key ? 'border-forest-600 text-forest-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-1 flex-wrap">
              {CEREMONY_TYPES.map(t => (
                <button key={t} onClick={() => setCeremonyFilter(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${ceremonyFilter === t ? 'bg-forest-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {t === 'ALL' ? 'All' : CEREMONY_LABEL[t] || t}
                </button>
              ))}
            </div>
            <select className="input w-40 ml-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {packages.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No wedding packages found.</div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Package', 'Ceremony', 'Venue', 'Owner', 'Price', 'Guests', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {packages.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">{p.name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CEREMONY_BADGE[p.ceremonyType] || 'bg-gray-100 text-gray-600'}`}>
                            {CEREMONY_LABEL[p.ceremonyType] || p.ceremonyType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{p.property?.name}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{p.property?.owner?.businessName || p.property?.owner?.fullName || '—'}</td>
                        <td className="px-4 py-3 text-forest-700 font-semibold">₹{fmt(p.startingPrice)}</td>
                        <td className="px-4 py-3 text-gray-600">{p.guestCapacity}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {p.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => togglePkg.mutate({ id: p.id, isActive: !p.isActive })}
                            className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${p.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                          >
                            {p.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Photography Tab */}
      {activeTab === 'photography' && (
        <div>
          {photoServices.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No photography services found.</div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Service Name', 'Type', 'Venue', 'Price', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {photoServices.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                        <td className="px-4 py-3"><span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">{s.serviceType}</span></td>
                        <td className="px-4 py-3 text-gray-600">{s.property?.name || '—'}</td>
                        <td className="px-4 py-3 text-forest-700 font-semibold">₹{fmt(s.price)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {s.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Decoration Tab */}
      {activeTab === 'decoration' && (
        <div>
          {decorServices.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No decoration services found.</div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Service Name', 'Type', 'Venue', 'Price', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {decorServices.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                        <td className="px-4 py-3"><span className="text-xs bg-pink-100 text-pink-700 font-semibold px-2 py-0.5 rounded-full">{s.serviceType}</span></td>
                        <td className="px-4 py-3 text-gray-600">{s.property?.name || '—'}</td>
                        <td className="px-4 py-3 text-forest-700 font-semibold">₹{fmt(s.price)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {s.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
