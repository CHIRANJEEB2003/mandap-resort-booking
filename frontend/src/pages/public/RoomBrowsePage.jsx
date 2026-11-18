import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import {
  BuildingOffice2Icon,
  MapPinIcon,
  StarIcon,
  MoonIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';

const CATEGORY_BADGE = {
  STANDARD: 'bg-blue-100 text-blue-700',
  DELUXE: 'bg-gold-100 text-gold-700',
  LUXURY: 'bg-purple-100 text-purple-700',
};

function ResortCard({ property, rooms }) {
  const minPrice = rooms.length
    ? Math.min(...rooms.map((r) => Number(r.pricePerNight)))
    : null;

  const categories = [...new Set(rooms.map((r) => r.category))];
  const cover = property.media?.[0]?.url;

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="h-48 bg-gray-100 relative overflow-hidden">
        {cover ? (
          <img src={cover} alt={property.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-forest-50">
            <BuildingOffice2Icon className="h-16 w-16 text-forest-200" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {categories.map((cat) => (
            <span key={cat} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_BADGE[cat]}`}>
              {cat}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-gray-900 text-lg mb-1 leading-tight">
          {property.name}
        </h3>
        {property.locationNode && (
          <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
            <MapPinIcon className="h-4 w-4 flex-shrink-0" />
            {property.locationNode.name}
            {property.locality ? `, ${property.locality.name}` : ''}
          </p>
        )}

        {property.rating > 0 && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
            <StarIcon className="h-4 w-4 text-gold-500 fill-current" />
            <span className="font-medium text-gray-700">{property.rating.toFixed(1)}</span>
            <span>({property.reviewCount} reviews)</span>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-3">{rooms.length} room type{rooms.length !== 1 ? 's' : ''} available</p>

        <div className="mt-auto flex items-center justify-between">
          {minPrice !== null && (
            <div className="flex items-center gap-1 text-forest-700">
              <MoonIcon className="h-4 w-4" />
              <span className="text-sm text-gray-500">from</span>
              <span className="font-bold text-lg">₹{minPrice.toLocaleString('en-IN')}</span>
              <span className="text-sm text-gray-500">/night</span>
            </div>
          )}
          <Link
            to={`/room-booking/${property.id}`}
            className="btn-primary text-sm px-4 py-2"
          >
            View Rooms
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RoomBrowsePage() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/room-booking');
    }
  };
  const { data: propertiesData, isLoading: propertiesLoading } = useQuery({
    queryKey: ['room-browse-properties'],
    queryFn: () =>
      api.get('/properties', { params: { propertyType: 'RESORT', hasRooms: 'true', limit: 50 } }).then((r) => r.data),
  });

  const properties = propertiesData?.properties || [];

  const roomQueries = useQuery({
    queryKey: ['room-browse-rooms', properties.map((p) => p.id).join(',')],
    queryFn: async () => {
      if (!properties.length) return {};
      const results = await Promise.all(
        properties.map((p) =>
          api.get('/rooms', { params: { propertyId: p.id } }).then((r) => ({ id: p.id, rooms: r.data }))
        )
      );
      return Object.fromEntries(results.map((r) => [r.id, r.rooms]));
    },
    enabled: properties.length > 0,
  });

  const roomsByProperty = roomQueries.data || {};

  const resortsWithRooms = properties.filter(
    (p) => roomsByProperty[p.id]?.length > 0
  );

  const isLoading = propertiesLoading || roomQueries.isLoading;

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="bg-forest-700 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              aria-label="Go back">
              <ChevronLeftIcon className="h-4 w-4" />
              Back
            </button>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Room Booking</h1>
          <p className="text-forest-200 text-lg">Book your stay at our premium resorts</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-forest-600 border-t-transparent rounded-full" />
          </div>
        ) : resortsWithRooms.length === 0 ? (
          <div className="text-center py-20">
            <BuildingOffice2Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="font-display font-semibold text-xl text-gray-700 mb-2">No resorts available</h2>
            <p className="text-gray-500">Check back soon for room availability.</p>
          </div>
        ) : (
          <>
            <p className="text-gray-500 mb-6">{resortsWithRooms.length} resort{resortsWithRooms.length !== 1 ? 's' : ''} with rooms available</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {resortsWithRooms.map((property) => (
                <ResortCard
                  key={property.id}
                  property={property}
                  rooms={roomsByProperty[property.id] || []}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
