import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, X, Star, MapPin, DollarSign, ArrowRight, Calendar, Lock, UserCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import CitySelect from '../components/CitySelect';
import type { Vendor } from '../types';

interface MatchPreferences {
  category: string;
  budget: string;
  selectedCities: string[];
  weddingDate: string;
}

const VendorMatch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<'preferences' | 'matching'>('preferences');
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [isHoveringLike, setIsHoveringLike] = useState(false);
  const [isHoveringDislike, setIsHoveringDislike] = useState(false);
  const [showCoachMarks, setShowCoachMarks] = useState(true);
  const [preferences, setPreferences] = useState<MatchPreferences>(() => {
    // Try to get preferences from onboarding data first
    const onboardingData = localStorage.getItem('coupleOnboardingData');
    if (onboardingData) {
      const data = JSON.parse(onboardingData);
      return {
        category: data.interests[0] || '', // Use first interest as category
        budget: data.budget || '',
        selectedCities: data.selectedCities || [],
        weddingDate: data.weddingDate || ''
      };
    }
    
    // Fall back to saved match preferences
    const savedPrefs = localStorage.getItem('matchPreferences');
    return savedPrefs ? JSON.parse(savedPrefs) : {
      category: '',
      budget: '',
      selectedCities: [],
      weddingDate: ''
    };
  });

  useEffect(() => {
    localStorage.setItem('matchPreferences', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    const state = location.state as { 
      vendors?: Vendor[],
      currentIndex?: number,
      preferences?: MatchPreferences
    } | null;

    if (state?.vendors && state.vendors.length > 0) {
      setVendors(state.vendors);
      setCurrentIndex(state.currentIndex || 0);
      if (state.preferences) {
        setPreferences(state.preferences);
      }
      setStep('matching');
    } else {
      // If we have all required preferences, load vendors automatically
      if (preferences.category && preferences.selectedCities.length > 0) {
        loadVendors();
      }
    }
    setLoading(false);

    // Check if user has seen coach marks before
    const hasSeenCoachMarks = localStorage.getItem('hasSeenVendorMatchCoachMarks');
    if (hasSeenCoachMarks) {
      setShowCoachMarks(false);
    }
  }, [location]);

  const loadVendors = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('vendors')
        .select(`
          *,
          vendor_service_areas!inner (
            city_id
          )
        `)
        .eq('category', preferences.category);

      if (preferences.selectedCities.length > 0) {
        query = query.in('vendor_service_areas.city_id', preferences.selectedCities);
      }

      const { data: vendorsData, error } = await query;

      if (error) throw error;

      const uniqueVendors = Array.from(new Map(
        vendorsData.map(v => [v.id, v])
      ).values());

      const sortedVendors = uniqueVendors.sort((a, b) => {
        const planPriority = {
          'elite': 3,
          'featured': 2,
          'essential': 1,
          null: 0
        };

        return (planPriority[b.subscription_plan as keyof typeof planPriority] || 0) - 
               (planPriority[a.subscription_plan as keyof typeof planPriority] || 0);
      });

      setVendors(sortedVendors);
      setCurrentIndex(0);
      setStep('matching');
    } catch (error) {
      console.error('Error loading vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const promptSignIn = () => {
    localStorage.setItem('matchPreferences', JSON.stringify(preferences));
    navigate('/auth', { 
      state: { 
        returnTo: '/vendors/match',
        preferences: preferences
      }
    });
  };

  const handleLike = async () => {
    setShowCoachMarks(false);
    localStorage.setItem('hasSeenVendorMatchCoachMarks', 'true');

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // If not authenticated, show animation and redirect to sign in
        setShowSavePopup(true);
        setTimeout(() => {
          setShowSavePopup(false);
          promptSignIn();
        }, 1500);
        return;
      }

      // Get couple ID
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (coupleError) {
        console.error('Error getting couple data:', coupleError);
        toast.error('Failed to save vendor');
        return;
      }

      // Save vendor
      const { error: saveError } = await supabase
        .from('saved_vendors')
        .insert([{
          couple_id: coupleData.id,
          vendor_id: vendors[currentIndex].id
        }]);

      if (saveError) {
        if (saveError.code === '23505') { // Unique violation
          toast.error('You have already saved this vendor');
        } else {
          console.error('Error saving vendor:', saveError);
          toast.error('Failed to save vendor');
        }
        return;
      }

      // Show success animation
      setShowSavePopup(true);
      setTimeout(() => {
        setShowSavePopup(false);
        setCurrentIndex(prev => prev + 1);
        toast.success('Vendor saved successfully!');
      }, 1500);

    } catch (error) {
      console.error('Error in handleLike:', error);
      toast.error('Failed to save vendor');
    }
  };

  const handleDislike = () => {
    setShowCoachMarks(false);
    localStorage.setItem('hasSeenVendorMatchCoachMarks', 'true');
    setCurrentIndex(prev => prev + 1);
  };

  const handleViewProfile = () => {
    if (currentIndex >= vendors.length) return;
    
    navigate(`/vendors/${vendors[currentIndex].id}`, { 
      state: { 
        fromMatching: true,
        vendors,
        currentIndex,
        preferences
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (step === 'preferences') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-8">Find Your Perfect Vendor Match</h1>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What type of vendor are you looking for?
              </label>
              <select
                value={preferences.category}
                onChange={(e) => setPreferences(prev => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              >
                <option value="">Select a category</option>
                <option value="Photography">Photography</option>
                <option value="Videography">Videography</option>
                <option value="Venues">Venues</option>
                <option value="Catering">Catering</option>
                <option value="Music">Music & Entertainment</option>
                <option value="Florist">Florist</option>
                <option value="Cake">Wedding Cake</option>
                <option value="Planning">Wedding Planning</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's your budget range?
              </label>
              <select
                value={preferences.budget}
                onChange={(e) => setPreferences(prev => ({ ...prev, budget: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              >
                <option value="">Select budget range</option>
                <option value="$">$ (Budget-Friendly)</option>
                <option value="$$">$$ (Moderate)</option>
                <option value="$$$">$$$ (Premium)</option>
                <option value="$$$$">$$$$ (Luxury)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Locations
              </label>
              <CitySelect
                selectedCities={preferences.selectedCities}
                onChange={(cities) => setPreferences(prev => ({ ...prev, selectedCities: cities }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wedding Date
              </label>
              <input
                type="date"
                value={preferences.weddingDate}
                onChange={(e) => setPreferences(prev => ({ ...prev, weddingDate: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <Button 
              className="w-full mt-8" 
              onClick={loadVendors}
              disabled={!preferences.category || preferences.selectedCities.length === 0}
            >
              Start Matching
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if there are no vendors or if we've reached the end
  if (vendors.length === 0 || currentIndex >= vendors.length) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">No more vendors to show</h2>
          <p className="text-gray-600 mb-8">
            {vendors.length === 0 
              ? "No vendors found matching your criteria."
              : "You've seen all available vendors in this category."}
          </p>
          <div className="space-y-4">
            <Button onClick={() => setStep('preferences')}>
              Update Preferences
            </Button>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => navigate('/saved-vendors')}>
                <Heart className="w-4 h-4 mr-2" />
                View Saved Vendors
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                <UserCircle className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentVendor = vendors[currentIndex];

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {showSavePopup && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
            <div className="bg-white rounded-full p-8 shadow-xl transform scale-150 transition-transform">
              <Heart className="w-12 h-12 text-green-500" fill="currentColor" />
            </div>
          </div>
        )}

        <div className="relative h-96">
          <img
            src={currentVendor.images[0] || `https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80`}
            alt={currentVendor.business_name}
            className="w-full h-full object-cover"
          />
          {currentVendor.subscription_plan === 'elite' && (
            <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full flex items-center shadow-lg">
              <Star className="w-4 h-4 mr-1 fill-current" />
              Elite Vendor
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">{currentVendor.business_name}</h2>
            <div className="flex items-center space-x-4 mb-2">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="ml-1">{currentVendor.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-5 h-5" />
                <span className="ml-1">{currentVendor.location}</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-5 h-5" />
                <span className="ml-1">{currentVendor.price_range}</span>
              </div>
            </div>
            <p className="text-sm line-clamp-2">{currentVendor.description}</p>
          </div>
        </div>

        <div className="p-4 flex justify-between items-center relative">
          <div className="relative">
            <button
              onClick={handleDislike}
              onMouseEnter={() => setIsHoveringDislike(true)}
              onMouseLeave={() => setIsHoveringDislike(false)}
              className={`w-16 h-16 rounded-full flex items-center justify-center border-2 border-red-500 hover:bg-red-50 transition-colors relative ${
                isHoveringDislike ? 'bg-red-50' : ''
              }`}
            >
              <X 
                className={`w-8 h-8 text-red-500 transition-transform ${
                  isHoveringDislike ? 'scale-110' : ''
                }`}
                fill="currentColor"
              />
            </button>
            {showCoachMarks && (
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 w-48 text-center">
                <p className="text-sm text-gray-600">Swipe left or tap X to pass</p>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white transform rotate-45" />
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={handleViewProfile}
          >
            View Full Profile
          </Button>

          <div className="relative">
            <button
              onClick={handleLike}
              onMouseEnter={() => setIsHoveringLike(true)}
              onMouseLeave={() => setIsHoveringLike(false)}
              className={`w-16 h-16 rounded-full flex items-center justify-center border-2 border-green-500 hover:bg-green-50 transition-colors relative ${
                isHoveringLike ? 'bg-green-50' : ''
              }`}
            >
              <Heart 
                className={`w-8 h-8 text-green-500 transition-transform ${
                  isHoveringLike ? 'scale-110' : ''
                }`}
                fill="currentColor"
              />
            </button>
            {showCoachMarks && (
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 w-48 text-center">
                <p className="text-sm text-gray-600">Swipe right or tap heart to save</p>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white transform rotate-45" />
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-center text-sm text-gray-600">
          <Lock className="w-4 h-4 mr-2" />
          Sign in to save vendors and contact them directly
        </div>
      </div>
    </div>
  );
};

export default VendorMatch;