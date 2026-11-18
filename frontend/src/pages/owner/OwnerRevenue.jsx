import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function OwnerRevenue() {
  const year = new Date().getFullYear();

  const { data, isLoading } = useQuery({
    queryKey: ['owner-revenue', year],
    queryFn: () => api.get('/owner/revenue', { params: { year } }).then(r => r.data),
  });

  const chartData = (data?.monthly || []).map(m => ({
    month: MONTHS[m.month - 1],
    revenue: m.revenue,
  }));

  const totalRevenue = chartData.reduce((s, m) => s + m.revenue, 0);
  const maxMonth = chartData.reduce((a, b) => a.revenue > b.revenue ? a : b, { month: '—', revenue: 0 });

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div>
        <h1 className="section-title">Revenue Report</h1>
        <p className="section-subtitle">Monthly revenue breakdown for {year}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Total Revenue ({year})</p>
          <p className="text-3xl font-display font-bold text-forest-700">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Best Month</p>
          <p className="text-3xl font-display font-bold text-gold-600">{maxMonth.month}</p>
          <p className="text-xs text-gray-500 mt-0.5">₹{maxMonth.revenue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display font-semibold text-gray-900 mb-5">Monthly Revenue</h2>
        {isLoading ? <LoadingSpinner /> : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="revenue" fill="#2D5016" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
