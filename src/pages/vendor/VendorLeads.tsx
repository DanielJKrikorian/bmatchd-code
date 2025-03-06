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
  couple: {
    id: string;
    user_id: string;
    partner1_name: string;
    partner2_name: string;
    city: {
      name: string;
      state: string;
    } | null;
  };
  message_thread_id?: string | null;
}

const VendorLeads = () => {
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
        navigate('/vendor/signin');
        return;
      }

      // Get vendor ID
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (vendorError) {
        console.error('Error fetching vendor:', vendorError);
        toast.error('Failed to load vendor profile');
        return;
      }

      if (!vendorData) {
        toast.error('Vendor profile not found');
        return;
      }

      // Get leads with couple details
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          *,
          couple:couples (
            id,
            user_id,
            partner1_name,
            partner2_name,
            city:cities (
              name,
              state
            )
          )
        `)
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;
      
      setLeads(leadsData || []);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleLeadAction = async (leadId: string, status: 'accepted' | 'declined') => {
    try {
      // Get lead details first
      const lead = leads.find(l => l.id === leadId);
      if (!lead) {
        toast.error('Lead not found');
        return;
      }

      // Update lead status
      const { error: updateError } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', leadId);

      if (updateError) throw updateError;

      setLeads(prev =>
        prev.map(lead =>
          lead.id === leadId ? { ...lead, status } : lead
        )
      );

      if (status === 'accepted') {
        toast.success('Lead accepted! You can now start messaging with the couple.');
      } else {
        toast.success('Lead declined successfully');
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
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
          vendor_id: lead.vendor_id,
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

      navigate('/vendor/messages');
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

      toast.success('Lead marked as booked and wedding appointment created!');
    } catch (error) {
      console.error('Error booking lead:', error);
      toast.error('Failed to book lead');
    }
  };

  const filteredLeads = leads.filter(lead => 
    filter === 'all' ? true : lead.status === filter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading leads...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <BackToDashboard />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-gray-600">Manage your incoming leads</p>
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
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No leads found</h2>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'When couples contact you, their inquiries will appear here.'
              : `No ${filter} leads at the moment.`}
          </p>
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
                  <h3 className="text-xl font-semibold">
                    {lead.couple.partner1_name} & {lead.couple.partner2_name}
                  </h3>

                  <div className="bg-gray-50 p-4 rounded-lg max-w-2xl space-y-4">
                    {lead.wedding_date && (
                      <p className="text-gray-600">
                        Wedding Date: {new Date(lead.wedding_date).toLocaleDateString()}
                      </p>
                    )}
                    {lead.budget && (
                      <p className="text-gray-600">
                        Budget Range: ${lead.budget.toLocaleString()}
                      </p>
                    )}
                    {lead.guest_count && (
                      <p className="text-gray-600">
                        Estimated Guest Count: {lead.guest_count}
                      </p>
                    )}
                    {lead.venue_location && (
                      <p className="text-gray-600">
                        Venue Location: {lead.venue_location}
                      </p>
                    )}
                    {lead.additional_details && (
                      <div>
                        <p className="font-medium mb-2">Additional Details:</p>
                        <p className="text-gray-600 whitespace-pre-wrap">{lead.additional_details}</p>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {lead.couple.city ? `${lead.couple.city.name}, ${lead.couple.city.state}` : 'Location not specified'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Received: {new Date(lead.created_at).toLocaleDateString()}
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
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleLeadAction(lead.id, 'declined')}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          className="text-green-600 bg-green-100 hover:bg-green-200"
                          onClick={() => handleLeadAction(lead.id, 'accepted')}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                      </>
                    )}
                    {lead.status === 'accepted' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => lead.message_thread_id ? navigate('/messages') : handleStartMessage(lead)}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {lead.message_thread_id ? 'View Messages' : 'Start Message'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/calendar')}
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          Add to Calendar
                        </Button>
                        <Button
                          size="sm"
                          className="text-green-600 bg-green-100 hover:bg-green-200"
                          onClick={() => handleBookLead(lead)}
                        >
                          <Store className="w-4 h-4 mr-1" />
                          Book Wedding
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
                          View Wedding
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

export default VendorLeads;