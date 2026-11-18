import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import {
  SparklesIcon, CameraIcon, StarIcon, XMarkIcon,
  MapPinIcon, UsersIcon, CalendarIcon, CheckCircleIcon,
  PlusCircleIcon, MinusCircleIcon,
} from '@heroicons/react/24/outline';

const CEREMONY_TYPES = [
  { value: 'ALL',      label: 'All Packages',      icon: '✨', color: 'from-gray-700 to-gray-900' },
  { value: 'MEHENDI',  label: 'Mehendi',            icon: '🌿', color: 'from-orange-500 to-amber-600' },
  { value: 'HALDI',    label: 'Haldi',              icon: '🌼', color: 'from-yellow-400 to-orange-500' },
  { value: 'MARRIAGE', label: 'Marriage Ceremony',  icon: '💒', color: 'from-rose-500 to-pink-600' },
  { value: 'RECEPTION',label: 'Reception',          icon: '🥂', color: 'from-purple-500 to-indigo-600' },
  { value: 'COMPLETE', label: 'Complete Wedding',   icon: '👑', color: 'from-forest-700 to-forest-900' },
];

const PHOTO_TYPE_LABELS = {
  PRE_WEDDING: 'Pre-wedding', WEDDING: 'Wedding', CINEMATIC: 'Cinematic',
  DRONE: 'Drone', ALBUM: 'Album', CANDID: 'Candid', TRADITIONAL: 'Traditional', COMPLETE: 'Complete Package',
};

const DECOR_TYPE_LABELS = {
  MEHENDI: 'Mehendi', HALDI: 'Haldi', STAGE: 'Stage', RECEPTION: 'Reception',
  MANDAP: 'Mandap', ENTRANCE: 'Entrance', FLORAL: 'Floral', LIGHTING: 'Lighting', COMPLETE: 'Complete', GENERAL: 'General',
};

function fmt(n) { return Number(n).toLocaleString('en-IN'); }

// ── Package Detail Modal ──────────────────────────────────────────────────────
function PackageModal({ pkg, onClose, onBook }) {
  const ct = CEREMONY_TYPES.find(c => c.value === pkg.ceremonyType) || CEREMONY_TYPES[0];
  const services = Array.isArray(pkg.includedServices) ? pkg.includedServices : [];
  const images = Array.isArray(pkg.images) ? pkg.images : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Cover */}
        <div className={`relative h-48 bg-gradient-to-br ${ct.color} flex items-end p-5`}>
          {(pkg.coverImageUrl || images[0]) && (
            <img src={pkg.coverImageUrl || images[0]} alt={pkg.name} className="absolute inset-0 w-full h-full object-cover opacity-40" />
          )}
          <div className="relative">
            <span className="text-3xl">{ct.icon}</span>
            <h2 className="font-display font-bold text-white text-xl mt-1">{pkg.name}</h2>
            <p className="text-white/80 text-sm">{ct.label} · {pkg.property?.name}</p>
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1.5"><UsersIcon className="h-4 w-4" /> Up to {pkg.guestCapacity} guests</span>
            <span className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" /> {pkg.durationDays} day{pkg.durationDays !== 1 ? 's' : ''}</span>
            {pkg.property?.addressLine && <span className="flex items-center gap-1.5"><MapPinIcon className="h-4 w-4" />{pkg.property.addressLine}</span>}
          </div>

          {pkg.description && <p className="text-sm text-gray-700">{pkg.description}</p>}

          {/* Included Services */}
          {services.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Included in this package</h3>
              <ul className="space-y-1">
                {services.map((s, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Photo Strip */}
          {images.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Gallery</h3>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((url, i) => (
                  <img key={i} src={url} alt="" className="h-24 w-32 object-cover rounded-xl flex-shrink-0" onError={e => e.target.remove()} />
                ))}
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="bg-cream-50 border border-forest-100 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Starting Price</p>
            <p className="text-2xl font-display font-bold text-forest-700 mt-1">₹{fmt(pkg.startingPrice)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Final price customised based on guest count & selected services</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1">Close</button>
          <button onClick={() => onBook(pkg)} className="btn-primary flex-1">Book This Package</button>
        </div>
      </div>
    </div>
  );
}

// ── Package Card ──────────────────────────────────────────────────────────────
function PackageCard({ pkg, onView }) {
  const ct = CEREMONY_TYPES.find(c => c.value === pkg.ceremonyType);
  const images = Array.isArray(pkg.images) ? pkg.images : [];
  const coverImg = pkg.coverImageUrl || images[0];

  return (
    <div className="card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => onView(pkg)}>
      {/* Image */}
      <div className={`h-44 relative bg-gradient-to-br ${ct?.color || 'from-gray-600 to-gray-800'}`}>
        {coverImg && <img src={coverImg} alt={pkg.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e => e.target.remove()} />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2 py-0.5 rounded-full text-gray-800">
          {ct?.icon} {ct?.label}
        </span>
        <div className="absolute bottom-2 left-3 right-3">
          <p className="font-display font-bold text-white text-base line-clamp-1">{pkg.name}</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          {pkg.property?.name && <span className="flex items-center gap-1 truncate"><MapPinIcon className="h-3.5 w-3.5" />{pkg.property.name}</span>}
          <span className="flex items-center gap-1 ml-auto flex-shrink-0"><UsersIcon className="h-3.5 w-3.5" />{pkg.guestCapacity}</span>
        </div>
        {pkg.description && <p className="text-sm text-gray-600 line-clamp-2 mb-3">{pkg.description}</p>}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Starting from</p>
            <p className="text-lg font-bold text-forest-700">₹{fmt(pkg.startingPrice)}</p>
          </div>
          <button className="btn-primary text-xs px-3 py-1.5" onClick={e => { e.stopPropagation(); onView(pkg); }}>View Details</button>
        </div>
      </div>
    </div>
  );
}

// ── Photography Service Card ───────────────────────────────────────────────────
function PhotoServiceCard({ service, selected, onToggle }) {
  const images = Array.isArray(service.images) ? service.images : [];
  return (
    <div
      onClick={onToggle}
      className={`card p-4 cursor-pointer transition-all border-2 ${selected ? 'border-forest-600 bg-forest-50' : 'border-transparent hover:border-gray-200'}`}
    >
      {images[0] && <img src={images[0]} alt={service.name} className="w-full h-32 object-cover rounded-lg mb-3" onError={e => e.target.remove()} />}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">{PHOTO_TYPE_LABELS[service.serviceType] || service.serviceType}</span>
          <p className="font-semibold text-gray-900 mt-1 text-sm">{service.name}</p>
          {service.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{service.description}</p>}
        </div>
        <div className="flex-shrink-0 mt-1">
          {selected
            ? <MinusCircleIcon className="h-6 w-6 text-forest-600" />
            : <PlusCircleIcon className="h-6 w-6 text-gray-400" />}
        </div>
      </div>
      <p className="text-base font-bold text-forest-700 mt-2">₹{fmt(service.price)}</p>
    </div>
  );
}

// ── Decoration Service Card ───────────────────────────────────────────────────
function DecorServiceCard({ service, selected, onToggle }) {
  const images = Array.isArray(service.images) ? service.images : [];
  return (
    <div
      onClick={onToggle}
      className={`card p-4 cursor-pointer transition-all border-2 ${selected ? 'border-gold-500 bg-gold-50' : 'border-transparent hover:border-gray-200'}`}
    >
      {images[0] && <img src={images[0]} alt={service.name} className="w-full h-32 object-cover rounded-lg mb-3" onError={e => e.target.remove()} />}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs bg-pink-100 text-pink-700 font-semibold px-2 py-0.5 rounded-full">{DECOR_TYPE_LABELS[service.serviceType] || service.serviceType}</span>
          <p className="font-semibold text-gray-900 mt-1 text-sm">{service.name}</p>
          {service.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{service.description}</p>}
        </div>
        <div className="flex-shrink-0 mt-1">
          {selected
            ? <MinusCircleIcon className="h-6 w-6 text-gold-600" />
            : <PlusCircleIcon className="h-6 w-6 text-gray-400" />}
        </div>
      </div>
      <p className="text-base font-bold text-forest-700 mt-2">₹{fmt(service.price)}</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ExploreWeddingPackages() {
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState('ALL');
  const [viewPkg, setViewPkg] = useState(null);
  const [selectedPhotography, setSelectedPhotography] = useState([]);
  const [selectedDecoration, setSelectedDecoration] = useState([]);
  const [galleryProperty, setGalleryProperty] = useState('');
  const [galleryCategory, setGalleryCategory] = useState('ALL');

  const { data: packagesData } = useQuery({
    queryKey: ['public-wedding-pkgs', activeType],
    queryFn: () => api.get('/wedding/packages', { params: activeType !== 'ALL' ? { ceremonyType: activeType } : {} }).then(r => r.data),
  });
  const packages = packagesData?.packages || [];

  const { data: photoServices = [] } = useQuery({
    queryKey: ['public-photography'],
    queryFn: () => api.get('/wedding/photography').then(r => r.data),
  });

  const { data: decorServices = [] } = useQuery({
    queryKey: ['public-decoration'],
    queryFn: () => api.get('/wedding/decoration').then(r => r.data),
  });

  const { data: gallery = [] } = useQuery({
    queryKey: ['public-gallery', galleryProperty, galleryCategory],
    queryFn: () => api.get('/wedding/gallery', { params: { propertyId: galleryProperty, category: galleryCategory !== 'ALL' ? galleryCategory : undefined } }).then(r => r.data),
    enabled: Boolean(galleryProperty),
  });

  // Unique properties for gallery selector
  const galleryProperties = useMemo(() => {
    const seen = new Set();
    return [...photoServices, ...decorServices].reduce((acc, s) => {
      if (s.property && !seen.has(s.property.id)) { seen.add(s.property.id); acc.push(s.property); }
      return acc;
    }, []);
  }, [photoServices, decorServices]);

  // Photography toggle
  const togglePhoto = (id) => setSelectedPhotography(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleDecor = (id) => setSelectedDecoration(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Price calculation
  const selectedPhotoServices = photoServices.filter(s => selectedPhotography.includes(s.id));
  const selectedDecorServices = decorServices.filter(s => selectedDecoration.includes(s.id));
  const photoTotal = selectedPhotoServices.reduce((sum, s) => sum + Number(s.price), 0);
  const decorTotal = selectedDecorServices.reduce((sum, s) => sum + Number(s.price), 0);
  const hasSelections = selectedPhotography.length > 0 || selectedDecoration.length > 0;

  const GALLERY_CATS = ['ALL', 'GENERAL', 'INTERIOR', 'EXTERIOR', 'STAGE', 'DECORATION', 'ROOM', 'POOL'];

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-forest-800 via-forest-700 to-forest-900 text-white py-14 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-4xl">💍</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-3 mb-2">Explore Wedding Packages</h1>
          <p className="text-forest-200 text-lg max-w-xl mx-auto">
            Complete wedding ceremonies, photography, and decoration — all in one place
          </p>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-12">

        {/* ── Ceremony Type Filter ── */}
        <section>
          <div className="flex flex-wrap gap-3 justify-center">
            {CEREMONY_TYPES.map(ct => (
              <button
                key={ct.value}
                onClick={() => setActiveType(ct.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all ${
                  activeType === ct.value
                    ? 'bg-forest-700 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-forest-300'
                }`}
              >
                <span>{ct.icon}</span> {ct.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Wedding Packages ── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <SparklesIcon className="h-6 w-6 text-gold-500" />
            <h2 className="font-display text-2xl font-bold text-gray-900">
              {CEREMONY_TYPES.find(c => c.value === activeType)?.label || 'Wedding Packages'}
            </h2>
          </div>

          {packages.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <SparklesIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No packages available for the selected ceremony type.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map(pkg => (
                <PackageCard key={pkg.id} pkg={pkg} onView={setViewPkg} />
              ))}
            </div>
          )}
        </section>

        {/* ── Photography Services ── */}
        {photoServices.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-2">
              <CameraIcon className="h-6 w-6 text-blue-500" />
              <h2 className="font-display text-2xl font-bold text-gray-900">Photography Services</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5">Select the photography services you want to add to your wedding</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {photoServices.map(s => (
                <PhotoServiceCard
                  key={s.id}
                  service={s}
                  selected={selectedPhotography.includes(s.id)}
                  onToggle={() => togglePhoto(s.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Decoration Services ── */}
        {decorServices.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-2">
              <StarIcon className="h-6 w-6 text-pink-500" />
              <h2 className="font-display text-2xl font-bold text-gray-900">Decoration Services</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5">Customize your wedding decoration</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {decorServices.map(s => (
                <DecorServiceCard
                  key={s.id}
                  service={s}
                  selected={selectedDecoration.includes(s.id)}
                  onToggle={() => toggleDecor(s.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Price Summary ── */}
        {hasSelections && (
          <section className="sticky bottom-4 z-30">
            <div className="bg-white border border-forest-200 rounded-2xl shadow-xl p-5">
              <h3 className="font-display font-bold text-gray-900 mb-3">Your Selected Services</h3>
              <div className="space-y-2 mb-4">
                {selectedPhotoServices.map(s => (
                  <div key={s.id} className="flex justify-between text-sm text-gray-700">
                    <span className="flex items-center gap-1.5"><CameraIcon className="h-3.5 w-3.5 text-blue-500" />{s.name}</span>
                    <span className="font-medium">₹{fmt(s.price)}</span>
                  </div>
                ))}
                {selectedDecorServices.map(s => (
                  <div key={s.id} className="flex justify-between text-sm text-gray-700">
                    <span className="flex items-center gap-1.5"><StarIcon className="h-3.5 w-3.5 text-pink-500" />{s.name}</span>
                    <span className="font-medium">₹{fmt(s.price)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                  <span>Add-on Total</span>
                  <span className="text-forest-700">₹{fmt(photoTotal + decorTotal)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-3">Package price + add-ons calculated at checkout. Contact the venue to confirm availability.</p>
              <button
                onClick={() => navigate('/search')}
                className="btn-primary w-full"
              >
                Browse Venues & Book
              </button>
            </div>
          </section>
        )}

        {/* ── Venue Photo Gallery ── */}
        {galleryProperties.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-5">Venue Photo Gallery</h2>
            <div className="flex flex-wrap gap-3 mb-4">
              <select
                className="input w-56"
                value={galleryProperty}
                onChange={e => { setGalleryProperty(e.target.value); setGalleryCategory('ALL'); }}
              >
                <option value="">Select a venue…</option>
                {galleryProperties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {galleryProperty && (
                <div className="flex gap-1 flex-wrap">
                  {GALLERY_CATS.map(c => (
                    <button key={c} onClick={() => setGalleryCategory(c)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${galleryCategory === c ? 'bg-forest-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-forest-300'}`}>
                      {c === 'ALL' ? 'All' : c.charAt(0) + c.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!galleryProperty ? (
              <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
                Select a venue above to view its photo gallery
              </div>
            ) : gallery.length === 0 ? (
              <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">No photos available for this category.</div>
            ) : (
              <div className="columns-2 sm:columns-3 md:columns-4 gap-3 space-y-3">
                {gallery.map(p => (
                  <div key={p.id} className="break-inside-avoid rounded-xl overflow-hidden bg-gray-100">
                    <img src={p.url} alt={p.altText || ''} className="w-full object-cover hover:opacity-90 transition-opacity" onError={e => e.target.closest('div').remove()} />
                    {p.altText && <p className="text-xs text-gray-500 px-2 py-1">{p.altText}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>

      {/* Package Detail Modal */}
      {viewPkg && (
        <PackageModal
          pkg={viewPkg}
          onClose={() => setViewPkg(null)}
          onBook={(pkg) => {
            setViewPkg(null);
            navigate(`/venue/${pkg.property?.slug || ''}?pkg=${pkg.id}`);
          }}
        />
      )}
    </div>
  );
}
