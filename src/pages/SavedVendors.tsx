import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Star, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import BackToDashboard from '../components/BackToDashboard';

interface SavedVendor {
  id: string; // ID from vendors table
  business_name: string;
  slug: string;
  location: string;
  rating: number;
  price_range: string;
  images: string[];
  saved_at: string;
  notes?: string;
  savedVendorId: string; // ID from saved_vendors table
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

      // Fetch saved vendor IDs and metadata
      const { data: savedData, error: savedError } = await supabase
        .from('saved_vendors')
        .select('id, saved_at, notes, vendor_id')
        .eq('couple_id', coupleData.id)
        .order('saved_at', { ascending: false });

      if (savedError) throw savedError;

      if (!savedData || savedData.length === 0) {
        setSavedVendors([]);
        return;
      }

      // Fetch vendor details for each vendor_id
      const vendorIds = savedData.map((item) => item.vendor_id);
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id, business_name, slug, location, rating, price_range, images')
        .in('id', vendorIds);

      if (vendorError) throw vendorError;

      // Map saved vendors to include vendor details
      const vendorsMap = new Map(vendorData.map((vendor) => [vendor.id, vendor]));
      const combinedVendors = savedData
        .map((item) => {
          const vendor = vendorsMap.get(item.vendor_id);
          if (!vendor) {
            console.warn(`Vendor not found for vendor_id: ${item.vendor_id}`);
            return null;
          }
          return {
            ...vendor,
            saved_at: item.saved_at,
            notes: item.notes,
            savedVendorId: item.id, // Track the saved_vendors.id for deletion
          };
        })
        .filter((vendor): vendor is SavedVendor => vendor !== null);

      setSavedVendors(combinedVendors);
    } catch (error) {
      console.error('Error loading saved vendors:', error);
      toast.error('Failed to load saved vendors. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadSavedVendors();
  }, [loadSavedVendors]);

  const removeFromSaved = async (savedVendorId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        .eq('id', savedVendorId); // Use saved_vendors.id for deletion

      if (error) throw error;

      setSavedVendors(prev => prev.filter(vendor => vendor.savedVendorId !== savedVendorId));
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
                  removeFromSaved(vendor.savedVendorId); // Use saved_vendors.id
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