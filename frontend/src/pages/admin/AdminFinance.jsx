import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import { CurrencyRupeeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminFinance() {
  const [newRate, setNewRate] = useState('');
  const qc = useQueryClient();
  const year = new Date().getFullYear();

  const { data: finance } = useQuery({
    queryKey: ['admin-finance'],
    queryFn: () => api.get('/admin/finance/dashboard').then(r => r.data),
  });

  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['admin-revenue', year],
    queryFn: () => api.get('/admin/reports/revenue', { params: { year } }).then(r => r.data),
  });

  const updateRate = useMutation({
    mutationFn: () => api.put('/admin/platform-config/commission', { rate: Number(newRate) }),
    onSuccess: () => { toast.success('Commission rate updated'); setNewRate(''); qc.invalidateQueries(['admin-finance']); },
    onError: () => toast.error('Update failed'),
  });

  const chartData = (revenueData?.monthly || []).map(m => ({
    month: MONTHS[m.month - 1], revenue: m.revenue,
  }));

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div>
        <h1 className="section-title">Finance Dashboard</h1>
        <p className="section-subtitle">Platform revenue and commission overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Booking Value" value={finance?.totalRevenue ? `₹${Number(finance.totalRevenue).toLocaleString('en-IN')}` : '₹0'} icon={CurrencyRupeeIcon} color="forest" />
        <StatCard label="Pending Commissions" value={finance?.pendingCommissions ? `₹${Number(finance.pendingCommissions).toLocaleString('en-IN')}` : '₹0'} icon={CurrencyRupeeIcon} color="gold" />
        <StatCard label="Settled Commissions" value={finance?.paidCommissions ? `₹${Number(finance.paidCommissions).toLocaleString('en-IN')}` : '₹0'} icon={CurrencyRupeeIcon} color="green" />
      </div>

      {/* Revenue chart */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-gray-900 mb-5">Monthly Revenue ({year})</h2>
        {isLoading ? <LoadingSpinner /> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="revenue" fill="#2D5016" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Commission settings */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-gray-900 mb-4">Commission Settings</h2>
        <div className="flex flex-wrap gap-3 items-end max-w-xs">
          <div className="flex-1">
            <label className="label">Platform Commission (%)</label>
            <input type="number" value={newRate} onChange={e => setNewRate(e.target.value)} min={0} max={50} step={0.5}
              placeholder="e.g. 10" className="input" />
          </div>
          <button onClick={() => updateRate.mutate()} disabled={!newRate || updateRate.isPending} className="btn-primary">
            {updateRate.isPending ? 'Saving…' : 'Update'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Applied to all new payments after save.</p>
      </div>
    </div>
  );
}
