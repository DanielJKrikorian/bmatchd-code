import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, Video, MessageSquare, Store, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import BackToDashboard from '../../components/BackToDashboard';

interface Appointment {
  id: string;
  title: string;
  description: string;
  wedding_date: string;
  start_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  couple_response: 'accepted' | 'declined' | null;
  couple_notes: string | null;
  vendor: {
    id: string;
    user_id: string;
    business_name: string;
    category: string;
    location: string;
  };
}

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [showChangeRequest, setShowChangeRequest] = useState(false);
  const [changeRequest, setChangeRequest] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAppointment();
  }, [id]);

  const loadAppointment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: appointmentData, error } = await supabase
        .from('appointments')
        .select(`
          *,
          vendor:vendors (
            id,
            user_id,
            business_name,
            category,
            location
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setAppointment(appointmentData);
    } catch (error) {
      console.error('Error loading appointment:', error);
      toast.error('Failed to load appointment details');
      navigate('/appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRequest = async () => {
    if (!appointment || !changeRequest.trim()) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Send message to vendor
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: appointment.vendor.user_id,
          content: `Change Request for ${appointment.title} on ${new Date(appointment.wedding_date).toLocaleDateString()}:\n\n${changeRequest}`,
          appointment_id: appointment.id
        });

      if (messageError) throw messageError;

      toast.success('Change request sent to vendor');
      setShowChangeRequest(false);
      setChangeRequest('');
    } catch (error) {
      console.error('Error sending change request:', error);
      toast.error('Failed to send change request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: Appointment['status'], couple_response: Appointment['couple_response']) => {
    if (couple_response === 'declined' || status === 'cancelled') {
      return 'bg-red-100 text-red-800';
    }
    if (couple_response === 'accepted' || status === 'confirmed') {
      return 'bg-green-100 text-green-800';
    }
    if (status === 'completed') {
      return 'bg-gray-100 text-gray-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading appointment details...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Appointment not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <BackToDashboard />
      <Button
        variant="ghost"
        onClick={() => navigate('/appointments')}
        className="mb-6"
      >
        ← Back to Appointments
      </Button>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">{appointment.title}</h1>
            <p className="text-gray-600">with {appointment.vendor.business_name}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(appointment.status, appointment.couple_response)}`}>
            {appointment.couple_response
              ? appointment.couple_response.charAt(0).toUpperCase() + appointment.couple_response.slice(1)
              : appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Appointment Details */}
          <div className="space-y-4">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-5 h-5 mr-3" />
              <div>
                <p className="font-medium">Date</p>
                <p>{new Date(appointment.wedding_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center text-gray-600">
              <Clock className="w-5 h-5 mr-3" />
              <div>
                <p className="font-medium">Time</p>
                <p>{new Date(appointment.start_time).toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="flex items-center text-gray-600">
              <Store className="w-5 h-5 mr-3" />
              <div>
                <p className="font-medium">Vendor</p>
                <p>{appointment.vendor.business_name}</p>
                <p className="text-sm">{appointment.vendor.category}</p>
              </div>
            </div>

            {appointment.description && (
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-2">Additional Details</h3>
                {appointment.description.split('\n').map((line, i) => (
                  <p key={i} className="text-gray-600 mb-1">{line}</p>
                ))}
              </div>
            )}
          </div>

          {/* Change Request Section */}
          {appointment.status !== 'cancelled' && (
            <div className="border-t pt-6">
              {showChangeRequest ? (
                <div className="space-y-4">
                  <h3 className="font-medium">Request Changes</h3>
                  <textarea
                    value={changeRequest}
                    onChange={(e) => setChangeRequest(e.target.value)}
                    placeholder="Describe the changes you'd like to request..."
                    rows={4}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowChangeRequest(false);
                        setChangeRequest('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleChangeRequest}
                      disabled={submitting || !changeRequest.trim()}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Send Request
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowChangeRequest(true)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Request Changes
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;