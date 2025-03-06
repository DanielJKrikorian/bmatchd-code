import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, MapPin, Award } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import BackToDashboard from '../../components/BackToDashboard';
import MediaUpload from '../../components/MediaUpload'; // Adjusted to climb two levels

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
    serviceAreas: [] as string[],
    availability: '',
    yearsExperience: '',
    specialties: [] as string[]
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

      setFormData({
        businessName: vendorData.business_name || '',
        category: vendorData.category || '',
        description: vendorData.description || '',
        location: vendorData.location || '',
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
        serviceAreas: vendorData.service_areas || [],
        availability: vendorData.availability || '',
        yearsExperience: vendorData.years_experience || '',
        specialties: vendorData.specialties || []
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updates = {
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
        service_areas: formData.serviceAreas,
        availability: formData.availability,
        years_experience: formData.yearsExperience,
        specialties: formData.specialties
      };

      const { error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-12 h-12 animate-spin text-primary" /> Loading settings...
    </div>
  );

  return (
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
            <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:outline-none"
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

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorSettings;