import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Clock, Video, MapPin, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import BackToDashboard from '../../components/BackToDashboard';

interface AppointmentFormData {
  appointmentType: string;
  date: string;
  time: string;
  locationType: 'Online' | 'In-person';
  location: string;
  notes: string;
}

interface Vendor {
  id: string;
  business_name: string;
  slug: string;
  user_id: string;
}

const APPOINTMENT_TYPES = [
  'Initial Consultation',
  'Wedding Check-in',
  'Final Details',
  'Rehearsal Planning',
  'Wedding Day Timeline'
];

const AppointmentRequest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vendorSlug = searchParams.get('vendor'); // Changed from vendorId to vendorSlug
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<AppointmentFormData>({
    appointmentType: 'Initial Consultation',
    date: '',
    time: '10:00',
    locationType: 'Online',
    location: '',
    notes: ''
  });

  const loadInitialData = useCallback(async () => {
    try {
      if (!vendorSlug) {
        toast.error('No vendor selected');
        navigate('/vendors');
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to request appointments');
        navigate('/auth');
        return;
      }

      // Get couple ID
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (coupleError) {
        console.error('Error fetching couple:', coupleError);
        toast.error('Failed to load couple profile');
        return;
      }

      setCoupleId(coupleData.id);

      // Get vendor details by slug
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id, business_name, slug, user_id')
        .eq('slug', vendorSlug) // Changed from id to slug
        .single();

      if (vendorError) {
        console.error('Error fetching vendor:', vendorError);
        toast.error('Failed to load vendor details');
        navigate('/vendors');
        return;
      }

      setVendor(vendorData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load required data');
    } finally {
      setLoading(false);
    }
  }, [vendorSlug, navigate]); // Added dependencies

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]); // Updated dependency to loadInitialData

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor || !coupleId) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          vendor_id: vendor.id,
          couple_id: coupleId,
          title: formData.appointmentType,
          description: `Location Type: ${formData.locationType}
Location: ${formData.location}
Notes: ${formData.notes}`,
          wedding_date: formData.date,
          start_time: `${formData.date}T${formData.time}:00`,
          status: 'pending'
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Send message to vendor
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: vendor.user_id,
          content: `New ${formData.appointmentType} appointment request for ${new Date(formData.date).toLocaleDateString()} at ${formData.time}`,
          appointment_id: appointment.id
        });

      if (messageError) throw messageError;

      toast.success('Appointment request sent successfully');
      navigate('/messages');
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Failed to create appointment');
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
    <div className="max-w-2xl mx-auto py-12 px-4">
      <BackToDashboard />
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b">
          <h1 className="text-2xl font-semibold">Schedule an Appointment</h1>
          <p className="text-gray-600">with {vendor.business_name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Appointment Type
            </label>
            <select
              required
              value={formData.appointmentType}
              onChange={(e) => setFormData(prev => ({ ...prev, appointmentType: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {APPOINTMENT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Date
              </div>
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Time
              </div>
            </label>
            <input
              type="time"
              required
              value={formData.time}
              onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Type
            </label>
            <select
              required
              value={formData.locationType}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                locationType: e.target.value as 'Online' | 'In-person',
                location: '' 
              }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="Online">Online Meeting</option>
              <option value="In-person">In-person Meeting</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.locationType === 'Online' ? (
                <div className="flex items-center">
                  <Video className="w-4 h-4 mr-2" />
                  Meeting Link
                </div>
              ) : (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Meeting Address
                </div>
              )}
            </label>
            {formData.locationType === 'Online' ? (
              <input
                type="url"
                required
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter video conference link"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            ) : (
              <textarea
                required
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter meeting address"
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes or questions for the vendor..."
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Request...
                </>
              ) : (
                'Request Appointment'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentRequest;