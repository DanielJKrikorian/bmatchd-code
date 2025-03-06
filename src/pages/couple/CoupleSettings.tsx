import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, MapPin, Music, Utensils } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import BackToDashboard from '../../components/BackToDashboard';
import MediaUpload from '../../components/MediaUpload'; // Updated

const CoupleSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    partner1Name: '',
    partner2Name: '',
    weddingDate: '',
    venue: '',
    venueAddress: '',
    hotelName: '',
    hotelAddress: '',
    hotelWebsite: '',
    hotelNotes: '',
    hotelRoomBlock: '',
    hotelDeadline: '',
    howWeMet: '',
    proposalStory: '',
    relationshipStory: '',
    images: [] as string[],
    videos: [] as string[], // Added
    primaryImage: 0,
    allowSongRequests: false,
    mealOptions: {
      standard_name: 'Standard',
      standard_description: 'A traditional plated dinner',
      vegetarian_name: 'Vegetarian',
      vegetarian_description: 'A plant-based meal with dairy',
      vegan_name: 'Vegan',
      vegan_description: 'A fully plant-based meal'
    }
  });

  useEffect(() => {
    loadCoupleData();
  }, [navigate]);

  const loadCoupleData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to access settings');
        navigate('/couple/register');
        return;
      }

      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (coupleError) {
        console.error('Error loading couple data:', coupleError);
        toast.error('Failed to load your profile');
        return;
      }

      setFormData({
        partner1Name: coupleData.partner1_name || '',
        partner2Name: coupleData.partner2_name || '',
        weddingDate: coupleData.wedding_date ? new Date(coupleData.wedding_date).toISOString().split('T')[0] : '',
        venue: coupleData.venue || '',
        venueAddress: coupleData.venue_address || '',
        hotelName: coupleData.hotel_name || '',
        hotelAddress: coupleData.hotel_address || '',
        hotelWebsite: coupleData.hotel_website || '',
        hotelNotes: coupleData.hotel_notes || '',
        hotelRoomBlock: coupleData.hotel_room_block || '',
        hotelDeadline: coupleData.hotel_deadline ? new Date(coupleData.hotel_deadline).toISOString().split('T')[0] : '',
        howWeMet: coupleData.how_we_met || '',
        proposalStory: coupleData.proposal_story || '',
        relationshipStory: coupleData.relationship_story || '',
        images: coupleData.images || [],
        videos: coupleData.videos || [], // Added
        primaryImage: coupleData.primary_image || 0,
        allowSongRequests: coupleData.allow_song_requests || false,
        mealOptions: coupleData.meal_options || {
          standard_name: 'Standard',
          standard_description: 'A traditional plated dinner',
          vegetarian_name: 'Vegetarian',
          vegetarian_description: 'A plant-based meal with dairy',
          vegan_name: 'Vegan',
          vegan_description: 'A fully plant-based meal'
        }
      });
    } catch (error) {
      console.error('Error loading couple data:', error);
      toast.error('Failed to load your profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleMealOptionChange = (type: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      mealOptions: {
        ...prev.mealOptions,
        [`${type}_${field}`]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updates = {
        partner1_name: formData.partner1Name,
        partner2_name: formData.partner2Name,
        wedding_date: formData.weddingDate || null,
        venue: formData.venue,
        venue_address: formData.venueAddress,
        hotel_name: formData.hotelName,
        hotel_address: formData.hotelAddress,
        hotel_website: formData.hotelWebsite,
        hotel_notes: formData.hotelNotes,
        hotel_room_block: formData.hotelRoomBlock,
        hotel_deadline: formData.hotelDeadline || null,
        how_we_met: formData.howWeMet,
        proposal_story: formData.proposalStory,
        relationship_story: formData.relationshipStory,
        images: formData.images,
        videos: formData.videos, // Added
        primary_image: formData.primaryImage,
        allow_song_requests: formData.allowSongRequests,
        meal_options: formData.mealOptions
      };

      const { error: updateError } = await supabase
        .from('couples')
        .update(updates)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast.success('Profile updated successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <BackToDashboard />
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b">
          <h1 className="text-2xl font-semibold">Edit Profile</h1>
          <p className="text-gray-600">Update your couple profile information</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="partner1Name" className="block text-sm font-medium text-gray-700">
                  Partner 1 Name
                </label>
                <input
                  type="text"
                  id="partner1Name"
                  name="partner1Name"
                  required
                  value={formData.partner1Name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="partner2Name" className="block text-sm font-medium text-gray-700">
                  Partner 2 Name
                </label>
                <input
                  type="text"
                  id="partner2Name"
                  name="partner2Name"
                  required
                  value={formData.partner2Name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Wedding Details */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Wedding Details</h2>
            
            <div>
              <label htmlFor="weddingDate" className="block text-sm font-medium text-gray-700">
                Wedding Date
              </label>
              <input
                type="date"
                id="weddingDate"
                name="weddingDate"
                value={formData.weddingDate}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="venue" className="block text-sm font-medium text-gray-700">
                Venue Name
              </label>
              <input
                type="text"
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., The Grand Ballroom"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="venueAddress" className="block text-sm font-medium text-gray-700">
                Venue Address
              </label>
              <textarea
                id="venueAddress"
                name="venueAddress"
                value={formData.venueAddress}
                onChange={handleChange}
                rows={2}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter the complete venue address"
              />
            </div>
          </div>

          {/* Travel & Accommodation */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Travel & Accommodation</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="hotelName" className="block text-sm font-medium text-gray-700">
                  Hotel Name
                </label>
                <input
                  type="text"
                  id="hotelName"
                  name="hotelName"
                  value={formData.hotelName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g., The Grand Hotel"
                />
              </div>

              <div>
                <label htmlFor="hotelAddress" className="block text-sm font-medium text-gray-700">
                  Hotel Address
                </label>
                <textarea
                  id="hotelAddress"
                  name="hotelAddress"
                  value={formData.hotelAddress}
                  onChange={handleChange}
                  rows={2}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Enter the complete hotel address"
                />
              </div>

              <div>
                <label htmlFor="hotelWebsite" className="block text-sm font-medium text-gray-700">
                  Hotel Website
                </label>
                <input
                  type="url"
                  id="hotelWebsite"
                  name="hotelWebsite"
                  value={formData.hotelWebsite}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label htmlFor="hotelRoomBlock" className="block text-sm font-medium text-gray-700">
                  Room Block Code
                </label>
                <input
                  type="text"
                  id="hotelRoomBlock"
                  name="hotelRoomBlock"
                  value={formData.hotelRoomBlock}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Enter room block code or group name"
                />
              </div>

              <div>
                <label htmlFor="hotelDeadline" className="block text-sm font-medium text-gray-700">
                  Room Block Deadline
                </label>
                <input
                  type="date"
                  id="hotelDeadline"
                  name="hotelDeadline"
                  value={formData.hotelDeadline}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="hotelNotes" className="block text-sm font-medium text-gray-700">
                  Additional Hotel Information
                </label>
                <textarea
                  id="hotelNotes"
                  name="hotelNotes"
                  value={formData.hotelNotes}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Enter any additional information about hotel accommodations, parking, shuttle service, etc."
                />
              </div>
            </div>
          </div>

          {/* Guest Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Guest Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowSongRequests"
                  name="allowSongRequests"
                  checked={formData.allowSongRequests}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className="flex items-center">
                  <Music className="w-4 h-4 mr-2 text-gray-500" />
                  <label htmlFor="allowSongRequests" className="text-sm font-medium text-gray-700">
                    Allow guests to request songs
                  </label>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center mb-2">
                  <Utensils className="w-5 h-5 text-gray-500 mr-2" />
                  <h3 className="font-medium">Meal Options</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Standard Option
                    </label>
                    <input
                      type="text"
                      value={formData.mealOptions.standard_name}
                      onChange={(e) => handleMealOptionChange('standard', 'name', e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g., Chicken & Fish"
                    />
                    <textarea
                      value={formData.mealOptions.standard_description}
                      onChange={(e) => handleMealOptionChange('standard', 'description', e.target.value)}
                      className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      rows={2}
                      placeholder="Describe the standard meal option..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Vegetarian Option
                    </label>
                    <input
                      type="text"
                      value={formData.mealOptions.vegetarian_name}
                      onChange={(e) => handleMealOptionChange('vegetarian', 'name', e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g., Grilled Vegetable Plate"
                    />
                    <textarea
                      value={formData.mealOptions.vegetarian_description}
                      onChange={(e) => handleMealOptionChange('vegetarian', 'description', e.target.value)}
                      className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      rows={2}
                      placeholder="Describe the vegetarian option..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Vegan Option
                    </label>
                    <input
                      type="text"
                      value={formData.mealOptions.vegan_name}
                      onChange={(e) => handleMealOptionChange('vegan', 'name', e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g., Plant-Based Entrée"
                    />
                    <textarea
                      value={formData.mealOptions.vegan_description}
                      onChange={(e) => handleMealOptionChange('vegan', 'description', e.target.value)}
                      className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      rows={2}
                      placeholder="Describe the vegan option..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Photos */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Photos & Videos</h2>
            <MediaUpload
              images={formData.images}
              videos={formData.videos}
              primaryImage={formData.primaryImage}
              onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
              onVideosChange={(videos) => setFormData(prev => ({ ...prev, videos }))}
              onPrimaryChange={(index) => setFormData(prev => ({ ...prev, primaryImage: index }))}
              userRole="couple"
            />
          </div>

          {/* Love Story */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Your Love Story</h2>
            
            <div>
              <label htmlFor="howWeMet" className="block text-sm font-medium text-gray-700">
                How We Met
              </label>
              <textarea
                id="howWeMet"
                name="howWeMet"
                value={formData.howWeMet}
                onChange={handleChange}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Share your story..."
              />
            </div>

            <div className="mt-4">
              <label htmlFor="proposalStory" className="block text-sm font-medium text-gray-700">
                Proposal Story
              </label>
              <textarea
                id="proposalStory"
                name="proposalStory"
                value={formData.proposalStory}
                onChange={handleChange}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Tell us about the proposal..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CoupleSettings;