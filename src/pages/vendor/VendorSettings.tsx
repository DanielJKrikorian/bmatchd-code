import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, MapPin, Award, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import BackToDashboard from '../../components/BackToDashboard';
import MediaUpload from '../../components/MediaUpload';
import CitySelect from '../../components/CitySelect';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    toast.error('An error occurred. Please try again or contact support.');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-red-600">Something went wrong. Please try refreshing the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const VendorSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    category: '',
    description: '',
    location: '',
    priceRange: '',
    email: '',
    phone: '',
    websiteUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    images: [] as string[],
    videos: [] as { url: string; thumbnailTime: number }[],
    primaryImage: 0,
    serviceAreas: [] as string[], // Will store city IDs
    yearsExperience: '',
    specialties: [] as string[],
    slug: ''
  });

  useEffect(() => {
    loadVendorData();
  }, [navigate]);

  const loadVendorData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to access settings');
        navigate('/vendor/register');
        return;
      }

      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (vendorError) throw vendorError;

      // Convert specialties to array, handling string or null
      const specialties = Array.isArray(vendorData.specialties)
        ? vendorData.specialties
        : typeof vendorData.specialties === 'string'
        ? vendorData.specialties.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      // Load service areas from vendor_service_areas
      const { data: serviceAreasData } = await supabase
        .from('vendor_service_areas')
        .select('city_id')
        .eq('vendor_id', vendorData.id);

      const serviceAreas = serviceAreasData?.map((area) => area.city_id) || [];

      setFormData({
        businessName: vendorData.business_name || '',
        category: vendorData.category || '',
        description: vendorData.description || '',
        location: vendorData.location || '', // Load location
        priceRange: vendorData.price_range || '',
        email: vendorData.email || '',
        phone: vendorData.phone || '',
        websiteUrl: vendorData.website_url || '',
        facebookUrl: vendorData.facebook_url || '',
        instagramUrl: vendorData.instagram_url || '',
        youtubeUrl: vendorData.youtube_url || '',
        images: vendorData.images || [],
        videos: vendorData.videos || [],
        primaryImage: vendorData.primary_image || 0,
        serviceAreas: serviceAreas,
        yearsExperience: vendorData.years_experience || '',
        specialties: specialties,
        slug: vendorData.slug || ''
      });
      console.log('Loaded formData:', formData); // Debug log
    } catch (error) {
      console.error('Error loading vendor data:', error);
      toast.error('Failed to load your profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .replace(/--+/g, '-');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!vendorData) throw new Error('Vendor not found');

      let slug = formData.slug.trim();
      if (!slug) {
        slug = generateSlug(formData.businessName);
      } else if (formData.businessName && generateSlug(formData.businessName) !== slug) {
        const originalSlug = (await supabase
          .from('vendors')
          .select('slug')
          .eq('user_id', user.id)
          .single()).data?.slug || '';
        if (originalSlug === slug) {
          slug = generateSlug(formData.businessName);
        }
      }

      const updates = {
        business_name: formData.businessName,
        category: formData.category,
        description: formData.description,
        location: formData.location, // Update location
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
        years_experience: formData.yearsExperience,
        specialties: formData.specialties,
        slug: slug
      };

      const { error: vendorError } = await supabase
        .from('vendors')
        .update(updates)
        .eq('user_id', user.id);

      if (vendorError) throw vendorError;

      // Sync service areas with vendor_service_areas
      await supabase
        .from('vendor_service_areas')
        .delete()
        .eq('vendor_id', vendorData.id);

      if (formData.serviceAreas.length > 0) {
        const serviceAreasInsert = formData.serviceAreas.map((cityId) => ({
          vendor_id: vendorData.id,
          city_id: cityId
        }));
        const { error: serviceAreasError } = await supabase
          .from('vendor_service_areas')
          .insert(serviceAreasInsert);
        if (serviceAreasError) throw serviceAreasError;
      }

      toast.success('Profile updated successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: vendorError } = await supabase
        .from('vendors')
        .delete()
        .eq('user_id', user.id);

      if (vendorError) throw vendorError;

      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

      if (authError) throw authError;

      toast.success('Account deleted successfully');
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-12 h-12 animate-spin text-primary" /> Loading settings...
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="max-w-3xl mx-auto py-12 px-4">
        <BackToDashboard />
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h1 className="text-2xl font-semibold">Edit Profile</h1>
            <p className="text-gray-600">Update your vendor profile information</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">Business Name</label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug (optional)</label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                    placeholder="e.g., my-business-slug"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Description</h2>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                rows={4}
                placeholder="Tell us about your business..."
              />
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Service Areas</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Primary Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Boston, MA"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Areas</label>
                  <CitySelect
                    selectedCities={formData.serviceAreas}
                    onChange={(cities) => setFormData(prev => ({ ...prev, serviceAreas: cities }))}
                    className="w-full" // Ensure full width
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Social Media</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700">Website URL</label>
                  <input
                    type="url"
                    id="websiteUrl"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="facebookUrl" className="block text-sm font-medium text-gray-700">Facebook URL</label>
                  <input
                    type="url"
                    id="facebookUrl"
                    name="facebookUrl"
                    value={formData.facebookUrl}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="instagramUrl" className="block text-sm font-medium text-gray-700">Instagram URL</label>
                  <input
                    type="url"
                    id="instagramUrl"
                    name="instagramUrl"
                    value={formData.instagramUrl}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700">YouTube URL</label>
                  <input
                    type="url"
                    id="youtubeUrl"
                    name="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Media</h2>
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

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="yearsExperience" className="block text-sm font-medium text-gray-700">Years of Experience</label>
                  <input
                    type="number"
                    id="yearsExperience"
                    name="yearsExperience"
                    value={formData.yearsExperience || ''} // Handle null
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="specialties" className="block text-sm font-medium text-gray-700">Specialties (comma-separated)</label>
                  <input
                    type="text"
                    id="specialties"
                    name="specialties"
                    value={formData.specialties.join(', ') || ''} // Handle empty array
                    onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeleteAccount}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default VendorSettings;