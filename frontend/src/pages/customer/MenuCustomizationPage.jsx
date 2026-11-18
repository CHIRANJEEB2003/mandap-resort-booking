import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon, SparklesIcon, UsersIcon, CurrencyRupeeIcon,
  ArrowLeftIcon, ShoppingCartIcon, CheckIcon, XMarkIcon,
  ArchiveBoxIcon, PencilSquareIcon, ExclamationTriangleIcon, UserCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import api from '../../services/api';

const VEG_DOT = ({ isVeg }) => (
  <span
    className={`inline-flex w-4 h-4 rounded-sm border-2 items-center justify-center flex-shrink-0
      ${isVeg ? 'border-green-600' : 'border-red-600'}`}
    title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
  >
    <span className={`w-2 h-2 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
  </span>
);

function fmt(n) { return Number(n || 0).toLocaleString('en-IN'); }

const PKG_TYPE_LABEL = {
  WEDDING: 'Wedding', RECEPTION: 'Reception', ENGAGEMENT: 'Engagement',
  BREAKFAST: 'Breakfast', LUNCH: 'Lunch', DINNER: 'Dinner', PARTY: 'Party & Celebration',
};

function PackageDetailModal({ pkg, allItems, categories, guestCount, selectedPkg, onSelect, onClose }) {
  if (!pkg) return null;

  const pkgItemSet = new Set(pkg.itemIds || []);
  const pkgItems   = allItems.filter(i => pkgItemSet.has(i.id));
  const isSelected = selectedPkg === pkg.id;

  // group items by category
  const byCat = {};
  pkgItems.forEach(item => {
    if (!byCat[item.categoryId]) byCat[item.categoryId] = [];
    byCat[item.categoryId].push(item);
  });

  const totalCost = parseFloat(pkg.pricePerPlate) * guestCount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="bg-[#142B0A] px-5 py-4 flex items-start gap-3 flex-shrink-0 rounded-t-2xl">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <VEG_DOT isVeg={pkg.isVeg} />
              <span className="text-[11px] bg-[#D6AD45]/25 text-[#D6AD45] px-2 py-0.5 rounded-full font-semibold tracking-wide">
                {PKG_TYPE_LABEL[pkg.packageType] || pkg.packageType}
              </span>
            </div>
            <h2 className="text-white font-bold text-base leading-tight">{pkg.name}</h2>
            {pkg.description && (
              <p className="text-white/55 text-xs mt-1 leading-relaxed">{pkg.description}</p>
            )}
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1 flex-shrink-0 transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Pricing strip */}
        <div className="flex border-b border-gray-100 flex-shrink-0 bg-[#f9f7f2]">
          <div className="flex-1 px-4 py-2.5 text-center border-r border-gray-200">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Per Plate</p>
            <p className="font-bold text-[#1E3B0E] text-sm mt-0.5">₹{fmt(pkg.pricePerPlate)}</p>
          </div>
          <div className="flex-1 px-4 py-2.5 text-center border-r border-gray-200">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Guests</p>
            <p className="font-bold text-[#1E3B0E] text-sm mt-0.5">{guestCount}</p>
          </div>
          <div className="flex-1 px-4 py-2.5 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Est. Total</p>
            <p className="font-bold text-[#D6AD45] text-sm mt-0.5">₹{fmt(totalCost)}</p>
          </div>
        </div>

        {/* Items — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Included Menu Items</p>
          {pkgItems.length === 0 ? (
            <div className="text-center py-8">
              <SparklesIcon className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No items have been added to this package yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map(cat => {
                const catItems = byCat[cat.id] || [];
                if (catItems.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{cat.name}</p>
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-[10px] text-gray-400">{catItems.length} item{catItems.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                      {catItems.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2.5 px-3 py-2.5 ${idx < catItems.length - 1 ? 'border-b border-gray-100' : ''}`}
                        >
                          <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <VEG_DOT isVeg={item.isVeg} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800">{item.name}</p>
                            {item.description && (
                              <p className="text-[11px] text-gray-400 truncate">{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          {isSelected ? (
            <div className="flex gap-2">
              <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-50 border-2 border-green-500 text-green-700 font-bold text-sm">
                <CheckCircleSolid className="h-4 w-4" />
                Package Selected
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-medium hover:border-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <button
              onClick={() => { onSelect(pkg.id); onClose(); }}
              className="w-full py-2.5 rounded-xl font-bold text-sm bg-[#D6AD45] hover:bg-[#c09930] text-[#142B0A] transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <CheckCircleIcon className="h-4 w-4" />
              Select This Package
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MenuCustomizationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const bookingId     = searchParams.get('bookingId');
  const roomBookingId = searchParams.get('roomBookingId');
  const bookingType   = bookingId ? 'mandap' : 'resort';

  const [mealType, setMealType]   = useState('VEG');
  const [mode, setMode]           = useState('package'); // 'package' | 'custom'
  const [selectedPkg, setSelPkg]  = useState(null);
  const [selectedItems, setItems] = useState({});   // { itemId: true }
  const [guestCount, setGuests]   = useState(100);
  const [notes, setNotes]         = useState('');
  const [saved, setSaved]         = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [viewPkg, setViewPkg]     = useState(null); // package object shown in detail modal

  // -- Data fetches --
  const { data: categories = [] } = useQuery({
    queryKey: ['menu-categories', mealType],
    queryFn: () => api.get('/menus/categories', { params: { isVeg: mealType === 'VEG' } }).then(r => r.data),
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => api.get('/menus/items').then(r => r.data),
  });

  const { data: allPackages = [] } = useQuery({
    queryKey: ['menu-packages'],
    queryFn: () => api.get('/menus/packages').then(r => r.data),
  });

  // Existing selection
  const { data: existing } = useQuery({
    queryKey: ['menu-selection', bookingId, roomBookingId],
    queryFn: () => {
      const q = bookingId ? `bookingId=${bookingId}` : `roomBookingId=${roomBookingId}`;
      return api.get(`/menus/selection?${q}`).then(r => r.data).catch(() => null);
    },
    enabled: !!(bookingId || roomBookingId),
  });

  // Pre-fill from existing selection
  useEffect(() => {
    if (!existing) return;
    setMealType(existing.isVeg ? 'VEG' : 'NON_VEG');
    setGuests(existing.guestCount);
    setNotes(existing.notes || '');
    if (existing.packageId) {
      setMode('package');
      setSelPkg(existing.packageId);
    } else {
      setMode('custom');
      const map = {};
      (existing.selectedItems || []).forEach(id => { map[id] = true; });
      setItems(map);
    }
  }, [existing]);

  // -- Derived data --
  const packages = useMemo(() => {
    const mt = bookingType === 'mandap' ? 'MANDAP' : 'RESORT';
    return allPackages.filter(p =>
      p.isActive &&
      (p.menuType === mt || p.menuType === 'BOTH') &&
      (mealType === 'VEG' ? p.isVeg : true)
    );
  }, [allPackages, bookingType, mealType]);

  const items = useMemo(() => {
    const mt = bookingType === 'mandap' ? 'MANDAP' : 'RESORT';
    return allItems.filter(i =>
      i.isActive &&
      (i.menuType === mt || i.menuType === 'BOTH') &&
      (mealType === 'VEG' ? i.isVeg : true)
    );
  }, [allItems, bookingType, mealType]);

  const itemsByCategory = useMemo(() => {
    const map = {};
    items.forEach(item => {
      const catId = item.categoryId;
      if (!map[catId]) map[catId] = [];
      map[catId].push(item);
    });
    return map;
  }, [items]);

  const totalCost = useMemo(() => {
    if (mode === 'package' && selectedPkg) {
      const pkg = allPackages.find(p => p.id === selectedPkg);
      return pkg ? parseFloat(pkg.pricePerPlate) * guestCount : 0;
    }
    if (mode === 'custom') {
      const perPlate = items.filter(i => selectedItems[i.id]).reduce((s, i) => s + parseFloat(i.pricePerPlate), 0);
      return perPlate * guestCount;
    }
    return 0;
  }, [mode, selectedPkg, selectedItems, guestCount, allPackages, items]);

  const selectedCount = Object.keys(selectedItems).length;

  // -- Save mutation --
  const saveMutation = useMutation({
    mutationFn: (data) => api.post('/menus/selection', data),
    onSuccess: () => {
      toast.success('Menu saved successfully!');
      setSaved(true);
      setTimeout(() => {
        navigate(bookingId ? `/customer/bookings/${bookingId}` : `/customer/room-bookings/${roomBookingId}`);
      }, 1200);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to save menu';
      if (msg === 'Customer profile required') {
        setProfileError(true);
      } else {
        toast.error(msg);
      }
    },
  });

  const handleSave = () => {
    if (!guestCount || guestCount < 1) return toast.error('Enter a valid guest count');
    if (mode === 'package' && !selectedPkg) return toast.error('Please select a package');
    if (mode === 'custom' && selectedCount === 0) return toast.error('Please select at least one item');

    saveMutation.mutate({
      bookingId: bookingId || undefined,
      roomBookingId: roomBookingId || undefined,
      packageId: mode === 'package' ? selectedPkg : undefined,
      selectedItems: mode === 'custom' ? Object.keys(selectedItems) : [],
      guestCount,
      isVeg: mealType === 'VEG',
      totalCost,
      notes,
    });
  };

  const toggleItem = (id) => {
    setItems(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id]; else next[id] = true;
      return next;
    });
  };

  const backPath = bookingId
    ? `/customer/bookings/${bookingId}`
    : `/customer/room-bookings/${roomBookingId}`;

  const pageTitle = bookingType === 'mandap' ? 'Mandap Menu Customization' : 'Resort Menu Customization';

  return (
    <>
    {viewPkg && (
      <PackageDetailModal
        pkg={viewPkg}
        allItems={allItems}
        categories={categories}
        guestCount={guestCount}
        selectedPkg={selectedPkg}
        onSelect={setSelPkg}
        onClose={() => setViewPkg(null)}
      />
    )}
    <div className="bg-cream-50">
      {/* -- Header -- */}
      <div className="bg-[#142B0A] text-white px-4 py-3 sticky top-0 z-30 shadow-md">
        <div className="max-w-full flex items-center gap-3">
          <Link to={backPath} className="text-white/70 hover:text-white transition-colors flex-shrink-0">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-sm truncate leading-tight">{pageTitle}</h1>
            <p className="text-[11px] text-white/50 leading-tight">
              {bookingId ? `Booking #${bookingId.slice(-8).toUpperCase()}` : `Room #${roomBookingId?.slice(-8).toUpperCase()}`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg flex-shrink-0">
            <UsersIcon className="h-3.5 w-3.5 text-[#D6AD45]" />
            <input
              type="number"
              min={1}
              max={5000}
              value={guestCount}
              onChange={e => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-14 bg-transparent text-white text-xs font-semibold outline-none text-center"
            />
            <span className="text-[11px] text-white/50">guests</span>
          </div>
        </div>
      </div>

      {/* Profile-missing banner */}
      {profileError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
          <div className="max-w-full flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">Customer profile required</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Please complete your profile (full name is required) before saving a menu selection.
              </p>
            </div>
            <Link
              to="/customer/profile"
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
            >
              <UserCircleIcon className="h-4 w-4" />
              Go to My Profile
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-full px-3 sm:px-4 py-3 pb-20 xl:pb-3">
        <div className="flex gap-3 flex-col xl:flex-row xl:items-start">

          {/* -- Left: configurator -- */}
          <div className="flex-1 min-w-0 flex flex-col gap-3 xl:overflow-hidden xl:max-h-[calc(100vh-116px)]">

            {/* Fixed top: meal type + mode toggle */}
            <div className="flex-shrink-0 space-y-3">

              {/* Meal type toggle */}
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Meal Preference</p>
                <div className="flex gap-2">
                  {[
                    { key: 'VEG',     label: 'Vegetarian',     color: 'green', isVeg: true  },
                    { key: 'NON_VEG', label: 'Non-Vegetarian', color: 'red',   isVeg: false },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => { setMealType(opt.key); setSelPkg(null); setItems({}); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold border-2 transition-all
                        ${mealType === opt.key
                          ? opt.color === 'green' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-400 text-red-700'
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      <VEG_DOT isVeg={opt.isVeg} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode toggle */}
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Selection Mode</p>
                <div className="flex gap-2">
                  {[
                    { key: 'package', Icon: ArchiveBoxIcon, label: 'Choose a Package', desc: 'Pre-designed curated menu' },
                    { key: 'custom',  Icon: PencilSquareIcon, label: 'Customize Items',   desc: 'Pick dishes yourself' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setMode(opt.key)}
                      className={`flex-1 py-2 px-3 rounded-lg text-left border-2 transition-all
                        ${mode === opt.key
                          ? 'bg-[#142B0A]/5 border-[#1E3B0E] text-[#1E3B0E]'
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      <p className="text-xs font-semibold flex items-center gap-1.5">
                        <opt.Icon className="h-3.5 w-3.5 flex-shrink-0" />
                        {opt.label}
                      </p>
                      <p className="text-[11px] opacity-70 mt-0.5 pl-5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scrollable middle: packages or custom food items */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-0.5 pb-1">

              {/* Menu type section header */}
              <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold tracking-wide ${
                mealType === 'VEG'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <VEG_DOT isVeg={mealType === 'VEG'} />
                {mealType === 'VEG' ? 'VEGETARIAN MENU' : 'NON-VEGETARIAN MENU'}
              </div>

              {/* -- Package selection -- */}
              {mode === 'package' && (
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    {bookingType === 'mandap' ? 'Mandap Menu Packages' : 'Resort Menu Packages'}
                  </p>
                  {packages.length === 0 ? (
                    <p className="text-sm text-gray-400 py-3 text-center">No packages available for selected preference</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {packages.map(pkg => (
                        <div
                          key={pkg.id}
                          className={`relative rounded-lg border-2 transition-all overflow-hidden
                            ${selectedPkg === pkg.id
                              ? 'border-[#D6AD45] bg-[#D6AD45]/5'
                              : 'border-gray-200 hover:border-[#D6AD45]/50 bg-white'}`}
                        >
                          {selectedPkg === pkg.id && (
                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#D6AD45] text-[#142B0A] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              <CheckCircleSolid className="h-3 w-3" />
                              Selected
                            </div>
                          )}
                          <div className="p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <VEG_DOT isVeg={pkg.isVeg} />
                              <span className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
                                {PKG_TYPE_LABEL[pkg.packageType] || pkg.packageType}
                              </span>
                            </div>
                            <p className="font-semibold text-gray-900 text-sm pr-14">{pkg.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{pkg.description}</p>
                            <p className="mt-1.5 font-bold text-[#1E3B0E] text-sm">
                              ₹{fmt(pkg.pricePerPlate)}<span className="text-xs font-normal text-gray-400">/plate</span>
                            </p>
                          </div>
                          <button
                            onClick={() => setViewPkg(pkg)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 border-t border-gray-100 text-xs font-semibold text-[#1E3B0E] hover:bg-[#1E3B0E]/5 transition-colors"
                          >
                            <EyeIcon className="h-3.5 w-3.5" />
                            View Details & Select
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* -- Custom item selection -- */}
              {mode === 'custom' && (
                <>
                  {categories.map(cat => {
                    const catItems = itemsByCategory[cat.id] || [];
                    if (catItems.length === 0) return null;
                    return (
                      <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                          <p className="font-semibold text-gray-800 text-xs">{cat.name}</p>
                          <span className="text-[11px] text-gray-400">{catItems.filter(i => selectedItems[i.id]).length}/{catItems.length}</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {catItems.map(item => {
                            const sel = !!selectedItems[item.id];
                            return (
                              <button
                                key={item.id}
                                onClick={() => toggleItem(item.id)}
                                className={`w-full text-left flex items-center gap-2.5 px-3 py-2 transition-colors
                                  ${sel ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}
                              >
                                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                                  ${sel ? 'bg-[#1E3B0E] border-[#1E3B0E]' : 'border-gray-300'}`}>
                                  {sel && <CheckIcon className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                                </span>
                                <VEG_DOT isVeg={item.isVeg} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900">{item.name}</p>
                                  {item.description && (
                                    <p className="text-[11px] text-gray-400 truncate">{item.description}</p>
                                  )}
                                </div>
                                <span className="text-xs font-semibold text-[#1E3B0E] whitespace-nowrap">+₹{fmt(item.pricePerPlate)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Fixed bottom: notes */}
            <div className="flex-shrink-0 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Special Instructions (optional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Allergy info, dietary requests, service timing..."
                className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-[#1E3B0E] resize-none"
              />
            </div>
          </div>

          {/* -- Right: summary -- */}
          <div className="xl:w-72 flex-shrink-0 xl:self-start">
            <div className="sticky top-14 space-y-3 xl:max-h-[calc(100vh-116px)] xl:overflow-y-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-[#142B0A] px-3 py-2.5 flex items-center gap-2">
                  <ShoppingCartIcon className="h-3.5 w-3.5 text-[#D6AD45]" />
                  <span className="text-white font-semibold text-xs">Order Summary</span>
                </div>

                <div className="p-3 space-y-2">
                  {/* Meal type badge */}
                  <div className="flex items-center gap-2">
                    <VEG_DOT isVeg={mealType === 'VEG'} />
                    <span className="text-xs text-gray-600">{mealType === 'VEG' ? 'Vegetarian' : 'Non-Vegetarian'}</span>
                  </div>

                  <div className="border-t border-gray-100 pt-2">
                    {mode === 'package' && selectedPkg ? (
                      (() => {
                        const pkg = allPackages.find(p => p.id === selectedPkg);
                        return pkg ? (
                          <div>
                            <p className="text-[11px] text-gray-400 mb-0.5">Package</p>
                            <p className="text-xs font-semibold text-gray-800">{pkg.name}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">₹{fmt(pkg.pricePerPlate)} × {guestCount} guests</p>
                          </div>
                        ) : null;
                      })()
                    ) : mode === 'custom' && selectedCount > 0 ? (
                      <div>
                        <p className="text-[11px] text-gray-400 mb-1.5">Selected items ({selectedCount})</p>
                        <div className="space-y-0.5 max-h-36 overflow-y-auto">
                          {items.filter(i => selectedItems[i.id]).map(item => (
                            <div key={item.id} className="flex justify-between text-[11px] text-gray-600">
                              <span className="truncate mr-2">{item.name}</span>
                              <span className="text-gray-400 whitespace-nowrap">₹{fmt(item.pricePerPlate)}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1.5 border-t border-gray-100 pt-1.5">
                          ₹{fmt(items.filter(i => selectedItems[i.id]).reduce((s, i) => s + parseFloat(i.pricePerPlate), 0))}/plate × {guestCount}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 py-1.5 text-center">No items selected</p>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Guests</span>
                      <span className="font-medium">{guestCount}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Per plate</span>
                      <span className="font-medium">
                        {mode === 'package' && selectedPkg
                          ? `₹${fmt(allPackages.find(p => p.id === selectedPkg)?.pricePerPlate ?? 0)}`
                          : mode === 'custom' && selectedCount > 0
                            ? `₹${fmt(items.filter(i => selectedItems[i.id]).reduce((s, i) => s + parseFloat(i.pricePerPlate), 0))}`
                            : '₹0'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-[#1E3B0E] pt-1 border-t border-gray-100">
                      <span>Total</span>
                      <span>₹{fmt(totalCost)}</span>
                    </div>
                    <p className="text-[11px] text-gray-400">Approx. cost, taxes extra</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saveMutation.isPending || saved}
                className="w-full py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm
                  bg-[#1E3B0E] hover:bg-[#142B0A] text-white disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saved ? (
                  <><CheckCircleSolid className="h-4 w-4 text-green-400" />Saved!</>
                ) : saveMutation.isPending ? (
                  <><div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</>
                ) : (
                  <><SparklesIcon className="h-4 w-4" />Save Menu Selection</>
                )}
              </button>

              <Link to={backPath}
                className="flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors py-1">
                <ArrowLeftIcon className="h-3 w-3" />
                Back to Booking
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* -- Mobile sticky bottom summary bar -- */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <VEG_DOT isVeg={mealType === 'VEG'} />
              <span className="text-xs text-gray-500 truncate">
                {mode === 'package' && selectedPkg
                  ? allPackages.find(p => p.id === selectedPkg)?.name || 'Package selected'
                  : mode === 'custom' && selectedCount > 0
                    ? `${selectedCount} item${selectedCount > 1 ? 's' : ''} selected`
                    : 'No selection yet'}
              </span>
            </div>
            <p className="text-sm font-bold text-[#1E3B0E]">₹{fmt(totalCost)}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending || saved}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#1E3B0E] hover:bg-[#142B0A] text-white disabled:opacity-60 transition-all flex-shrink-0"
          >
            {saved ? (
              <><CheckCircleSolid className="h-4 w-4 text-green-400" />Saved!</>
            ) : saveMutation.isPending ? (
              <><div className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</>
            ) : (
              <><SparklesIcon className="h-4 w-4" />Save</>
            )}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
