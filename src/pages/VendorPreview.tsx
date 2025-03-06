import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, DollarSign, Star, Globe, Facebook, Instagram, Youtube, Mail, Phone, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

// Interface for raw Supabase review data
interface SupabaseReview {
  id: string;
  rating: number;
  content: string;
  response: string | null;
  response_date: string | null;
  created_at: string;
  couple: { partner1_name: string; partner2_name: string }[];
}

interface Review {
  id: string;
  rating: number;
  content: string;
  response: string | null;
  response_date: string | null;
  created_at: string;
  couple: {
    partner1_name: string;
    partner2_name: string;
  };
}

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

interface Vendor {
  id: string;
  business_name: string;
  slug: string;
  description: string;
  location: string;
  price_range: string;
  rating: number;
  images: string[];
  primary_image: number;
  email: string;
  phone: string;
  website_url: string;
  facebook_url: string;
  instagram_url: string;
  youtube_url: string;
}

const VendorPreview = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);

  const loadVendorData = useCallback(async () => {
    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select(`
          id,
          business_name,
          slug,
          description,
          location,
          price_range,
          rating,
          images,
          primary_image,
          email,
          phone,
          website_url,
          facebook_url,
          instagram_url,
          youtube_url,
          reviews (
            id,
            rating,
            content,
            response,
            response_date,
            created_at,
            couple:couples (
              partner1_name,
              partner2_name
            )
          ),
          vendor_packages (
            id,
            name,
            description,
            price,
            features
          )
        `)
        .eq('slug', slug)
        .single();

      if (vendorError) throw vendorError;
      if (!vendorData) {
        toast.error('Vendor not found');
        navigate('/dashboard');
        return;
      }

      setVendor(vendorData);
      // Map SupabaseReview to Review interface
      setReviews(vendorData.reviews.map((review: SupabaseReview) => ({
        id: review.id,
        rating: review.rating,
        content: review.content,
        response: review.response,
        response_date: review.response_date,
        created_at: review.created_at,
        couple: review.couple[0] // Take first item from array
      })) || []);
      setPackages(vendorData.vendor_packages || []);
    } catch (error) {
      console.error('Error loading vendor:', error);
      toast.error('Failed to load vendor profile');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [slug, navigate]);

  useEffect(() => {
    loadVendorData();
  }, [slug, loadVendorData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading preview...</p>
      </div>
    );
  }

  if (!vendor) return null;

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Hero Section */}
      <div className="relative h-64 md:h-96 rounded-lg overflow-hidden mb-8">
        <img
          src={vendor.images[0] || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80'}
          alt={`${vendor.business_name} cover`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-8 text-white">
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white"
              onClick={() => navigate('/vendor/settings')}
            >
              <Eye className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
          
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">{vendor.business_name}</h1>
            <div className="flex flex-wrap items-center gap-3 md:gap-6 text-sm md:text-base">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="ml-1">{vendor.rating.toFixed(1)}</span>
                <span className="ml-1">({reviews.length} reviews)</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-5 h-5" />
                <span className="ml-1">{vendor.location}</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-5 h-5" />
                <span className="ml-1">{vendor.price_range}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-8 flex flex-wrap gap-6 items-center justify-between">
        {/* Contact Info */}
        <div className="flex items-center gap-6">
          {vendor.email && (
            <div className="flex items-center text-gray-600">
              <Mail className="w-4 h-4 mr-2" />
              <span>{vendor.email}</span>
            </div>
          )}
          {vendor.phone && (
            <div className="flex items-center text-gray-600">
              <Phone className="w-4 h-4 mr-2" />
              <span>{vendor.phone}</span>
            </div>
          )}
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-4">
          {vendor.website_url && (
            <a
              href={vendor.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-primary"
              title="Website"
            >
              <Globe className="w-5 h-5" />
            </a>
          )}
          {vendor.facebook_url && (
            <a
              href={vendor.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-primary"
              title="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
          )}
          {vendor.instagram_url && (
            <a
              href={vendor.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-primary"
              title="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
          )}
          {vendor.youtube_url && (
            <a
              href={vendor.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-primary"
              title="YouTube"
            >
              <Youtube className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* About Section */}
          <section className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-semibold mb-4">About</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{vendor.description}</p>
          </section>

          {/* Service Packages Section */}
          {packages.length > 0 && (
            <section className="bg-white rounded-lg shadow-sm p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-semibold mb-4">Service Packages</h2>
              <div className="grid gap-4">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{pkg.name}</h3>
                        {pkg.description && (
                          <p className="text-gray-600 mb-4">{pkg.description}</p>
                        )}
                        {pkg.features && pkg.features.length > 0 && (
                          <ul className="list-disc list-inside text-gray-600 space-y-1">
                            {pkg.features.map((feature, index) => (
                              <li key={index}>{feature}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          ${pkg.price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Gallery Section */}
          {vendor.images.length > 0 && (
            <section className="bg-white rounded-lg shadow-sm p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-semibold mb-4">Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vendor.images.map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                  >
                    <img
                      src={image}
                      alt={`${vendor.business_name} gallery ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reviews Section */}
          <section className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl md:text-2xl font-semibold">Reviews</h2>
            </div>
            {reviews.length === 0 ? (
              <p className="text-gray-600">No reviews yet</p>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b last:border-b-0 pb-6 last:pb-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${i < review.rating ? 'fill-current' : 'stroke-current fill-none'}`}
                          />
                        ))}
                      </div>
                      <span className="text-gray-600">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-medium mb-2">
                      {review.couple.partner1_name} & {review.couple.partner2_name}
                    </p>
                    <p className="text-gray-600">{review.content}</p>
                    {review.response && (
                      <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium mb-2">Response from {vendor.business_name}</p>
                        <p className="text-gray-600">{review.response}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Responded on {new Date(review.response_date!).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
            <div className="space-y-4">
              {vendor.email && (
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <span>{vendor.email}</span>
                </div>
              )}
              {vendor.phone && (
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <span>{vendor.phone}</span>
                </div>
              )}
              {vendor.location && (
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                  <span>{vendor.location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Rating</span>
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                  <span>{vendor.rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Reviews</span>
                <span>{reviews.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Packages</span>
                <span>{packages.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPreview;