import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPinIcon, UsersIcon, StarIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import PublicHeader from '../../components/layout/PublicHeader';
import PublicFooter from '../../components/layout/PublicFooter';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../context/authStore';
import api from '../../services/api';

const AMENITY_ICONS = { AC: '❄️', Pool: '🏊', Parking: '🚗', Rooms: '🛏️', Catering: '🍽️', Decoration: '🌸', Generator: '⚡', Security: '👮' };

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function AvailabilityCalendar({ bookedDates }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  const goBack = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const goFwd = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDaysIcon className="h-5 w-5 text-forest-500" />
        <h2 className="font-display font-semibold text-gray-900 text-lg">Availability</h2>
      </div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={goBack} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
        </button>
        <span className="font-medium text-sm text-gray-800">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={goFwd} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronRightIcon className="h-4 w-4 text-gray-600" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const isPast = new Date(dateStr) < new Date(today.toISOString().split('T')[0]);
          const isBooked = bookedDates.has(dateStr);
          const isToday = dateStr === today.toISOString().split('T')[0];
          return (
            <div key={day} className={`text-center text-xs py-1.5 rounded-lg font-medium transition-all ${
              isPast ? 'text-gray-300' :
              isBooked ? 'bg-red-100 text-red-500 line-through' :
              isToday ? 'bg-forest-600 text-white' :
              'text-gray-700 hover:bg-green-50'
            }`}>{day}</div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-forest-600 inline-block" />Today</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-100 inline-block" />Booked</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-50 border border-green-200 inline-block" />Available</span>
      </div>
    </div>
  );
}

function ReviewsSection({ reviews, rating, reviewCount }) {
  if (!reviews?.length) return null;
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-gray-900 text-lg">Guest Reviews</h2>
        {rating > 0 && (
          <div className="flex items-center gap-1.5">
            <StarIcon className="h-5 w-5 text-gold-500" />
            <span className="font-bold text-gray-800">{Number(rating).toFixed(1)}</span>
            <span className="text-sm text-gray-500">({reviewCount})</span>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {reviews.map(r => (
          <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-gray-800">{r.customer?.fullName || 'Guest'}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <StarIcon key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'text-gold-400' : 'text-gray-200'}`} />
                ))}
              </div>
            </div>
            {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
            <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' })}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PropertyDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [imgIndex, setImgIndex] = useState(0);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', slug],
    queryFn: () => api.get(`/properties/${slug}`).then(r => r.data),
  });

  const { data: reviews } = useQuery({
    queryKey: ['property-reviews', property?.id],
    queryFn: () => api.get(`/properties/${property.id}/reviews`).then(r => r.data),
    enabled: !!property?.id,
  });

  // Availability: show next 2 months
  const today = new Date();
  const { data: avail1 } = useQuery({
    queryKey: ['property-avail', property?.id, today.getMonth() + 1, today.getFullYear()],
    queryFn: () => api.get(`/properties/${property.id}/availability`, {
      params: { month: today.getMonth() + 1, year: today.getFullYear() },
    }).then(r => r.data),
    enabled: !!property?.id,
  });
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const { data: avail2 } = useQuery({
    queryKey: ['property-avail', property?.id, nextMonth.getMonth() + 1, nextMonth.getFullYear()],
    queryFn: () => api.get(`/properties/${property.id}/availability`, {
      params: { month: nextMonth.getMonth() + 1, year: nextMonth.getFullYear() },
    }).then(r => r.data),
    enabled: !!property?.id,
  });

  const bookedDates = new Set([
    ...(avail1?.bookedDates || []).map(d => d.split('T')[0]),
    ...(avail2?.bookedDates || []).map(d => d.split('T')[0]),
  ]);

  if (isLoading) return <div className="min-h-screen bg-cream-50"><PublicHeader /><LoadingSpinner text="Loading…" /></div>;
  if (!property) return <div className="min-h-screen bg-cream-50"><PublicHeader /><div className="p-8 text-center text-gray-500">Property not found</div></div>;

  const images = property.media?.filter(m => m.mediaType === 'IMAGE') || [];
  const price = property.pricingRules?.[0]?.basePrice;

  const handleBook = () => {
    if (!token) { navigate('/login'); return; }
    if (user?.role !== 'CUSTOMER') return;
    navigate(`/book/${slug}`);
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <PublicHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Gallery */}
        {images.length > 0 && (
          <div className="relative rounded-xl3 overflow-hidden mb-8 aspect-[16/7] bg-gray-100">
            <img src={images[imgIndex]?.url} alt={property.name} className="w-full h-full object-cover" />
            {images.length > 1 && (
              <>
                <button onClick={() => setImgIndex((imgIndex - 1 + images.length) % images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow hover:bg-white transition-all">
                  <ChevronLeftIcon className="h-5 w-5 text-gray-700" />
                </button>
                <button onClick={() => setImgIndex((imgIndex + 1) % images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow hover:bg-white transition-all">
                  <ChevronRightIcon className="h-5 w-5 text-gray-700" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setImgIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === imgIndex ? 'bg-white scale-125' : 'bg-white/50'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="font-display text-3xl font-bold text-gray-900">{property.name}</h1>
                {property.rating > 0 && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <StarIcon className="h-5 w-5 text-gold-500" />
                    <span className="font-bold text-gray-800">{Number(property.rating).toFixed(1)}</span>
                    <span className="text-sm text-gray-500">({property.reviewCount} reviews)</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-gray-600">
                <MapPinIcon className="h-4 w-4 text-gold-500 flex-shrink-0" />
                <span className="text-sm">{property.addressLine}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-gray-600">
                <UsersIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm">Up to {property.totalCapacity} guests</span>
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-display font-semibold text-gray-900 mb-3 text-lg">About this venue</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{property.description}</p>
            </div>

            {/* Halls */}
            {property.halls?.length > 0 && (
              <div className="card p-5">
                <h2 className="font-display font-semibold text-gray-900 mb-4 text-lg">Halls & Spaces</h2>
                <div className="space-y-3">
                  {property.halls.map(hall => (
                    <div key={hall.id} className="flex items-center justify-between p-3 bg-cream-100 rounded-xl">
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{hall.name}</p>
                        <p className="text-xs text-gray-500">Capacity: {hall.capacity} guests{hall.area ? ` · ${hall.area} sq ft` : ''}{hall.hasAC ? ' · AC' : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div className="card p-5">
                <h2 className="font-display font-semibold text-gray-900 mb-4 text-lg">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map(a => (
                    <div key={a.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircleIcon className="h-4 w-4 text-forest-500 flex-shrink-0" />
                      {a.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Availability calendar */}
            <AvailabilityCalendar bookedDates={bookedDates} />

            {/* Reviews */}
            <ReviewsSection reviews={reviews} rating={property.rating} reviewCount={property.reviewCount} />
          </div>

          {/* Booking sidebar */}
          <div className="space-y-5">
            <div className="card p-5 sticky top-24">
              <div className="mb-4">
                {price ? (
                  <>
                    <p className="text-xs text-gray-400">Starting from</p>
                    <p className="text-3xl font-display font-bold text-forest-700">₹{Number(price).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-500">per day + taxes</p>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">Contact for pricing</p>
                )}
              </div>

              {property.owner?.verificationStatus === 'APPROVED' && (
                <div className="flex items-center gap-1.5 text-xs text-green-700 mb-4">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  Verified Owner
                </div>
              )}

              <button onClick={handleBook} className="btn-primary w-full text-center mb-3">
                {token && user?.role === 'CUSTOMER' ? 'Book This Venue' : 'Sign In to Book'}
              </button>

              <p className="text-xs text-gray-400 text-center">Free cancellation · No booking fees</p>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
