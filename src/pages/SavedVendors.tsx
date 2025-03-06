import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Star, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import BackToDashboard from '../components/BackToDashboard';

interface SavedVendor {
  id: string;
  business_name: string;
  slug: string;
  location: string;
  rating: number;
  price_range: string;
  images: string[];
  saved_at: string;
  notes?: string;
}

// Interface for raw Supabase response for vendors join
interface SupabaseVendorResponse {
  id: string;
  business_name: string;
  slug: string;
  location: string;
  rating: number;
  price_range: string;
  images: string[];
}

const SavedVendors = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savedVendors, setSavedVendors] = useState<SavedVendor[]>([]);

  const loadSavedVendors = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to view saved vendors');
        navigate('/couple/register');
        return;
      }

      // First get the couple's ID
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (coupleError) {
        console.error('Error getting couple data:', coupleError);
        toast.error('Failed to load saved vendors');
        return;
      }

      // Then get saved vendors with full vendor details
      const { data, error } = await supabase
        .from('saved_vendors')
        .select(`
          saved_at,
          notes,
          vendors (
            id,
            business_name,
            slug,
            location,
            rating,
            price_range,
            images
          )
        `)
        .eq('couple_id', coupleData.id)
        .order('saved_at', { ascending: false });

      if (error) throw error;

      // Type the response explicitly, handling vendors as an array
      setSavedVendors(
        data.map((item: { saved_at: string; notes?: string; vendors: SupabaseVendorResponse[] }) => ({
          id: item.vendors[0].id,
          business_name: item.vendors[0].business_name,
          slug: item.vendors[0].slug,
          location: item.vendors[0].location,
          rating: item.vendors[0].rating,
          price_range: item.vendors[0].price_range,
          images: item.vendors[0].images,
          saved_at: item.saved_at,
          notes: item.notes
        }))
      );
    } catch (error) {
      console.error('Error loading saved vendors:', error);
      toast.error('Failed to load saved vendors');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadSavedVendors();
  }, [loadSavedVendors]);

  const removeFromSaved = async (vendorId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get couple ID first
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (coupleError) throw coupleError;

      const { error } = await supabase
        .from('saved_vendors')
        .delete()
        .eq('couple_id', coupleData.id)
        .eq('vendor_id', vendorId);

      if (error) throw error;

      setSavedVendors(prev => prev.filter(vendor => vendor.id !== vendorId));
      toast.success('Vendor removed from saved list');
    } catch (error) {
      console.error('Error removing vendor:', error);
      toast.error('Failed to remove vendor');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading saved vendors...</p>
      </div>
    );
  }

  if (savedVendors.length === 0) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Saved Vendors</h1>
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No saved vendors yet</h2>
          <p className="text-gray-600 mb-6">
            Start exploring vendors and save your favorites for later.
          </p>
          <Button onClick={() => navigate('/vendors')}>
            Browse Vendors
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <BackToDashboard />
      <h1 className="text-3xl font-bold mb-8">Saved Vendors</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedVendors.map((vendor) => (
          <div key={vendor.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="relative h-48">
              <img
                src={vendor.images[0] || `https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80`}
                alt={vendor.business_name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromSaved(vendor.id);
                }}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm hover:bg-gray-50"
              >
                <Trash2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-lg mb-1">
                {vendor.business_name}
              </h3>
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                {vendor.location}
              </div>
              <div className="flex items-center text-sm mb-4">
                <div className="flex text-yellow-400 mr-1">
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <span>{vendor.rating.toFixed(1)}</span>
                <span className="text-gray-600 mx-1">•</span>
                <span className="text-gray-600">{vendor.price_range}</span>
              </div>

              {vendor.notes && (
                <div className="text-sm text-gray-600 border-t pt-3 mt-3">
                  <p className="font-medium mb-1">Your Notes:</p>
                  <p>{vendor.notes}</p>
                </div>
              )}

              <div className="mt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/vendors/${vendor.slug}`)}
                >
                  View Profile
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedVendors;