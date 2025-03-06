import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface FormData {
  partner1Name: string;
  partner2Name: string;
  email: string;
  phone: string;
  weddingDate: string;
  budget: string;
  guestCount: string;
  venueLocation: string;
  message: string;
  preferredContactMethod: 'email' | 'phone';
  serviceType: string;
  timeframe: string;
}

interface Vendor {
  id: string;
  business_name: string;
  slug: string;
}

const VendorContact = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<FormData>({
    partner1Name: '',
    partner2Name: '',
    email: '',
    phone: '',
    weddingDate: '',
    budget: '',
    guestCount: '',
    venueLocation: '',
    message: '',
    preferredContactMethod: 'email',
    serviceType: '',
    timeframe: ''
  });

  const loadVendorAndUserData = useCallback(async () => {
    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth', { 
          state: { 
            returnTo: `/vendors/${slug}/contact`,
            role: 'couple'
          }
        });
        return;
      }

      // Get vendor details
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id, business_name, slug')
        .eq('slug', slug)
        .single();

      if (vendorError) throw vendorError;
      setVendor(vendorData);

      // Get couple details to pre-fill form
      const { data: coupleData } = await supabase
        .from('couples')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (coupleData) {
        setFormData(prev => ({
          ...prev,
          partner1Name: coupleData.partner1_name || '',
          partner2Name: coupleData.partner2_name || '',
          email: user.email || '',
          weddingDate: coupleData.wedding_date || '',
          budget: coupleData.budget?.toString() || ''
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load vendor information');
      navigate('/vendors');
    } finally {
      setLoading(false);
    }
  }, [slug, navigate]); // Dependencies for useCallback

  useEffect(() => {
    loadVendorAndUserData();
  }, [slug, loadVendorAndUserData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;
    if (submitting) return;

    try {
      setSubmitting(true);

      // Get couple ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: coupleData } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!coupleData) {
        toast.error('Couple profile not found');
        return;
      }

      // Create lead
      const { error: leadError } = await supabase
        .from('leads')
        .insert({
          vendor_id: vendor.id,
          couple_id: coupleData.id,
          wedding_date: formData.weddingDate || null,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          guest_count: formData.guestCount ? parseInt(formData.guestCount) : null,
          venue_location: formData.venueLocation,
          inquiry_type: formData.serviceType,
          additional_details: `
Service Type: ${formData.serviceType}
Timeframe: ${formData.timeframe}
Preferred Contact: ${formData.preferredContactMethod}
Phone: ${formData.phone}

Message:
${formData.message}
          `.trim(),
          status: 'pending'
        });

      if (leadError) throw leadError;

      toast.success('Inquiry sent successfully! The vendor will review your details and get back to you soon.');
      navigate('/couple/wedding-team');
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast.error('Failed to send inquiry');
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

  if (!vendor) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Vendor not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <Button
        variant="ghost"
        onClick={() => navigate(`/vendors/${vendor.slug}`)}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Profile
      </Button>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b">
          <h1 className="text-2xl font-semibold">Contact {vendor.business_name}</h1>
          <p className="text-gray-600">Tell us about your wedding plans</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Couple Information */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Your Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Partner 1 Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.partner1Name}
                  onChange={(e) => setFormData(prev => ({ ...prev, partner1Name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Partner 2 Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.partner2Name}
                  onChange={(e) => setFormData(prev => ({ ...prev, partner2Name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Preferred Contact Method
                </label>
                <select
                  value={formData.preferredContactMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredContactMethod: e.target.value as 'email' | 'phone' }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Event Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Wedding Date
                </label>
                <input
                  type="date"
                  value={formData.weddingDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, weddingDate: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Estimated Guest Count
                </label>
                <input
                  type="number"
                  value={formData.guestCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, guestCount: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g., 150"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Venue Location (if known)
                </label>
                <input
                  type="text"
                  value={formData.venueLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, venueLocation: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g., Boston Marriott Copley Place"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Budget Range
                </label>
                <select
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select budget range</option>
                  <option value="15000">Under $15,000</option>
                  <option value="25000">$15,000 - $25,000</option>
                  <option value="35000">$25,000 - $35,000</option>
                  <option value="50000">$35,000 - $50,000</option>
                  <option value="75000">$50,000 - $75,000</option>
                  <option value="100000">$75,000 - $100,000</option>
                  <option value="150000">$100,000 - $150,000</option>
                  <option value="200000">$150,000 - $200,000</option>
                  <option value="250000">Over $200,000</option>
                </select>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Service Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type of Service Needed
                </label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  <option value="">Select service type</option>
                  <option value="Full Service">Full Service</option>
                  <option value="Day-Of Service">Day-Of Service</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Custom Package">Custom Package</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Timeframe
                </label>
                <select
                  value={formData.timeframe}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeframe: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  <option value="">Select timeframe</option>
                  <option value="Immediate">Immediate (within 1 month)</option>
                  <option value="Soon">Soon (1-3 months)</option>
                  <option value="Planning Ahead">Planning Ahead (3-6 months)</option>
                  <option value="Early Planning">Early Planning (6+ months)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Additional Details
                </label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Tell us more about your wedding vision and what you're looking for..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/vendors/${vendor.slug}`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Inquiry
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorContact;