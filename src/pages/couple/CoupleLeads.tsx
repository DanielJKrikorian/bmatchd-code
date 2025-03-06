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
  message_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'booked';
  wedding_date: string | null;
  budget: number | null;
  notes: string | null;
  created_at: string;
  vendor: {
    id: string;
    business_name: string;
    category: string;
    location: string;
    rating: number;
    images: string[];
  };
  message: {
    content: string;
  };
}

const CoupleLeads = () => {
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
        toast.error('Failed to load leads');
        return;
      }

      // Get leads with vendor details and message content
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          *,
          vendor:vendors (
            id,
            business_name,
            category,
            location,
            rating,
            images
          ),
          message:messages (
            content
          )
        `)
        .eq('couple_id', coupleData.id)
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
          <h1 className="text-3xl font-bold">Your Inquiries</h1>
          <p className="text-gray-600">Track your vendor inquiries and responses</p>
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
          <h2 className="text-xl font-semibold mb-2">No inquiries found</h2>
          <p className="text-gray-600 mb-6">
            {filter === 'all' 
              ? 'Start exploring vendors and send them messages to see your inquiries here.'
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
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-semibold">
                      {lead.vendor.business_name}
                    </h3>
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
                  </div>
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
                  <p className="text-gray-600 mt-2">
                    Your message: {lead.message.content}
                  </p>
                  <p className="text-sm text-gray-500">
                    Sent on: {new Date(lead.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {lead.status === 'accepted' ? (
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
                        onClick={() => navigate('/messages')}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        View Messages
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/vendors/${lead.vendor.id}`)}
                    >
                      View Profile
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoupleLeads;