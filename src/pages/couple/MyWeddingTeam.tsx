import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Check, X, ArrowRight, Calendar, Store, MapPin, Star } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import BackToDashboard from '../../components/BackToDashboard';

interface Lead {
  id: string;
  vendor_id: string;
  couple_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'booked';
  wedding_date: string | null;
  budget: number | null;
  guest_count: number | null;
  venue_location: string | null;
  inquiry_type: string | null;
  additional_details: string | null;
  created_at: string;
  vendor: {
    id: string;
    user_id: string;
    business_name: string;
    category: string;
    location: string;
    rating: number;
    images: string[];
  };
  message_thread_id?: string | null;
}

const MyWeddingTeam = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined' | 'booked'>('all');

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
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
        toast.error('Failed to load inquiries');
        return;
      }

      // Get leads with vendor details
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          *,
          vendor:vendors (
            id,
            user_id,
            business_name,
            category,
            location,
            rating,
            images
          )
        `)
        .eq('couple_id', coupleData.id)
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      setLeads(leadsData || []);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseInquiry = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: 'declined' })
        .eq('id', leadId);

      if (error) throw error;

      setLeads(prev =>
        prev.map(lead =>
          lead.id === leadId ? { ...lead, status: 'declined' } : lead
        )
      );

      toast.success('Inquiry closed successfully');
    } catch (error) {
      console.error('Error closing inquiry:', error);
      toast.error('Failed to close inquiry');
    }
  };

  const handleStartMessage = async (lead: Lead) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Create message thread
      const { data: thread, error: threadError } = await supabase
        .from('message_threads')
        .insert({
          vendor_id: lead.vendor.id,
          couple_id: lead.couple_id
        })
        .select()
        .single();

      if (threadError && !threadError.message.includes('duplicate key')) {
        throw threadError;
      }

      // Update lead with message thread ID
      const { error: updateError } = await supabase
        .from('leads')
        .update({ message_thread_id: thread?.id })
        .eq('id', lead.id);

      if (updateError) throw updateError;

      navigate('/couple/messages');
    } catch (error) {
      console.error('Error starting message thread:', error);
      toast.error('Failed to start message thread');
    }
  };

  const handleBookLead = async (lead: Lead) => {
    try {
      // Update lead status to booked
      const { error: leadError } = await supabase
        .from('leads')
        .update({ status: 'booked' })
        .eq('id', lead.id);

      if (leadError) throw leadError;

      // Create wedding appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          vendor_id: lead.vendor_id,
          couple_id: lead.couple_id,
          title: 'Wedding',
          description: lead.venue_location 
            ? `Venue: ${lead.venue_location}`
            : 'Location to be determined',
          wedding_date: lead.wedding_date,
          start_time: lead.wedding_date 
            ? `${lead.wedding_date}T14:00:00` // 2 PM on wedding date
            : null,
          status: 'confirmed'
        });

      if (appointmentError) throw appointmentError;

      // Update local state
      setLeads(prev =>
        prev.map(l =>
          l.id === lead.id ? { ...l, status: 'booked' } : l
        )
      );

      toast.success('Vendor booked and wedding appointment created!');
    } catch (error) {
      console.error('Error booking vendor:', error);
      toast.error('Failed to book vendor');
    }
  };

  const filteredLeads = leads.filter(lead => 
    filter === 'all' ? true : lead.status === filter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading wedding team...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <BackToDashboard />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Wedding Team</h1>
          <p className="text-gray-600">Manage your vendor inquiries and bookings</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'accepted', 'booked', 'declined'] as const).map((status) => (
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

      {filteredLeads.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No inquiries found</h2>
          <p className="text-gray-600 mb-6">
            {filter === 'all' 
              ? 'Start exploring vendors and send them messages to build your wedding team.'
              : `No ${filter} inquiries at the moment.`}
          </p>
          <Button onClick={() => navigate('/vendors')}>
            <Store className="w-4 h-4 mr-2" />
            Browse Vendors
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{lead.vendor.business_name}</h3>
                    <div className="flex items-center text-sm text-gray-600 gap-4">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {lead.vendor.location}
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        {lead.vendor.rating.toFixed(1)}
                      </div>
                      <div>
                        {lead.vendor.category}
                      </div>
                    </div>
                  </div>

                  {lead.additional_details && (
                    <div className="bg-gray-50 p-4 rounded-lg max-w-2xl">
                      <p className="text-gray-600 whitespace-pre-wrap">{lead.additional_details}</p>
                    </div>
                  )}

                  <p className="text-sm text-gray-500">
                    Inquiry sent: {new Date(lead.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    lead.status === 'accepted' 
                      ? 'bg-green-100 text-green-800' 
                      : lead.status === 'declined'
                      ? 'bg-red-100 text-red-800'
                      : lead.status === 'booked'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </span>

                  <div className="flex gap-2">
                    {lead.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleCloseInquiry(lead.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Close Inquiry
                      </Button>
                    )}
                    {lead.status === 'accepted' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/appointments/request?vendor=${lead.vendor.id}`)}
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          Schedule Consultation
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => lead.message_thread_id ? navigate('/messages') : handleStartMessage(lead)}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {lead.message_thread_id ? 'View Messages' : 'Start Message'}
                        </Button>
                        <Button
                          size="sm"
                          className="text-green-600 bg-green-100 hover:bg-green-200"
                          onClick={() => handleBookLead(lead)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Book Vendor
                        </Button>
                      </>
                    )}
                    {lead.status === 'booked' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/calendar')}
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          View Appointments
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            navigate(`/vendors/${lead.vendor.id}#reviews`);
                          }}
                        >
                          <Star className="w-4 h-4 mr-1" />
                          Write Review
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/messages')}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          View Messages
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/vendors/${lead.vendor.id}`)}
                    >
                      View Profile
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
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

export default MyWeddingTeam;