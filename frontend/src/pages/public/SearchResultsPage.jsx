import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../context/authStore';
import PublicHeader from '../../components/layout/PublicHeader';
import PublicFooter from '../../components/layout/PublicFooter';
import {
  MagnifyingGlassIcon, MapPinIcon, XMarkIcon,
  ChevronDownIcon, AdjustmentsHorizontalIcon, StarIcon as StarOutline,
  SparklesIcon, CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid, CheckCircleIcon } from '@heroicons/react/24/solid';

// ─── constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  '':              'All Types',
  MANDAP:          'Mandap',
  MARRIAGE_HALL:   'Marriage Hall',
  RESORT:          'Resort',
  BANQUET_HALL:    'Banquet Hall',
  WEDDING_VENUE:   'Wedding Venue',
};
const TYPE_EMOJI = {
  MANDAP:'🏛️', MARRIAGE_HALL:'🏢', RESORT:'🏨', BANQUET_HALL:'🎪', WEDDING_VENUE:'💒',
};
const SORT_OPTIONS = [
  { value: 'default',    label: 'Popularity' },
  { value: 'rating',     label: 'Highest Rated' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

function ratingLabel(r) {
  if (!r) return null;
  if (r >= 4.5) return 'Exceptional';
  if (r >= 4.0) return 'Excellent';
  if (r >= 3.5) return 'Very Good';
  if (r >= 3.0) return 'Good';
  return 'Average';
}

// ─── sidebar price-range slider ───────────────────────────────────────────────

function PriceRange({ min, max, onChange }) {
  const minVal = Number(min) || 0;
  const maxVal = Number(max) || 500000;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">₹{minVal.toLocaleString('en-IN')}</span>
        <span className="font-medium text-gray-700">₹{maxVal.toLocaleString('en-IN')}</span>
      </div>
      <div className="relative h-1.5 bg-gray-200 rounded-full">
        <div
          className="absolute h-1.5 bg-[#D6AD45] rounded-full"
          style={{
            left: `${(minVal / 500000) * 100}%`,
            right: `${100 - (maxVal / 500000) * 100}%`,
          }}
        />
      </div>
      <div className="flex gap-2">
        <input
          type="range" min={0} max={500000} step={5000}
          value={minVal}
          onChange={e => onChange(Number(e.target.value), maxVal)}
          className="w-full accent-[#142B0A] h-1"
        />
        <input
          type="range" min={0} max={500000} step={5000}
          value={maxVal}
          onChange={e => onChange(minVal, Number(e.target.value))}
          className="w-full accent-[#142B0A] h-1"
        />
      </div>
    </div>
  );
}

// ─── sidebar ──────────────────────────────────────────────────────────────────

function FilterSidebar({ draft, setDraft, onApply, onClear }) {
  const types = ['MANDAP', 'MARRIAGE_HALL', 'RESORT', 'BANQUET_HALL', 'WEDDING_VENUE'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 text-sm">Filters</h3>
        <button onClick={onClear} className="text-xs text-[#142B0A] font-semibold hover:underline">Clear All</button>
      </div>

      <div className="divide-y divide-gray-100">
        {/* Price */}
        <div className="px-4 py-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Price</p>
          <PriceRange
            min={draft.minPrice}
            max={draft.maxPrice}
            onChange={(mn, mx) => setDraft(d => ({ ...d, minPrice: mn || '', maxPrice: mx >= 500000 ? '' : mx }))}
          />
        </div>

        {/* Property Type */}
        <div className="px-4 py-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Collections</p>
          <div className="space-y-2.5">
            {types.map(t => (
              <label key={t} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={draft.propertyType === t}
                  onChange={e => setDraft(d => ({ ...d, propertyType: e.target.checked ? t : '' }))}
                  className="w-4 h-4 rounded border-gray-300 accent-[#142B0A]"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  {TYPE_EMOJI[t]} {TYPE_LABELS[t]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div className="px-4 py-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Categories</p>
          <div className="space-y-2.5">
            {[
              { key: 'hasAC',   label: '❄️ Air Conditioned' },
              { key: 'hasPool', label: '🏊 Swimming Pool' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={draft[key] === 'true'}
                  onChange={e => setDraft(d => ({ ...d, [key]: e.target.checked ? 'true' : '' }))}
                  className="w-4 h-4 rounded border-gray-300 accent-[#142B0A]"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
              </label>
            ))}
          </div>
        </div>

      </div>

      <div className="px-4 py-3 bg-gray-50">
        <button
          onClick={onApply}
          className="w-full bg-[#142B0A] hover:bg-[#1e3b0e] text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex animate-pulse h-52">
      <div className="w-64 bg-gray-200 flex-shrink-0" />
      <div className="flex-1 p-5 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="flex gap-2 mt-2">
          <div className="h-6 bg-gray-100 rounded-full w-20" />
          <div className="h-6 bg-gray-100 rounded-full w-20" />
        </div>
        <div className="mt-auto flex justify-between items-end pt-6">
          <div className="h-7 bg-gray-200 rounded w-24" />
          <div className="flex gap-2">
            <div className="h-9 bg-gray-100 rounded-lg w-28" />
            <div className="h-9 bg-gray-200 rounded-lg w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── horizontal venue card ────────────────────────────────────────────────────

function VenueCard({ property }) {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const images = property.media || [];
  const cover  = images[0]?.url;
  const thumbs = images.slice(1, 4);
  const price  = property.pricingRules?.[0]?.basePrice;
  const typeLabel = TYPE_LABELS[property.propertyType] || property.propertyType;
  const typeEmoji = TYPE_EMOJI[property.propertyType] || '🏛️';
  const rating = property.rating > 0 ? Number(property.rating) : null;
  const label  = ratingLabel(rating);

  // Build amenities chips
  const amenities = [];
  if (property.hasAC)   amenities.push({ icon: '❄️', text: 'Air Conditioned' });
  if (property.hasPool) amenities.push({ icon: '🏊', text: 'Swimming Pool' });
  if (property.totalCapacity) amenities.push({ icon: '👥', text: `Up to ${Number(property.totalCapacity).toLocaleString('en-IN')} guests` });
  // from amenities array if exists
  if (Array.isArray(property.amenities)) {
    property.amenities.slice(0, 3).forEach(a => {
      if (!amenities.find(x => x.text === a.name)) amenities.push({ icon: '✓', text: a.name });
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col md:flex-row">
      {/* ── Image section ── */}
      <div className="relative flex-shrink-0 w-full md:w-64 flex flex-col bg-gray-100">
        {/* Main image */}
        <div className="relative h-44 md:h-full overflow-hidden">
          {cover ? (
            <img src={cover} alt={property.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#142B0A]/10 to-[#D6AD45]/10 gap-2">
              <span className="text-5xl opacity-30">{typeEmoji}</span>
            </div>
          )}
          {/* Type badge */}
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 bg-[#142B0A]/90 text-white text-xs font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm">
            {typeLabel}
          </span>
        </div>

        {/* Thumbnail strip */}
        {thumbs.length > 0 && (
          <div className="hidden md:flex gap-0.5 h-14 flex-shrink-0">
            {thumbs.map((m, i) => (
              <div key={i} className="flex-1 overflow-hidden">
                <img src={m.url} alt="" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
              </div>
            ))}
            {/* fill empty slots */}
            {Array.from({ length: 3 - thumbs.length }).map((_, i) => (
              <div key={`fill-${i}`} className="flex-1 bg-gray-200" />
            ))}
          </div>
        )}
      </div>

      {/* ── Info section ── */}
      <div className="flex-1 p-4 md:p-5 flex flex-col min-w-0">
        {/* Name + location */}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-base leading-snug hover:text-[#142B0A] transition-colors line-clamp-2 mb-1">
            {property.name}
          </h3>

          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-3">
            <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0 text-[#D6AD45]" />
            <span className="line-clamp-1">
              {property.locationNode?.name}
              {property.locality ? `, ${property.locality.name}` : ''}
              {property.city ? `, ${property.city}` : ''}
            </span>
          </div>

          {/* Rating badge */}
          {rating && (
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 bg-[#1a7a4c] text-white text-xs font-bold px-2 py-0.5 rounded">
                <StarSolid className="h-3 w-3" />
                {rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-600 font-medium">{label}</span>
              {property.reviewCount > 0 && (
                <span className="text-xs text-gray-400">({property.reviewCount} Ratings)</span>
              )}
            </div>
          )}

          {/* Amenity chips */}
          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {amenities.slice(0, 4).map((a, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
                  <CheckCircleIcon className="h-3.5 w-3.5 text-[#1a7a4c]" />
                  {a.text}
                </span>
              ))}
              {amenities.length > 4 && (
                <span className="text-xs text-gray-400 self-center">+ {amenities.length - 4} more</span>
              )}
            </div>
          )}

          {/* Premium badge */}
          <div className="inline-flex items-center gap-1.5 border border-[#D6AD45]/60 text-[#b8942d] text-xs font-semibold px-2.5 py-1 rounded">
            <SparklesIcon className="h-3 w-3" />
            PREMIUM VENUE
          </div>
        </div>

        {/* ── Bottom row: price + buttons ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mt-4 pt-3 border-t border-gray-100">
          {/* Price */}
          <div>
            {price ? (
              <>
                <p className="text-xl font-bold text-gray-900">
                  ₹{Number(price).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-500">+ taxes &amp; fees · per event</p>
              </>
            ) : (
              <p className="text-sm text-gray-500 italic">Price on request</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-shrink-0">
            <Link
              to={`/venue/${property.slug}`}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:border-[#142B0A] hover:text-[#142B0A] text-sm font-semibold rounded-lg transition-all"
            >
              View Details
            </Link>
            <button
              onClick={() => {
                const dest = `/book/${property.slug}`;
                if (!token || user?.role !== 'CUSTOMER') {
                  navigate(`/login?next=${encodeURIComponent(dest)}`);
                } else {
                  navigate(dest);
                }
              }}
              className="px-4 py-2 bg-[#142B0A] hover:bg-[#1e3b0e] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: '', label: 'All Venue Types' },
  { value: 'MANDAP', label: '🏛️ Mandap' },
  { value: 'MARRIAGE_HALL', label: '🏢 Marriage Hall' },
  { value: 'RESORT', label: '🏨 Resort' },
  { value: 'BANQUET_HALL', label: '🎉 Banquet Hall' },
  { value: 'WEDDING_VENUE', label: '💒 Wedding Venue' },
];

export default function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sort, setSort] = useState('default');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Full-search form state (pre-filled from URL) ──
  const [formSearch, setFormSearch] = useState(searchParams.get('search') || '');
  const [formType,   setFormType]   = useState(searchParams.get('propertyType') || '');
  const [formDate,   setFormDate]   = useState(searchParams.get('eventDate') || '');

  const handleFormSearch = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (formSearch) p.set('search', formSearch);
    if (formType)   p.set('propertyType', formType);
    if (formDate)   p.set('eventDate', formDate);
    p.set('page', '1');
    navigate(`/search?${p.toString()}`);
  };

  const [draft, setDraft] = useState({
    propertyType: searchParams.get('propertyType') || '',
    minPrice:     searchParams.get('minPrice')     || '',
    maxPrice:     searchParams.get('maxPrice')     || '',
    hasAC:        searchParams.get('hasAC')        || '',
    hasPool:      searchParams.get('hasPool')      || '',
  });

  const params = {
    search:       searchParams.get('search')       || '',
    propertyType: searchParams.get('propertyType') || '',
    capacity:     searchParams.get('capacity')     || '',
    hasAC:        searchParams.get('hasAC')        || '',
    hasPool:      searchParams.get('hasPool')      || '',
    minPrice:     searchParams.get('minPrice')     || '',
    maxPrice:     searchParams.get('maxPrice')     || '',
    page:         searchParams.get('page')         || '1',
    limit: '20',
  };

  const { data, isLoading } = useQuery({
    queryKey: ['search-properties', params],
    queryFn: () => api.get('/properties', { params }).then(r => r.data),
    keepPreviousData: true,
  });

  const sortedProperties = useMemo(() => {
    const list = [...(data?.properties || [])];
    if (sort === 'rating')     return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sort === 'price_asc')  return list.sort((a, b) => Number(a.pricingRules?.[0]?.basePrice || 0) - Number(b.pricingRules?.[0]?.basePrice || 0));
    if (sort === 'price_desc') return list.sort((a, b) => Number(b.pricingRules?.[0]?.basePrice || 0) - Number(a.pricingRules?.[0]?.basePrice || 0));
    return list;
  }, [data?.properties, sort]);

  const setPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyFilters = () => {
    const next = new URLSearchParams(searchParams);
    Object.entries(draft).forEach(([k, v]) => {
      if (v) next.set(k, v); else next.delete(k);
    });
    next.set('page', '1');
    setSearchParams(next);
    setSidebarOpen(false);
  };

  const clearAll = () => {
    const blank = { propertyType: '', minPrice: '', maxPrice: '', hasAC: '', hasPool: '' };
    setDraft(blank);
    const next = new URLSearchParams();
    if (params.search) next.set('search', params.search);
    next.set('page', '1');
    setSearchParams(next);
  };

  const totalPages  = Math.ceil((data?.total || 0) / 20);
  const currentPage = Number(params.page);

  const locationLabel = params.search
    ? `"${params.search}"`
    : params.propertyType
      ? (TYPE_LABELS[params.propertyType] || 'Venues')
      : 'All Venues';

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      {/* ── Hero search form ─────────────────────────────────────────────────── */}
      <div className="bg-[#142B0A] py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-white/60 text-sm mb-4 font-medium tracking-wide uppercase">Find Your Venue</p>
          <form onSubmit={handleFormSearch} className="flex flex-wrap gap-3">
            {/* Location / keyword */}
            <div className="relative flex-1 min-w-[180px]">
              <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formSearch}
                onChange={e => setFormSearch(e.target.value)}
                placeholder="Location or venue name…"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-[#D6AD45] bg-white"
              />
            </div>
            {/* Venue type */}
            <select
              value={formType}
              onChange={e => setFormType(e.target.value)}
              className="flex-1 min-w-[160px] px-3 py-2.5 text-sm rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-[#D6AD45] bg-white text-gray-700"
            >
              {PROPERTY_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {/* Date */}
            <div className="relative min-w-[160px]">
              <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-[#D6AD45] bg-white text-gray-700"
              />
            </div>
            {/* Submit */}
            <button
              type="submit"
              className="bg-[#D6AD45] hover:bg-[#c09930] text-[#142B0A] font-bold px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg text-sm flex items-center gap-2 whitespace-nowrap"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              Search Venues
            </button>
          </form>
        </div>
      </div>

      {/* ── Top search bar ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              defaultValue={params.search}
              placeholder="Search venues, locations…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#142B0A]/30 bg-gray-50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const next = new URLSearchParams(searchParams);
                  const v = e.target.value.trim();
                  if (v) next.set('search', v); else next.delete('search');
                  next.set('page', '1');
                  setSearchParams(next);
                }
              }}
            />
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="md:hidden flex items-center gap-1.5 text-sm border border-gray-200 px-3 py-2 rounded-lg text-gray-600"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            Filters
          </button>

          {/* Result count */}
          <p className="hidden md:block text-sm text-gray-600 flex-shrink-0">
            {isLoading ? (
              <span className="inline-block h-4 w-28 bg-gray-200 rounded animate-pulse" />
            ) : (
              <><strong className="text-gray-900">{data?.total ?? 0}</strong> venues in {locationLabel}</>
            )}
          </p>

          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-gray-500 hidden sm:inline">Sort By</span>
            <div className="relative">
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#142B0A]/30 cursor-pointer pr-8 appearance-none"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Result count bar (mobile) ──────────────────────────────────────── */}
      <div className="md:hidden bg-white border-b border-gray-100 px-4 py-2">
        <p className="text-sm text-gray-600">
          <strong className="text-gray-900">{data?.total ?? 0}</strong> venues in {locationLabel}
        </p>
      </div>

      {/* ── Main layout ───────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">

          {/* ── Filter sidebar (desktop sticky, mobile drawer) ── */}
          <aside
            className={`flex-shrink-0 w-72 ${
              sidebarOpen
                ? 'fixed inset-0 z-40 bg-black/40 flex items-start justify-start'
                : 'hidden md:block md:sticky md:top-20 md:self-start'
            }`}
            onClick={e => { if (e.target === e.currentTarget) setSidebarOpen(false); }}
          >
            <div className={`${sidebarOpen ? 'w-72 h-full overflow-y-auto bg-white shadow-2xl' : 'md:max-h-[calc(100vh-5rem)] md:overflow-y-auto'}`}>
              {/* Mobile close */}
              {sidebarOpen && (
                <div className="flex items-center justify-between px-4 py-3 bg-[#142B0A] text-white">
                  <span className="font-semibold">Filters</span>
                  <button onClick={() => setSidebarOpen(false)}>
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
              <FilterSidebar
                draft={draft}
                setDraft={setDraft}
                onApply={applyFilters}
                onClear={clearAll}
              />
            </div>
          </aside>

          {/* ── Results ── */}
          <div className="flex-1 min-w-0">
            {/* Count heading */}
            <h2 className="text-base font-semibold text-gray-800 mb-4 hidden md:block">
              {isLoading
                ? <span className="inline-block h-5 w-48 bg-gray-200 rounded animate-pulse" />
                : <>{data?.total ?? 0} Venues in {locationLabel}</>
              }
            </h2>

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : !sortedProperties.length ? (
              <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-20 text-center px-6">
                <span className="text-6xl mb-4">🏛️</span>
                <h3 className="font-semibold text-gray-900 text-xl mb-2">No venues found</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-xs">
                  Try adjusting your filters or clearing them to see more results.
                </p>
                <button
                  onClick={clearAll}
                  className="bg-[#142B0A] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1e3b0e] transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {sortedProperties.map(p => <VenueCard key={p.id} property={p} />)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => setPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#142B0A] hover:text-[#142B0A] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
                    >
                      ‹
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === '…' ? (
                          <span key={`e-${idx}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
                        ) : (
                          <button key={item} onClick={() => setPage(item)}
                            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                              item === currentPage
                                ? 'bg-[#142B0A] text-white'
                                : 'border border-gray-200 text-gray-600 hover:border-[#142B0A] hover:text-[#142B0A]'
                            }`}>
                            {item}
                          </button>
                        )
                      )
                    }
                    <button
                      onClick={() => setPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#142B0A] hover:text-[#142B0A] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
                    >
                      ›
                    </button>
                  </div>
                )}
                <p className="text-center text-xs text-gray-400 mt-3">
                  Page {currentPage} of {totalPages} · {data?.total} venues total
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
