import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Clock, Users2, Loader2, Video, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const APPOINTMENT_TYPES = [
  'Initial Consultation',
  'Wedding Check-in',
  'Final Details',
  'Rehearsal Dinner',
  'Wedding'
];

const AppointmentNew = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    coupleId: searchParams.get('couple') || '',
    appointmentType: 'Initial Consultation',
    date: '',
    locationType: 'Online',
    location: '',
    startTime: '10:00',
    notes: ''
  });
  const [couples, setCouples] = useState<Array<{
    id: string;
    partner1_name: string;
    partner2_name: string;
    wedding_date: string | null;
  }>>([]);

  useEffect(() => {
    loadCouples();
  }, []);

  const loadCouples = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/vendor/signin');
        return;
      }

      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!vendorData) {
        toast.error('Vendor profile not found');
        return;
      }

      // Get couples who have messaged or have leads with this vendor
      const { data: couplesData, error: couplesError } = await supabase
        .from('leads')
        .select(`
          couple:couples (
            id,
            partner1_name,
            partner2_name,
            wedding_date
          )
        `)
        .eq('vendor_id', vendorData.id);

      if (couplesError) throw couplesError;

      // Format couples data and remove duplicates
      const uniqueCouples = couplesData.reduce((acc: any[], curr: any) => {
        if (curr.couple && !acc.find(c => c.id === curr.couple.id)) {
          acc.push(curr.couple);
        }
        return acc;
      }, []);

      setCouples(uniqueCouples);

      // If couple is pre-selected and has a wedding date, set it for wedding appointments
      if (formData.coupleId && formData.appointmentType === 'Wedding') {
        const selectedCouple = uniqueCouples.find(c => c.id === formData.coupleId);
        if (selectedCouple?.wedding_date) {
          setFormData(prev => ({ ...prev, date: selectedCouple.wedding_date }));
        }
      }
    } catch (error) {
      console.error('Error loading couples:', error);
      toast.error('Failed to load couples');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!vendorData) throw new Error('Vendor profile not found');

      // Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          vendor_id: vendorData.id,
          couple_id: formData.coupleId,
          title: formData.appointmentType,
          description: `Location Type: ${formData.locationType}
Location: ${formData.location}
Notes: ${formData.notes}`,
          wedding_date: formData.date,
          start_time: `${formData.date}T${formData.startTime}:00`,
          status: 'pending'
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Create message to notify couple
      const couple = await supabase
        .from('couples')
        .select('user_id')
        .eq('id', formData.coupleId)
        .single();

      if (couple?.data) {
        await supabase
          .from('messages')
          .insert({
            sender_id: user.id,
            receiver_id: couple.data.user_id,
            content: `New ${formData.appointmentType} appointment request for ${new Date(formData.date).toLocaleDateString()} at ${formData.startTime}`,
            appointment_id: appointment.id
          });
      }

      toast.success('Appointment created successfully');
      navigate('/calendar');
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setFormData(prev => {
      // If Wedding is selected and there's a selected couple with a wedding date, use it
      if (newType === 'Wedding' && prev.coupleId) {
        const selectedCouple = couples.find(c => c.id === prev.coupleId);
        if (selectedCouple?.wedding_date) {
          return { ...prev, appointmentType: newType, date: selectedCouple.wedding_date };
        }
      }
      return { ...prev, appointmentType: newType };
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b">
          <h1 className="text-2xl font-semibold">New Appointment</h1>
          <p className="text-gray-600">Schedule an appointment with a couple</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Couple
            </label>
            <select
              required
              value={formData.coupleId}
              onChange={(e) => setFormData(prev => ({ ...prev, coupleId: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select a couple</option>
              {couples.map(couple => (
                <option key={couple.id} value={couple.id}>
                  {couple.partner1_name} & {couple.partner2_name}
                  {couple.wedding_date && ` (Wedding: ${new Date(couple.wedding_date).toLocaleDateString()})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Appointment Type
            </label>
            <select
              required
              value={formData.appointmentType}
              onChange={handleAppointmentTypeChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {APPOINTMENT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              readOnly={formData.appointmentType === 'Wedding'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              required
              value={formData.locationType}
              onChange={(e) => setFormData(prev => ({ ...prev, locationType: e.target.value, location: '' }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="Online">Online</option>
              <option value="In-person">In-person</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.locationType === 'Online' ? (
                <div className="flex items-center">
                  <Video className="w-4 h-4 mr-2" />
                  Video Conference Link
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
              Start Time
            </label>
            <input
              type="time"
              required
              value={formData.startTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes about the appointment..."
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/calendar')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Appointment'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentNew;