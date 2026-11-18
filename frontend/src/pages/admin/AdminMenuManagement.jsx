import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon,
  SparklesIcon, CurrencyRupeeIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';

function fmt(n) { return Number(n || 0).toLocaleString('en-IN'); }

const VEG_DOT = ({ isVeg }) => (
  <span className={`inline-flex w-3.5 h-3.5 rounded-sm border-2 items-center justify-center flex-shrink-0 ${isVeg ? 'border-green-600' : 'border-red-500'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-500'}`} />
  </span>
);

const STATUS_BADGE = ({ active }) => (
  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
    {active ? 'Active' : 'Inactive'}
  </span>
);

const MENU_TYPES = ['MANDAP', 'RESORT', 'BOTH'];
const PACKAGE_TYPES = {
  MANDAP: ['WEDDING', 'RECEPTION', 'ENGAGEMENT'],
  RESORT: ['BREAKFAST', 'LUNCH', 'DINNER', 'PARTY'],
  BOTH:   ['WEDDING', 'RECEPTION', 'ENGAGEMENT', 'BREAKFAST', 'LUNCH', 'DINNER', 'PARTY'],
};

// â”€â”€â”€ Item form modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ItemFormModal({ item, categories, onClose, onSave }) {
  const [form, setForm] = useState({
    categoryId: item?.categoryId || (categories[0]?.id || ''),
    name: item?.name || '',
    description: item?.description || '',
    pricePerPlate: item?.pricePerPlate || '',
    isVeg: item?.isVeg !== false,
    menuType: item?.menuType || 'BOTH',
    isActive: item?.isActive !== false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.pricePerPlate) return toast.error('Name and price are required');
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-display font-semibold text-gray-900">{item ? 'Edit Item' : 'Add Menu Item'}</h3>
          <button onClick={onClose}><XMarkIcon className="h-5 w-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label-sm">Category</label>
            <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              className="input-field">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-sm">Item Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input-field" placeholder="e.g. Paneer Tikka" required />
          </div>
          <div>
            <label className="label-sm">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="input-field" rows={2} placeholder="Short description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm">Price per Plate (₹) *</label>
              <input type="number" min={0} value={form.pricePerPlate}
                onChange={e => setForm(f => ({ ...f, pricePerPlate: e.target.value }))}
                className="input-field" required />
            </div>
            <div>
              <label className="label-sm">Menu Type</label>
              <select value={form.menuType} onChange={e => setForm(f => ({ ...f, menuType: e.target.value }))}
                className="input-field">
                {MENU_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isVeg}
                onChange={e => setForm(f => ({ ...f, isVeg: e.target.checked }))}
                className="w-4 h-4 accent-green-600" />
              <span className="text-sm text-gray-700">Vegetarian</span>
            </label>
            {item && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-forest-700" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary">
              {saving ? 'Saving...' : item ? 'Update' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// â”€â”€â”€ Package form modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PackageFormModal({ pkg, onClose, onSave }) {
  const [form, setForm] = useState({
    name: pkg?.name || '',
    description: pkg?.description || '',
    packageType: pkg?.packageType || 'WEDDING',
    menuType: pkg?.menuType || 'MANDAP',
    isVeg: pkg?.isVeg !== false,
    pricePerPlate: pkg?.pricePerPlate || '',
    isActive: pkg?.isActive !== false,
  });
  const [saving, setSaving] = useState(false);

  const pkgTypes = PACKAGE_TYPES[form.menuType] || PACKAGE_TYPES.BOTH;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.pricePerPlate) return toast.error('Name and price are required');
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-display font-semibold text-gray-900">{pkg ? 'Edit Package' : 'Add Package'}</h3>
          <button onClick={onClose}><XMarkIcon className="h-5 w-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label-sm">Package Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input-field" placeholder="e.g. Wedding Package â€“ Veg" required />
          </div>
          <div>
            <label className="label-sm">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="input-field" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm">Menu Type</label>
              <select value={form.menuType} onChange={e => setForm(f => ({ ...f, menuType: e.target.value, packageType: PACKAGE_TYPES[e.target.value][0] }))}
                className="input-field">
                {MENU_TYPES.filter(t => t !== 'BOTH').map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label-sm">Package Type</label>
              <select value={form.packageType} onChange={e => setForm(f => ({ ...f, packageType: e.target.value }))}
                className="input-field">
                {pkgTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label-sm">Price per Plate (₹) *</label>
            <input type="number" min={0} value={form.pricePerPlate}
              onChange={e => setForm(f => ({ ...f, pricePerPlate: e.target.value }))}
              className="input-field" required />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isVeg}
                onChange={e => setForm(f => ({ ...f, isVeg: e.target.checked }))}
                className="w-4 h-4 accent-green-600" />
              <span className="text-sm text-gray-700">Vegetarian</span>
            </label>
            {pkg && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-forest-700" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary">
              {saving ? 'Saving...' : pkg ? 'Update' : 'Add Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// â”€â”€â”€ Main admin page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AdminMenuManagement() {
  const [tab, setTab] = useState('items');
  const [itemModal, setItemModal] = useState(null);     // null | 'new' | item obj
  const [pkgModal, setPkgModal]   = useState(null);
  const [filterType, setFilterType] = useState('');
  const qc = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-menu-categories'],
    queryFn: () => api.get('/menus/admin/categories').then(r => r.data),
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['admin-menu-items', filterType],
    queryFn: () => api.get('/menus/admin/items', { params: { menuType: filterType || undefined, limit: 100 } }).then(r => r.data.items),
  });

  const { data: packages = [], isLoading: pkgsLoading } = useQuery({
    queryKey: ['admin-menu-packages'],
    queryFn: () => api.get('/menus/admin/packages').then(r => r.data),
  });

  const { data: selectionsData } = useQuery({
    queryKey: ['admin-menu-selections'],
    queryFn: () => api.get('/menus/admin/selections').then(r => r.data),
    enabled: tab === 'selections',
  });

  const createItem = useMutation({
    mutationFn: (data) => api.post('/menus/admin/items', data),
    onSuccess: () => { toast.success('Item added'); qc.invalidateQueries(['admin-menu-items']); setItemModal(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const updateItem = useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/menus/admin/items/${id}`, data),
    onSuccess: () => { toast.success('Item updated'); qc.invalidateQueries(['admin-menu-items']); setItemModal(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteItem = useMutation({
    mutationFn: (id) => api.delete(`/menus/admin/items/${id}`),
    onSuccess: () => { toast.success('Item deactivated'); qc.invalidateQueries(['admin-menu-items']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const createPkg = useMutation({
    mutationFn: (data) => api.post('/menus/admin/packages', data),
    onSuccess: () => { toast.success('Package added'); qc.invalidateQueries(['admin-menu-packages']); setPkgModal(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const updatePkg = useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/menus/admin/packages/${id}`, data),
    onSuccess: () => { toast.success('Package updated'); qc.invalidateQueries(['admin-menu-packages']); setPkgModal(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deletePkg = useMutation({
    mutationFn: (id) => api.delete(`/menus/admin/packages/${id}`),
    onSuccess: () => { toast.success('Package deactivated'); qc.invalidateQueries(['admin-menu-packages']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const TABS = [
    { key: 'items', label: `Menu Items (${items.length})` },
    { key: 'packages', label: `Packages (${packages.length})` },
    { key: 'categories', label: `Categories (${categories.length})` },
    { key: 'selections', label: `Customer Selections` },
  ];

  return (
    <div className="w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Menu Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage food menu items, packages and customer selections</p>
        </div>
        {tab === 'items' && (
          <button onClick={() => setItemModal('new')} className="btn-primary flex items-center gap-2 text-sm">
            <PlusIcon className="h-4 w-4" /> Add Item
          </button>
        )}
        {tab === 'packages' && (
          <button onClick={() => setPkgModal('new')} className="btn-primary flex items-center gap-2 text-sm">
            <PlusIcon className="h-4 w-4" /> Add Package
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === t.key ? 'bg-white shadow-sm text-forest-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* â”€â”€ Items tab â”€â”€ */}
      {tab === 'items' && (
        <div className="card overflow-hidden">
          {/* Filter bar */}
          <div className="p-4 border-b border-gray-100 flex gap-2 flex-wrap">
            {['', 'MANDAP', 'RESORT', 'BOTH'].map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${filterType === t ? 'bg-forest-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {t || 'All Types'}
              </button>
            ))}
          </div>

          {itemsLoading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-right">Price/Plate</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <VEG_DOT isVeg={item.isVeg} />
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            {item.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{item.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{item.category?.name}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.menuType}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">₹{fmt(item.pricePerPlate)}</td>
                      <td className="px-4 py-3"><STATUS_BADGE active={item.isActive} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setItemModal(item)} className="p-1.5 text-gray-400 hover:text-forest-700 transition-colors">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button onClick={() => { if (window.confirm('Deactivate this item?')) deleteItem.mutate(item.id); }}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">No items found</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* â”€â”€ Packages tab â”€â”€ */}
      {tab === 'packages' && (
        <div className="card overflow-hidden">
          {pkgsLoading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Package</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Menu</th>
                    <th className="px-4 py-3 text-right">Price/Plate</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {packages.map(pkg => (
                    <tr key={pkg.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <VEG_DOT isVeg={pkg.isVeg} />
                          <div>
                            <p className="font-medium text-gray-900">{pkg.name}</p>
                            {pkg.description && <p className="text-xs text-gray-400 truncate max-w-[220px]">{pkg.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{pkg.packageType}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{pkg.menuType}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">₹{fmt(pkg.pricePerPlate)}</td>
                      <td className="px-4 py-3"><STATUS_BADGE active={pkg.isActive} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setPkgModal(pkg)} className="p-1.5 text-gray-400 hover:text-forest-700 transition-colors">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button onClick={() => { if (window.confirm('Deactivate this package?')) deletePkg.mutate(pkg.id); }}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {packages.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">No packages found</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* â”€â”€ Categories tab â”€â”€ */}
      {tab === 'categories' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Sort Order</th>
                  <th className="px-4 py-3 text-left">Items</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                    <td className="px-4 py-3 text-gray-500">{cat.sortOrder}</td>
                    <td className="px-4 py-3 text-gray-500">{cat._count?.items || 0} items</td>
                    <td className="px-4 py-3"><STATUS_BADGE active={cat.isActive} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* â”€â”€ Customer Selections tab â”€â”€ */}
      {tab === 'selections' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Booking</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Meal</th>
                  <th className="px-4 py-3 text-left">Guests</th>
                  <th className="px-4 py-3 text-right">Total Cost</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(selectionsData?.selections || []).map(sel => (
                  <tr key={sel.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                      {sel.bookingId ? `Mandap #${sel.bookingId.slice(-8).toUpperCase()}` : `Room #${sel.roomBookingId?.slice(-8).toUpperCase()}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sel.bookingId ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {sel.bookingId ? 'Mandap' : 'Resort Room'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${sel.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-xs text-gray-600">{sel.isVeg ? 'Veg' : 'Non-Veg'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{sel.guestCount}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">₹{fmt(sel.totalCost)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(sel.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(selectionsData?.selections || []).length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">No menu selections yet</div>
            )}
          </div>
        </div>
      )}

      {/* Item modal */}
      {itemModal && (
        <ItemFormModal
          item={itemModal === 'new' ? null : itemModal}
          categories={categories}
          onClose={() => setItemModal(null)}
          onSave={async (data) => {
            if (itemModal === 'new') await createItem.mutateAsync(data);
            else await updateItem.mutateAsync({ id: itemModal.id, ...data });
          }}
        />
      )}

      {/* Package modal */}
      {pkgModal && (
        <PackageFormModal
          pkg={pkgModal === 'new' ? null : pkgModal}
          onClose={() => setPkgModal(null)}
          onSave={async (data) => {
            if (pkgModal === 'new') await createPkg.mutateAsync(data);
            else await updatePkg.mutateAsync({ id: pkgModal.id, ...data });
          }}
        />
      )}
    </div>
  );
}

