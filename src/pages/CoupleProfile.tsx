import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Heart, Calendar, MapPin, Gift, Music, Utensils, 
  DollarSign, ExternalLink, Store, QrCode, Package 
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode';

interface Couple {
  partner1_name: string;
  partner2_name: string;
  wedding_date: string;
  venue: string;
  venue_address: string;
  hotel_name: string;
  hotel_address: string;
  hotel_website: string;
  hotel_notes: string;
  hotel_room_block: string;
  hotel_deadline: string;
  venmo_username: string | null;
  meal_options: {
    standard_name: string;
    standard_description: string;
    vegetarian_name: string;
    vegetarian_description: string;
    vegan_name: string;
    vegan_description: string;
  };
  allow_song_requests: boolean;
  images: string[];
  primary_image: number;
  how_we_met: string;
  proposal_story: string;
}

interface RegistryItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  link: string | null;
  is_purchased: boolean;
  vendor_package?: {
    id: string;
    name: string;
    vendor: {
      business_name: string;
    };
  };
}

interface BookedVendor {
  id: string;
  business_name: string;
  category: string;
  location: string;
  rating: number;
}

const CoupleProfile = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [registryItems, setRegistryItems] = useState<RegistryItem[]>([]);
  const [bookedVendors, setBookedVendors] = useState<BookedVendor[]>([]);
  const [venmoQR, setVenmoQR] = useState<string | null>(null);

  useEffect(() => {
    loadProfileData();
  }, [id]);

  const loadProfileData = async () => {
    try {
      // Get couple details
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select(`
          partner1_name,
          partner2_name,
          wedding_date,
          venue,
          venue_address,
          hotel_name,
          hotel_address,
          hotel_website,
          hotel_notes,
          hotel_room_block,
          hotel_deadline,
          venmo_username,
          meal_options,
          allow_song_requests,
          images,
          primary_image,
          how_we_met,
          proposal_story
        `)
        .eq('id', id)
        .single();

      if (coupleError) throw coupleError;
      setCouple(coupleData);

      if (coupleData.venmo_username) {
        generateVenmoQR(coupleData.venmo_username);
      }

      // Get registry items
      const { data: registryData, error: registryError } = await supabase
        .from('registry_items')
        .select(`
          *,
          vendor_packages (
            id,
            name,
            vendors (
              business_name
            )
          )
        `)
        .eq('couple_id', id)
        .order('created_at', { ascending: true });

      if (registryError) throw registryError;
      setRegistryItems(registryData || []);

      // Get booked vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select(`
          id,
          business_name,
          category,
          location,
          rating
        `)
        .in('id', (
          await supabase
            .from('leads')
            .select('vendor_id')
            .eq('couple_id', id)
            .eq('status', 'booked')
        ).data?.map(lead => lead.vendor_id) || []);

      if (vendorsError) throw vendorsError;
      setBookedVendors(vendorsData || []);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const generateVenmoQR = async (username: string) => {
    try {
      const venmoUrl = `https://venmo.com/${username}`;
      const qrDataUrl = await QRCode.toDataURL(venmoUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#6FB7B7',
          light: '#FFFFFF'
        }
      });
      setVenmoQR(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">
          <Heart className="w-12 h-12 text-primary" />
        </div>
      </div>
    );
  }

  if (!couple) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-gray-600">This couple's profile could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="absolute inset-0">
          {couple.images[couple.primary_image] ? (
            <img
              src={couple.images[couple.primary_image]}
              alt="Couple"
              className="w-full h-full object-cover mix-blend-overlay"
            />
          ) : (
            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=80"
              alt="Wedding celebration"
              className="w-full h-full object-cover mix-blend-overlay"
            />
          )}
        </div>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <Heart className="w-16 h-16 mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {couple.partner1_name} & {couple.partner2_name}
          </h1>
          <div className="flex items-center space-x-4 text-lg">
            {couple.wedding_date && (
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {new Date(couple.wedding_date).toLocaleDateString()}
              </div>
            )}
            {couple.venue && (
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                {couple.venue}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Registry Section */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Registry</h2>
                {venmoQR && (
                  <Button variant="outline">
                    <QrCode className="w-4 h-4 mr-2" />
                    View Venmo QR
                  </Button>
                )}
              </div>
              <div className="grid gap-6">
                {registryItems.map((item) => (
                  <div 
                    key={item.id} 
                    className={`border rounded-lg p-4 ${
                      item.is_purchased ? 'opacity-75' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`font-semibold text-lg ${
                          item.is_purchased ? 'line-through text-gray-500' : ''
                        }`}>
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-gray-600 mt-1">{item.description}</p>
                        )}
                        {item.vendor_package && (
                          <p className="text-sm text-gray-500 mt-1">
                            From: {item.vendor_package.vendor.business_name}
                          </p>
                        )}
                        <div className="flex items-center mt-2">
                          <p className="text-lg font-semibold">
                            ${item.price.toLocaleString()}
                          </p>
                          {item.is_purchased && (
                            <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Purchased
                            </span>
                          )}
                        </div>
                      </div>
                      {item.link && !item.is_purchased && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Wedding Team Section */}
            {bookedVendors.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-6">Our Wedding Team</h2>
                <div className="grid gap-6">
                  {bookedVendors.map((vendor) => (
                    <div key={vendor.id} className="flex items-start space-x-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{vendor.business_name}</h3>
                        <p className="text-gray-600">{vendor.category}</p>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          {vendor.location}
                        </div>
                      </div>
                      <a
                        href={`/vendors/${vendor.id}`}
                        className="text-primary hover:text-primary/80"
                      >
                        <Store className="w-5 h-5" />
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Love Story Section */}
            {(couple.how_we_met || couple.proposal_story) && (
              <section className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-semibold mb-6">Our Story</h2>
                {couple.how_we_met && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">How We Met</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{couple.how_we_met}</p>
                  </div>
                )}
                {couple.proposal_story && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">The Proposal</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{couple.proposal_story}</p>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Meal Options */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Utensils className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Meal Options</h2>
              </div>
              <div className="space-y-6">
                {/* Standard Option */}
                <div>
                  <h3 className="font-medium text-lg mb-2">
                    {couple.meal_options.standard_name}
                  </h3>
                  <p className="text-gray-600">
                    {couple.meal_options.standard_description}
                  </p>
                </div>

                {/* Vegetarian Option */}
                <div>
                  <h3 className="font-medium text-lg mb-2">
                    {couple.meal_options.vegetarian_name}
                  </h3>
                  <p className="text-gray-600">
                    {couple.meal_options.vegetarian_description}
                  </p>
                </div>

                {/* Vegan Option */}
                <div>
                  <h3 className="font-medium text-lg mb-2">
                    {couple.meal_options.vegan_name}
                  </h3>
                  <p className="text-gray-600">
                    {couple.meal_options.vegan_description}
                  </p>
                </div>
              </div>
            </div>

            {/* Song Requests */}
            {couple.allow_song_requests && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Music className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Song Requests</h2>
                </div>
                <p className="text-gray-600 mb-4">
                  Have a song you'd love to hear at our wedding? Let us know when you RSVP!
                </p>
              </div>
            )}

            {/* Venmo QR Code */}
            {venmoQR && (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Venmo</h2>
                </div>
                <img 
                  src={venmoQR} 
                  alt="Venmo QR Code"
                  className="mx-auto mb-4"
                />
                <p className="text-gray-600">
                  Scan to send a Venmo payment
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoupleProfile;