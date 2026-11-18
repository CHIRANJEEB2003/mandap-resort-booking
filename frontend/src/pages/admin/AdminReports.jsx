import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const COLORS = { CONFIRMED: '#2D5016', ENQUIRY: '#E8B84B', PENDING_PAYMENT: '#3B82F6', CANCELLED: '#EF4444', COMPLETED: '#6B7280' };
const STATUS_LABELS = { CONFIRMED: 'Confirmed', ENQUIRY: 'Enquiry', PENDING_PAYMENT: 'Pending Payment', CANCELLED: 'Cancelled', COMPLETED: 'Completed' };

export default function AdminReports() {
  const year = new Date().getFullYear();

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['admin-bookings-report', year],
    queryFn: () => api.get('/admin/reports/bookings', { params: { year } }).then(r => r.data),
  });

  const chartData = (bookingsData || []).map(b => ({
    name: STATUS_LABELS[b.status] || b.status,
    value: b._count,
    color: COLORS[b.status] || '#6B7280',
  }));

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div>
        <h1 className="section-title">Reports</h1>
        <p className="section-subtitle">Platform analytics for {year}</p>
      </div>

      <div className="card p-6">
        <h2 className="font-display font-semibold text-gray-900 mb-5">Bookings by Status</h2>
        {isLoading ? <LoadingSpinner /> : (
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ResponsiveContainer width={240} height={240}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  dataKey="value" paddingAngle={3}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Bookings']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {chartData.map(item => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
