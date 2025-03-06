import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, X, Check } from 'lucide-react';
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
  status: 'pending' | 'confirmed' | 'cancelled';
  couple_response: 'accepted' | 'declined' | null;
  vendor: {
    id: string;
    business_name: string;
    category: string;
  };
}

const CoupleAppointments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
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
        toast.error('Failed to load appointments');
        return;
      }

      // Get appointments with vendor details
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          vendor:vendors (
            id,
            business_name,
            category
          )
        `)
        .eq('couple_id', coupleData.id)
        .order('wedding_date', { ascending: true });

      if (appointmentsError) throw appointmentsError;
      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentResponse = async (appointmentId: string, response: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          couple_response: response,
          couple_response_date: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments(prev =>
        prev.map(app =>
          app.id === appointmentId
            ? { ...app, couple_response: response }
            : app
        )
      );

      toast.success(`Appointment ${response}`);
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
  };

  const getStatusColor = (status: string, couple_response: string | null) => {
    if (couple_response === 'declined' || status === 'cancelled') {
      return 'bg-red-100 text-red-800';
    }
    if (couple_response === 'accepted' || status === 'confirmed') {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true;
    return appointment.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <BackToDashboard />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Appointments</h1>
          <p className="text-gray-600">Manage your vendor appointments</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No appointments found</h2>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'You have no appointments scheduled.'
              : `No ${filter} appointments at the moment.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{appointment.title}</h3>
                  <div className="space-y-2 text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(appointment.wedding_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {new Date(appointment.start_time).toLocaleTimeString()}
                    </div>
                    <div className="flex items-center font-medium">
                      {appointment.vendor.business_name} ({appointment.vendor.category})
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(appointment.status, appointment.couple_response)}`}>
                    {appointment.couple_response
                      ? appointment.couple_response.charAt(0).toUpperCase() + appointment.couple_response.slice(1)
                      : appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/appointments/${appointment.id}`)}
                    >
                      View Details
                    </Button>
                    {appointment.status === 'pending' && !appointment.couple_response && (
                      <>
                        <Button
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleAppointmentResponse(appointment.id, 'declined')}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                        <Button
                          className="text-green-600 bg-green-100 hover:bg-green-200"
                          onClick={() => handleAppointmentResponse(appointment.id, 'accepted')}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoupleAppointments;