import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlassIcon, AdjustmentsHorizontalIcon, ArrowRightIcon,
  MapPinIcon, StarIcon, PhoneIcon, UserPlusIcon,
  CameraIcon, SparklesIcon, PaintBrushIcon,
  MusicalNoteIcon, ClipboardDocumentListIcon, ComputerDesktopIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import PublicHeader from '../../components/layout/PublicHeader';
import PublicFooter from '../../components/layout/PublicFooter';

const PINK = '#E83E8C';
const DARK = '#12330F';

/* ─── Category catalogue ─────────────────────────────────────────────────── */
const CATEGORIES = [
  {
    key: 'photographer',
    label: 'Photographers',
    Icon: CameraIcon,
    bg: 'linear-gradient(135deg,#FEF3C7,#FDE68A)',
    accent: '#d97706',
    desc: 'Professional wedding photographers capturing every precious moment on your big day.',
    features: ['Candid Photography', 'Traditional Portraits', 'Pre-Wedding Shoot', 'Drone Aerial Shots', 'Wedding Videography'],
  },
  {
    key: 'makeup',
    label: 'Makeup Artists',
    Icon: SparklesIcon,
    bg: 'linear-gradient(135deg,#FDF2F8,#FCE7F3)',
    accent: '#db2777',
    desc: 'Bridal & family makeup artists for a flawless, stunning look on your wedding day.',
    features: ['Bridal Makeup', 'Family Makeup', 'Airbrush Technique', 'Hair Styling', 'Saree Draping'],
  },
  {
    key: 'mehndi',
    label: 'Mehndi Artists',
    Icon: PaintBrushIcon,
    bg: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)',
    accent: '#16a34a',
    desc: 'Traditional & modern mehndi designs for brides, families, and wedding guests.',
    features: ['Bridal Mehndi', 'Arabic Designs', 'Rajasthani Style', 'Full Hand & Feet', 'Guest Mehndi'],
  },
  {
    key: 'dj',
    label: 'Wedding DJs',
    Icon: MusicalNoteIcon,
    bg: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)',
    accent: '#2563eb',
    desc: 'DJs, live bands & music for the perfect wedding atmosphere and celebration.',
    features: ['Sangeet Night DJ', 'Reception Music', 'Live Sound System', 'Lighting Setup', 'MC Services'],
  },
  {
    key: 'planner',
    label: 'Wedding Planners',
    Icon: ClipboardDocumentListIcon,
    bg: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)',
    accent: '#ea580c',
    desc: 'Expert full-service & partial wedding planners who handle every detail for you.',
    features: ['Full Planning', 'Day-of Coordination', 'Vendor Management', 'Budget Planning', 'Decoration Coordination'],
  },
  {
    key: 'virtual',
    label: 'Virtual Planning',
    Icon: ComputerDesktopIcon,
    bg: 'linear-gradient(135deg,#FAF5FF,#EDE9FE)',
    accent: '#7c3aed',
    desc: 'Plan your dream wedding remotely with certified virtual planners via video calls.',
    features: ['Online Consultation', 'Remote Vendor Booking', 'Digital Mood Boards', 'Video Call Planning', 'Live Event Streaming'],
  },
];

/* ─── Static sample providers (shown when no API data) ──────────────────── */
const SAMPLE_PROVIDERS = [
  { id: 1, name: 'Debasish Photography',    category: 'photographer', city: 'Bhubaneswar', rating: 4.9, reviews: 124, priceFrom: 25000, verified: true },
  { id: 2, name: 'Priya Bridal Studio',     category: 'makeup',       city: 'Bhubaneswar', rating: 4.8, reviews: 89,  priceFrom: 8000,  verified: true },
  { id: 3, name: 'Henna by Sunita',         category: 'mehndi',       city: 'Cuttack',     rating: 4.7, reviews: 56,  priceFrom: 2500,  verified: true },
  { id: 4, name: 'DJ Beats Odisha',         category: 'dj',           city: 'Bhubaneswar', rating: 4.6, reviews: 43,  priceFrom: 15000, verified: false },
  { id: 5, name: 'Dream Wedding Planners',  category: 'planner',      city: 'Puri',        rating: 4.9, reviews: 67,  priceFrom: 50000, verified: true },
  { id: 6, name: 'Virtual Weddings India',  category: 'virtual',      city: 'Remote',      rating: 4.5, reviews: 31,  priceFrom: 10000, verified: true },
  { id: 7, name: 'Lens & Light Studio',     category: 'photographer', city: 'Cuttack',     rating: 4.7, reviews: 78,  priceFrom: 20000, verified: true },
  { id: 8, name: 'Blush & Glow Artists',   category: 'makeup',       city: 'Puri',        rating: 4.8, reviews: 45,  priceFrom: 7000,  verified: false },
  { id: 9, name: 'Srishti Mehndi Art',     category: 'mehndi',       city: 'Bhubaneswar', rating: 4.9, reviews: 92,  priceFrom: 3000,  verified: true },
];

/* ─── Category icons lookup ──────────────────────────────────────────────── */
const CAT_ICON = {
  photographer: CameraIcon,
  makeup:       SparklesIcon,
  mehndi:       PaintBrushIcon,
  dj:           MusicalNoteIcon,
  planner:      ClipboardDocumentListIcon,
  virtual:      ComputerDesktopIcon,
};

const CAT_ACCENT = {
  photographer: '#d97706', makeup: '#db2777', mehndi: '#16a34a',
  dj: '#2563eb', planner: '#ea580c', virtual: '#7c3aed',
};

/* ─── Provider Card ──────────────────────────────────────────────────────── */
function ProviderCard({ p }) {
  const Icon = CAT_ICON[p.category] || CameraIcon;
  const accent = CAT_ACCENT[p.category] || PINK;
  const catLabel = CATEGORIES.find(c => c.key === p.category)?.label || p.category;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      {/* Top band */}
      <div className="h-32 flex items-center justify-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg,${accent}22,${accent}44)` }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform"
          style={{ background: accent }}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        {p.verified && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-bold text-green-600">
            <CheckCircleIcon className="h-3 w-3" /> Verified
          </div>
        )}
        <span className="absolute bottom-3 left-3 text-[10px] font-black uppercase tracking-widest text-white px-2 py-1 rounded-lg"
          style={{ background: accent }}>
          {catLabel}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm group-hover:text-pink-500 transition-colors mb-1">{p.name}</h3>
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
          <MapPinIcon className="h-3 w-3 flex-shrink-0" /> {p.city}
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <StarSolid key={i} className={`h-3 w-3 ${i < Math.floor(p.rating) ? 'text-amber-400' : 'text-gray-200'}`} />
            ))}
            <span className="text-xs text-gray-500 ml-1">{p.rating} ({p.reviews})</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          Starting from <span className="font-bold text-gray-700">₹{p.priceFrom.toLocaleString('en-IN')}</span>
        </p>
        <div className="flex gap-2">
          <button className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: PINK }}>
            View Profile
          </button>
          <button className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:border-pink-300 transition-colors"
            title="Contact">
            <PhoneIcon className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function WeddingServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeKey = searchParams.get('category') || 'all';
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('rating');

  const activeCat = CATEGORIES.find(c => c.key === activeKey);

  const setCategory = key => {
    if (key === 'all') setSearchParams({});
    else setSearchParams({ category: key });
  };

  const filtered = SAMPLE_PROVIDERS.filter(p => {
    const matchCat = activeKey === 'all' || p.category === activeKey;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'price_asc') return a.priceFrom - b.priceFrom;
    if (sortBy === 'price_desc') return b.priceFrom - a.priceFrom;
    return b.reviews - a.reviews;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      {/* ── Hero ── */}
      <div className="py-10 px-4 text-center" style={{ background: `linear-gradient(135deg,#FDF2F8,#FFF0F7,#FEF9FF)` }}>
        <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: PINK }}>6 Service Categories</p>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-3">
          {activeCat ? activeCat.label : 'Wedding Services'}
        </h1>
        <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
          {activeCat ? activeCat.desc : 'Find and hire the best wedding professionals across Odisha for every aspect of your celebration.'}
        </p>
      </div>

      {/* ── Category filter chips ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setCategory('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${activeKey === 'all' ? 'text-white border-transparent' : 'text-gray-600 border-gray-200 bg-white hover:border-pink-300 hover:text-pink-500'}`}
              style={activeKey === 'all' ? { background: PINK, borderColor: PINK } : {}}>
              All Services
            </button>
            {CATEGORIES.map(({ key, label, Icon, accent }) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${activeKey === key ? 'text-white border-transparent' : 'text-gray-600 border-gray-200 bg-white hover:border-pink-300'}`}
                style={activeKey === key ? { background: accent, borderColor: accent } : {}}>
                <Icon className={`h-4 w-4 ${activeKey === key ? 'text-white' : 'text-gray-400'}`} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">

        {/* ── Active category feature card ── */}
        {activeCat && (
          <div className="rounded-2xl overflow-hidden mb-8 border border-gray-100"
            style={{ background: activeCat.bg }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-7">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
                style={{ background: activeCat.accent }}>
                <activeCat.Icon className="h-9 w-9 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-xl text-gray-900 mb-1">{activeCat.label}</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">{activeCat.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {activeCat.features.map(f => (
                    <span key={f} className="text-xs font-semibold px-3 py-1 rounded-full bg-white/70 text-gray-700 border border-white/50">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <Link to="/register?role=provider"
                className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 whitespace-nowrap"
                style={{ background: activeCat.accent }}>
                <UserPlusIcon className="h-4 w-4" /> Register as Provider
              </Link>
            </div>
          </div>
        )}

        {/* ── Category overview grid (shown when "all") ── */}
        {activeKey === 'all' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            {CATEGORIES.map(({ key, label, Icon, bg, accent }) => (
              <button key={key} onClick={() => setCategory(key)}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all text-left">
                <div className="h-28 flex items-center justify-center relative overflow-hidden" style={{ background: bg }}>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow group-hover:scale-110 transition-transform"
                    style={{ background: accent }}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-bold text-xs text-gray-800 group-hover:text-pink-500 transition-colors leading-tight">{label}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Search + Sort bar ── */}
        <div className="flex flex-wrap gap-3 items-center mb-6">
          <div className="flex-1 min-w-[180px] relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeCat ? activeCat.label.toLowerCase() : 'services'}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:border-pink-400">
            <option value="rating">Top Rated</option>
            <option value="reviews">Most Reviewed</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <button onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${showFilters ? 'border-pink-400 text-pink-500 bg-pink-50' : 'border-gray-200 text-gray-600 bg-white hover:border-pink-300'}`}>
            <AdjustmentsHorizontalIcon className="h-4 w-4" /> Filters
          </button>
          <p className="text-sm text-gray-400 ml-auto">{filtered.length} provider{filtered.length !== 1 ? 's' : ''} found</p>
        </div>

        {/* ── Providers grid ── */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(p => <ProviderCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
              style={{ background: '#FEE2F2' }}>
              <MagnifyingGlassIcon className="h-8 w-8 text-pink-400" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">No providers found</h3>
            <p className="text-sm text-gray-400 mb-5">Try a different search or category filter</p>
            <button onClick={() => { setSearch(''); setCategory('all'); }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: PINK }}>
              Clear Filters
            </button>
          </div>
        )}

        {/* ── Register CTA ── */}
        <div className="mt-10 rounded-2xl overflow-hidden relative"
          style={{ background: `linear-gradient(135deg,${DARK},#1a4010)` }}>
          <div className="relative px-7 py-9 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(232,62,140,0.2)', border: '1px solid rgba(232,62,140,0.4)' }}>
              <UserPlusIcon className="h-7 w-7 text-pink-400" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <h3 className="font-display font-bold text-white text-lg mb-1">Are you a wedding service provider?</h3>
              <p className="text-white/60 text-sm">Register your business and reach thousands of couples planning their weddings in Odisha.</p>
            </div>
            <div className="flex flex-wrap gap-3 flex-shrink-0">
              <Link to="/register?role=provider"
                className="px-6 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
                style={{ background: PINK, boxShadow: '0 4px 14px rgba(232,62,140,0.4)' }}>
                Register Now <ArrowRightIcon className="h-4 w-4 inline ml-1" />
              </Link>
              <Link to="/login"
                className="px-6 py-2.5 rounded-xl font-bold text-white text-sm border border-white/20 hover:bg-white/10 transition-all">
                Already registered? Sign In
              </Link>
            </div>
          </div>
        </div>

      </div>

      <PublicFooter />
    </div>
  );
}
