import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users2, Loader2, Trash2, Save } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface Appointment {
  id: string;
  title: string;
  description: string;
  wedding_date: string;
  start_time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  couple: {
    id: string;
    user_id: string;
    partner1_name: string;
    partner2_name: string;
    location: string;
  };
}

const AppointmentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    wedding_date: '',
    start_time: '',
  });

  useEffect(() => {
    loadAppointment();
  }, [id]);

  const loadAppointment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/vendor/signin');
        return;
      }

      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!vendorData) {
        toast.error('Vendor profile not found');
        return;
      }

      const { data: appointmentData, error } = await supabase
        .from('appointments')
        .select(`
          *,
          couple:couples (
            id,
            user_id,
            partner1_name,
            partner2_name,
            location
          )
        `)
        .eq('id', id)
        .eq('vendor_id', vendorData.id)
        .single();

      if (error) throw error;

      setAppointment(appointmentData);
      setFormData({
        title: appointmentData.title,
        description: appointmentData.description || '',
        wedding_date: new Date(appointmentData.wedding_date).toISOString().split('T')[0],
        start_time: new Date(appointmentData.start_time).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
      });
    } catch (error) {
      console.error('Error loading appointment:', error);
      toast.error('Failed to load appointment');
      navigate('/calendar');
    } finally {
      setLoading(false);
    }
  };

  const sendNotificationMessage = async (action: 'updated' | 'deleted') => {
    if (!appointment?.couple.user_id) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const message = action === 'updated' 
        ? `Your appointment "${appointment.title}" has been updated. Please check the new details.`
        : `Your appointment "${appointment.title}" has been cancelled by the vendor.`;

      await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: appointment.couple.user_id,
          content: message,
          appointment_id: appointment.id,
          status: 'pending'
        });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handleSave = async () => {
    if (!appointment) return;
    setSaving(true);

    try {
      const startTime = new Date(`${formData.wedding_date}T${formData.start_time}`);

      const { error } = await supabase
        .from('appointments')
        .update({
          title: formData.title,
          description: formData.description,
          wedding_date: formData.wedding_date,
          start_time: startTime.toISOString()
        })
        .eq('id', appointment.id);

      if (error) throw error;

      // Send notification message
      await sendNotificationMessage('updated');

      toast.success('Appointment updated successfully');
      setIsEditing(false);
      loadAppointment();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment || !confirm('Are you sure you want to delete this appointment?')) return;
    setSaving(true);

    try {
      // Send notification message before deleting
      await sendNotificationMessage('deleted');

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointment.id);

      if (error) throw error;

      toast.success('Appointment deleted successfully');
      navigate('/calendar');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading appointment...</p>
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
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Appointment Details</h1>
            <p className="text-gray-600">View and manage appointment information</p>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                >
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
              </>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Couple Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <Users2 className="w-5 h-5 text-gray-500 mr-2" />
              <h3 className="font-medium">Couple Details</h3>
            </div>
            <p className="text-lg font-medium mb-2">
              {appointment.couple.partner1_name} & {appointment.couple.partner2_name}
            </p>
            <p className="text-gray-600 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              {appointment.couple.location}
            </p>
          </div>

          {/* Appointment Details */}
          <div className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appointment Type
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wedding Date
                    </label>
                    <input
                      type="date"
                      value={formData.wedding_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, wedding_date: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="font-medium mb-2">{appointment.title}</h3>
                  <p className="text-gray-600">{appointment.description}</p>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-5 h-5 mr-2" />
                    {new Date(appointment.wedding_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-5 h-5 mr-2" />
                    {new Date(appointment.start_time).toLocaleTimeString()}
                  </div>
                </div>

                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                  appointment.status === 'confirmed' 
                    ? 'bg-green-100 text-green-800'
                    : appointment.status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentView;