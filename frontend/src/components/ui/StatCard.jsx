export default function StatCard({ label, value, icon: Icon, color = 'forest', sub }) {
  const colorMap = {
    forest: 'bg-forest-50 text-forest-600',
    gold: 'bg-gold-50 text-gold-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {Icon && (
          <div className={`p-2 rounded-xl ${colorMap[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 font-display">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
