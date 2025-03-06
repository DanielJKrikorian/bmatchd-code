import { useState, useEffect, useCallback } from 'react'; // Removed unused React import
import { useNavigate } from 'react-router-dom';
import { Heart, Search, Star, MapPin, Filter } from 'lucide-react'; // Removed unused DollarSign, Crown, Award
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface City {
  id: string;
  name: string;
  state: string;
}

interface Review {
  rating: number;
}

interface Vendor {
  id: string;
  business_name: string;
  slug: string;
  category: string;
  location: string;
  price_range: string;
  rating: number;
  images: string[];
  primary_image: number;
  subscription_plan: string | null;
  vendor_service_areas: { city_id: string }[];
  reviews: Review[];
}

const VENDOR_CATEGORIES = [
  'All Categories', 'Venues', 'Photography', 'Videography', 'Wedding Planning', 'Catering', 
  'Bakery', 'Florist', 'Music & Entertainment', 'DJ Services', 'Wedding Bands', 
  'Bridal Wear', 'Groom Wear', 'Jewelry', 'Hair & Makeup', 'Transportation', 
  'Invitations & Stationery', 'Decor & Rentals', 'Lighting', 'Photo Booth', 
  'Wedding Favors', 'Officiants', 'Dance Instruction', 'Travel & Honeymoon', 'Wedding Insurance'
];

const PRICE_RANGES = [
  { label: 'All Prices', value: 'All Prices' },
  { label: 'Budget-Friendly ($)', value: '$' },
  { label: 'Moderate ($$)', value: '$$' },
  { label: 'Premium ($$$)', value: '$$$' },
  { label: 'Luxury ($$$$)', value: '$$$$' }
];

const getPriceRangeValue = (range: string): number => {
  return { '$$$$': 4, '$$$': 3, '$$': 2, '$': 1 }[range] || 0;
};

const VendorSearch = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'All Categories',
    priceRange: 'All Prices',
    rating: 'All Ratings'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [observedVendors, setObservedVendors] = useState<Set<string>>(new Set());

  const getOptimizedImageUrl = (vendor: Vendor) => {
    const primaryIndex = vendor.primary_image || 0;
    const imageUrl = vendor.images[primaryIndex] || vendor.images[0];
    return imageUrl
      ? `${imageUrl}?auto=format&fit=crop&w=400&q=75`
      : 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=75';
  };

  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const vendorId = entry.target.getAttribute('data-vendor-id');
        if (vendorId) setObservedVendors(prev => new Set(prev).add(vendorId));
      }
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    });

    const vendorCards = document.querySelectorAll('.vendor-card');
    vendorCards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [observerCallback, vendors]);

  useEffect(() => {
    loadVendors();
    loadCities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity]);

  const loadCities = async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');
      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
      toast.error('Failed to load cities');
    }
  };

  const loadVendors = async () => {
    try {
      setLoading(true);
      const { data: vendorsData, error } = await supabase
        .from('vendors')
        .select(`
          id,
          business_name,
          slug,
          category,
          location,
          price_range,
          images,
          primary_image,
          subscription_plan,
          vendor_service_areas (city_id),
          reviews (rating)
        `);

      if (error) throw error;

      const vendorsWithRatings = vendorsData.map(vendor => {
        const reviews = vendor.reviews || [];
        const totalRating = reviews.reduce((sum: number, review: Review) => sum + (review.rating || 0), 0);
        const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
        return { ...vendor, rating: averageRating };
      });

      let filteredVendors = Array.from(new Map(
        vendorsWithRatings.map(v => [v.id, v])
      ).values());

      if (selectedCity) {
        filteredVendors = filteredVendors.filter(vendor => 
          vendor.vendor_service_areas?.some((area: { city_id: string }) => area.city_id === selectedCity)
        );
      }

      const sortedVendors = filteredVendors.sort((a, b) => {
        const planPriority = { elite: 3, featured: 2, essential: 1, null: 0 };
        const planA = planPriority[a.subscription_plan as keyof typeof planPriority] || 0;
        const planB = planPriority[b.subscription_plan as keyof typeof planPriority] || 0;
        return planB !== planA ? planB - planA : b.rating - a.rating;
      });

      setVendors(sortedVendors);
    } catch (error) {
      console.error('Error loading vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const filterVendors = () => {
    const searchFiltered = vendors.filter(vendor => {
      if (vendor.subscription_plan === null) return false;

      const searchMatch = !searchTerm || 
        vendor.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!searchMatch) return false;
      if (filters.category !== 'All Categories' && vendor.category !== filters.category) return false;
      if (filters.priceRange !== 'All Prices') {
        const selectedPriceValue = getPriceRangeValue(filters.priceRange);
        const vendorPriceValue = getPriceRangeValue(vendor.price_range);
        if (vendorPriceValue > selectedPriceValue) return false;
      }
      if (filters.rating !== 'All Ratings') {
        const minimumRating = parseFloat(filters.rating.replace('+', ''));
        if (vendor.rating < minimumRating) return false;
      }
      return true;
    });

    const eliteVendors = searchFiltered.filter(v => 
      v.subscription_plan === 'price_1Qm0ipAkjdPARDjPF78SLb2j' ||
      v.subscription_plan === 'price_1Qm0itAkjdPARDjP5L87NBDb' ||
      v.subscription_plan?.toLowerCase() === 'elite'
    );
    const featuredVendors = searchFiltered.filter(v => 
      v.subscription_plan === 'price_1Qm0ivAkjdPARDjPZmvd6zCy' ||
      v.subscription_plan === 'price_1Qm0iyAkjdPARDjPwP6t2XOA' ||
      v.subscription_plan?.toLowerCase() === 'featured'
    );
    const essentialVendors = searchFiltered.filter(v => 
      v.subscription_plan === 'price_1Qm0j3AkjdPARDjPzuQeCIMv' ||
      v.subscription_plan === 'price_1Qm0j0AkjdPARDjPTefXNs7O' ||
      v.subscription_plan?.toLowerCase() === 'essential'
    );

    return { eliteVendors, featuredVendors, essentialVendors };
  };

  const renderVendorSection = (vendors: Vendor[], title: string, badgeColor: string) => (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${badgeColor}`}>
          {vendors.length} {vendors.length === 1 ? 'vendor' : 'vendors'}
        </span>
      </div>
      {vendors.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500">No {title.toLowerCase()} available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="vendor-card text-left w-full transition-transform hover:scale-[1.02] cursor-pointer"
              data-vendor-id={vendor.id}
              onClick={() => navigate(`/vendors/${vendor.slug}`)}
            >
              <div className="bg-white rounded-lg shadow-sm overflow-hidden relative">
                <div className="aspect-[4/3] bg-gray-100">
                  {observedVendors.has(vendor.id) && (
                    <img
                      src={getOptimizedImageUrl(vendor)}
                      alt={vendor.business_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=75';
                      }}
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{vendor.business_name}</h3>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {vendor.location}
                  </div>
                  <div className="flex items-center text-sm">
                    <div className="flex text-yellow-400 mr-1">
                      <Star className={`w-4 h-4 ${vendor.rating > 0 ? 'fill-current' : ''}`} />
                    </div>
                    <span>{vendor.rating.toFixed(1)}</span>
                    <span className="text-gray-600 mx-1">•</span>
                    <span className="text-gray-600">{vendor.price_range}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-8">
      {loading && (
        <div className="text-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600">Loading vendors...</p>
          </div>
        </div>
      )}
      <div className="flex flex-col items-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Find Wedding Vendors</h1>
        <div className="flex gap-4 w-full max-w-2xl">
          <Button size="lg" className="flex-1 relative group" onClick={() => navigate('/vendors/match')}>
            <Heart className="w-5 h-5 mr-2" />
            Match with Vendors
            <span className="absolute -top-3 -right-3 bg-primary text-white text-xs px-2 py-1 rounded-full transform group-hover:scale-110 transition-transform">
              BETA
            </span>
          </Button>
          <Button size="lg" variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </Button>
        </div>
        <div className="w-full max-w-2xl">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vendors..."
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {VENDOR_CATEGORIES.map(category => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <select
                value={filters.priceRange}
                onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {PRICE_RANGES.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All Locations</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}, {city.state}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <select
                value={filters.rating}
                onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option>All Ratings</option>
                <option>4.5+</option>
                <option>4.0+</option>
                <option>3.5+</option>
                <option>3.0+</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setFilters({ category: 'All Categories', priceRange: 'All Prices', rating: 'All Ratings' });
                setSelectedCity('');
                setSearchTerm('');
                loadVendors();
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-gray-600">Showing all matching vendors</p>
      </div>

      {renderVendorSection(
        filterVendors().eliteVendors,
        'Elite Vendors',
        'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800'
      )}
      {renderVendorSection(
        filterVendors().featuredVendors,
        'Featured Vendors',
        'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800'
      )}
      {renderVendorSection(
        filterVendors().essentialVendors,
        'Essential Vendors',
        'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800'
      )}
    </div>
  );
};

export default VendorSearch;