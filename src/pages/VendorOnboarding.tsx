import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Globe, Facebook, Instagram, Youtube, MapPin, DollarSign, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'react-hot-toast';
import CitySelect from '../components/CitySelect';
import MediaUpload from '../components/MediaUpload'; // Updated from ImageUpload
import { supabase } from '../lib/supabase';

const VENDOR_CATEGORIES = [
  'Venues', 'Photography', 'Videography', 'Wedding Planning', 'Catering', 'Bakery', 'Florist',
  'Music & Entertainment', 'DJ Services', 'Wedding Bands', 'Bridal Wear', 'Groom Wear', 'Jewelry',
  'Hair & Makeup', 'Transportation', 'Invitations & Stationery', 'Decor & Rentals', 'Lighting',
  'Photo Booth', 'Wedding Favors', 'Officiants', 'Dance Instruction', 'Travel & Honeymoon',
  'Wedding Insurance'
];

interface OnboardingData {
  businessName: string;
  category: string;
  description: string;
  location: string;
  priceRange: string;
  email: string;
  phone: string;
  websiteUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  selectedCities: string[];
  images: string[];
  videos: { url: string; thumbnailTime: number }[];
  primaryImage: number;
}

const VendorOnboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    businessName: '',
    category: '',
    description: '',
    location: '',
    priceRange: 'Premium',
    email: '',
    phone: '',
    websiteUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    selectedCities: [],
    images: [],
    videos: [],
    primaryImage: 0
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/vendor/register');
        return;
      }

      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (vendorError && !vendorError.message.includes('No rows found')) {
        console.error('Error loading vendor:', vendorError);
        toast.error('Failed to load vendor profile');
        return;
      }

      if (vendorData) {
        setFormData(prev => ({
          ...prev,
          businessName: vendorData.business_name || '',
          category: vendorData.category || '',
          description: vendorData.description || '',
          location: vendorData.location || '',
          priceRange: vendorData.price_range || 'Premium',
          email: vendorData.email || '',
          phone: vendorData.phone || '',
          websiteUrl: vendorData.website_url || '',
          facebookUrl: vendorData.facebook_url || '',
          instagramUrl: vendorData.instagram_url || '',
          youtubeUrl: vendorData.youtube_url || '',
          images: vendorData.images || [],
          videos: vendorData.videos || [],
          primaryImage: vendorData.primary_image || 0
        }));

        const { data: serviceAreas } = await supabase
          .from('vendor_service_areas')
          .select('city_id')
          .eq('vendor_id', vendorData.id);

        setFormData(prev => ({
          ...prev,
          selectedCities: serviceAreas?.map(area => area.city_id) || []
        }));
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      toast.error('Authentication error');
      navigate('/vendor/register');
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (vendorError && !vendorError.message.includes('No rows found')) {
        throw vendorError;
      }

      let vendorId;

      if (vendorData) {
        const { error: updateError } = await supabase
          .from('vendors')
          .update({
            business_name: formData.businessName,
            category: formData.category,
            description: formData.description,
            location: formData.location,
            price_range: formData.priceRange,
            email: formData.email,
            phone: formData.phone,
            website_url: formData.websiteUrl,
            facebook_url: formData.facebookUrl,
            instagram_url: formData.instagramUrl,
            youtube_url: formData.youtubeUrl,
            images: formData.images,
            videos: formData.videos,
            primary_image: formData.primaryImage
          })
          .eq('id', vendorData.id);

        if (updateError) throw updateError;
        vendorId = vendorData.id;
      } else {
        const { data: newVendor, error: createError } = await supabase
          .from('vendors')
          .insert([{
            user_id: user.id,
            business_name: formData.businessName,
            category: formData.category,
            description: formData.description,
            location: formData.location,
            price_range: formData.priceRange,
            email: formData.email,
            phone: formData.phone,
            website_url: formData.websiteUrl,
            facebook_url: formData.facebookUrl,
            instagram_url: formData.instagramUrl,
            youtube_url: formData.youtubeUrl,
            images: formData.images,
            videos: formData.videos,
            primary_image: formData.primaryImage,
            rating: 0
          }])
          .select()
          .single();

        if (createError) throw createError;
        vendorId = newVendor.id;
      }

      if (vendorId && formData.selectedCities.length > 0) {
        await supabase
          .from('vendor_service_areas')
          .delete()
          .eq('vendor_id', vendorId);

        const { error: serviceAreasError } = await supabase
          .from('vendor_service_areas')
          .insert(
            formData.selectedCities.map(cityId => ({
              vendor_id: vendorId,
              city_id: cityId
            }))
          );

        if (serviceAreasError) {
          console.error('Error adding service areas:', serviceAreasError);
        }
      }

      toast.success('Profile updated successfully!');
      navigate('/dashboard'); // Changed from /subscription
    } catch (error: any) {
      console.error('Error updating vendor profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between">
            {[1, 2, 3, 4, 5, 6].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`flex items-center ${
                  stepNumber < 6 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= stepNumber
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 6 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > stepNumber ? 'bg-primary' : 'bg-gray-100'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
                <p className="text-gray-600">Tell us about your business</p>
              </div>

              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                  Business Name
                </label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  required
                  value={formData.businessName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select a category</option>
                  {VENDOR_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : step === 2 ? (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Contact Information</h2>
                <p className="text-gray-600">How can couples reach you?</p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Business Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Business Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          ) : step === 3 ? (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Business Description</h2>
                <p className="text-gray-600">Tell couples about your services</p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Describe your services, experience, and what makes you unique..."
                />
              </div>

              <div>
                <label htmlFor="priceRange" className="block text-sm font-medium text-gray-700">
                  Price Range
                </label>
                <select
                  id="priceRange"
                  name="priceRange"
                  required
                  value={formData.priceRange}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Budget">$ (Budget-Friendly)</option>
                  <option value="Moderate">$$ (Moderate)</option>
                  <option value="Premium">$$$ (Premium)</option>
                  <option value="Luxury">$$$$ (Luxury)</option>
                </select>
              </div>
            </div>
          ) : step === 4 ? (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Service Areas</h2>
                <p className="text-gray-600">Where do you offer your services?</p>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Primary Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Boston, MA"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Service Areas
                </label>
                <CitySelect
                  selectedCities={formData.selectedCities}
                  onChange={(cities) => setFormData(prev => ({ ...prev, selectedCities: cities }))}
                />
              </div>
            </div>
          ) : step === 5 ? (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Online Presence</h2>
                <p className="text-gray-600">Add your website and social media links</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline-block mr-2" />
                  Website URL
                </label>
                <input
                  type="url"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  placeholder="https://www.example.com"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Facebook className="w-4 h-4 inline-block mr-2" />
                  Facebook URL
                </label>
                <input
                  type="url"
                  name="facebookUrl"
                  value={formData.facebookUrl}
                  onChange={handleChange}
                  placeholder="https://www.facebook.com/yourbusiness"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Instagram className="w-4 h-4 inline-block mr-2" />
                  Instagram URL
                </label>
                <input
                  type="url"
                  name="instagramUrl"
                  value={formData.instagramUrl}
                  onChange={handleChange}
                  placeholder="https://www.instagram.com/yourbusiness"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Youtube className="w-4 h-4 inline-block mr-2" />
                  YouTube URL
                </label>
                <input
                  type="url"
                  name="youtubeUrl"
                  value={formData.youtubeUrl}
                  onChange={handleChange}
                  placeholder="https://www.youtube.com/c/yourbusiness"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Gallery</h2>
                <p className="text-gray-600">Add photos and videos of your work</p>
              </div>

              <MediaUpload
                images={formData.images}
                videos={formData.videos}
                primaryImage={formData.primaryImage}
                onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
                onVideosChange={(videos) => setFormData(prev => ({ ...prev, videos }))}
                onPrimaryChange={(index) => setFormData(prev => ({ ...prev, primaryImage: index }))}
                userRole="vendor"
              />
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(prev => prev - 1)}
              >
                Back
              </Button>
            )}
            <div className="ml-auto">
              <Button
                onClick={() => {
                  if (step === 6) {
                    handleSubmit();
                  } else {
                    setStep(prev => prev + 1);
                  }
                }}
                disabled={submitting || (step === 1 && (!formData.businessName || !formData.category))}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : step === 6 ? (
                  <>
                    Finish!
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorOnboarding;