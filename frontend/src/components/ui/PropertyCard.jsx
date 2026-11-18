import { Link } from 'react-router-dom';
import { MapPinIcon, UsersIcon, StarIcon } from '@heroicons/react/24/solid';

const TYPE_LABEL = {
  MANDAP: 'Mandap',
  MARRIAGE_HALL: 'Marriage Hall',
  RESORT: 'Resort',
  BANQUET_HALL: 'Banquet Hall',
  WEDDING_VENUE: 'Wedding Venue',
};

export default function PropertyCard({ property }) {
  const coverImage = property.media?.[0]?.url;
  const price = property.pricingRules?.[0]?.basePrice;

  return (
    <Link to={`/venue/${property.slug}`} className="card group block hover:shadow-card-hover transition-all duration-300">
      {/* Image */}
      <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
        {coverImage ? (
          <img src={coverImage} alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-cream-200">
            <span className="text-3xl">🏛️</span>
          </div>
        )}
        <span className="absolute top-3 left-3 badge bg-forest-600/90 text-white text-xs font-medium backdrop-blur-sm">
          {TYPE_LABEL[property.propertyType] || property.propertyType}
        </span>
        {property.hasAC && (
          <span className="absolute top-3 right-3 badge bg-blue-100/90 text-blue-700 backdrop-blur-sm">AC</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-semibold text-gray-900 text-base leading-tight line-clamp-1 group-hover:text-forest-700 transition-colors">
            {property.name}
          </h3>
          {property.rating > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <StarIcon className="h-4 w-4 text-gold-500" />
              <span className="text-sm font-semibold text-gray-700">{Number(property.rating).toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
          <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0 text-gold-500" />
          <span className="line-clamp-1">
            {property.locationNode?.name}{property.locality ? `, ${property.locality.name}` : ''}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <UsersIcon className="h-3.5 w-3.5" />
            <span>Up to {property.totalCapacity} guests</span>
          </div>
          {price ? (
            <div className="text-right">
              <span className="text-xs text-gray-400">from</span>
              <p className="text-sm font-bold text-forest-700">₹{Number(price).toLocaleString('en-IN')}</p>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
