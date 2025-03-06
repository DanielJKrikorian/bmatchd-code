import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users2, Plus, Mail, Music, Settings, Loader2, Send } from 'lucide-react';
import { Button } from '../../components/ui/button';
import BackToDashboard from '../../components/BackToDashboard';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface Guest {
  id: string;
  name: string;
  email: string;
  rsvp_status: 'pending' | 'attending' | 'declined';
  meal_preference: 'standard' | 'vegetarian' | 'vegan' | null;
  dietary_restrictions: string | null;
  song_request: string | null;
  plus_one: boolean;
  plus_one_name: string | null;
  plus_one_meal: 'standard' | 'vegetarian' | 'vegan' | null;
  created_at: string;
}

const GuestManager = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    plus_one: false,
    plus_one_name: ''
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: coupleData } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!coupleData) {
        toast.error('Couple profile not found');
        return;
      }

      const { data: guestsData, error } = await supabase
        .from('wedding_guests')
        .select('*')
        .eq('couple_id', coupleData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuests(guestsData || []);
    } catch (error) {
      console.error('Error loading guests:', error);
      toast.error('Failed to load guests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: coupleData } = await supabase
        .from('couples')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!coupleData) throw new Error('Couple profile not found');

      const { error } = await supabase
        .from('wedding_guests')
        .insert([{
          couple_id: coupleData.id,
          name: formData.name,
          email: formData.email,
          plus_one: formData.plus_one,
          plus_one_name: formData.plus_one ? formData.plus_one_name : null
        }]);

      if (error) throw error;

      toast.success('Guest added successfully');
      setFormData({ name: '', email: '', plus_one: false, plus_one_name: '' });
      setShowForm(false);
      loadGuests();
    } catch (error) {
      console.error('Error adding guest:', error);
      toast.error('Failed to add guest');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <BackToDashboard />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Guest Manager</h1>
          <p className="text-gray-600">Manage your guest list and RSVPs</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate('/wedding/meals')}>
            <Settings className="w-4 h-4 mr-2" />
            Meal Options
          </Button>
          <Button variant="outline" onClick={() => navigate('/wedding/seating')}>
            <Settings className="w-4 h-4 mr-2" />
            Seating Plan
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Guest
          </Button>
        </div>
      </div>

      {/* Guest Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Add Guest</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Guest Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
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
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="plus_one"
                  checked={formData.plus_one}
                  onChange={(e) => setFormData(prev => ({ ...prev, plus_one: e.target.checked }))}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="plus_one" className="text-sm font-medium text-gray-700">
                  Allow Plus One
                </label>
              </div>
            </div>

            {formData.plus_one && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Plus One Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.plus_one_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, plus_one_name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Enter name if known"
                />
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ name: '', email: '', plus_one: false, plus_one_name: '' });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Guest'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Guest List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Guest List</h2>
              <p className="text-gray-600">
                {guests.length} {guests.length === 1 ? 'guest' : 'guests'} invited
              </p>
            </div>
            {guests.length > 0 && (
              <Button onClick={() => toast.success('Invitations sent!')}>
                <Mail className="w-4 h-4 mr-2" />
                Send Invites
              </Button>
            )}
          </div>
        </div>

        {guests.length === 0 ? (
          <div className="text-center py-12">
            <Users2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No guests yet</h3>
            <p className="text-gray-500">Add guests to start managing your list</p>
          </div>
        ) : (
          <div className="divide-y">
            {guests.map((guest) => (
              <div key={guest.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{guest.name}</h3>
                    <p className="text-gray-600">{guest.email}</p>
                    {guest.plus_one && guest.plus_one_name && (
                      <p className="text-sm text-gray-500 mt-1">
                        Plus One: {guest.plus_one_name}
                      </p>
                    )}
                    <div className="mt-2 space-x-4">
                      {guest.rsvp_status !== 'pending' && (
                        <>
                          <span className={`inline-flex items-center text-sm ${
                            guest.rsvp_status === 'attending' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {guest.rsvp_status.charAt(0).toUpperCase() + guest.rsvp_status.slice(1)}
                          </span>
                          {guest.meal_preference && (
                            <span className="inline-flex items-center text-sm text-gray-600">
                              {guest.meal_preference.charAt(0).toUpperCase() + guest.meal_preference.slice(1)}
                            </span>
                          )}
                          {guest.song_request && (
                            <span className="inline-flex items-center text-sm text-gray-600">
                              <Music className="w-4 h-4 mr-1" />
                              {guest.song_request}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {guest.rsvp_status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.success('Invitation sent!')}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestManager;