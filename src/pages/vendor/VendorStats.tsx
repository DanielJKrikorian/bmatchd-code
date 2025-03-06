import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Users2, Calendar, MessageSquare, Star, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import BackToDashboard from '../../components/BackToDashboard';

interface StatsData {
  totalLeads: number;
  totalBookings: number;
  totalMessages: number;
  averageRating: number;
  responseRate: number;
  profileViews: {
    total: number;
    unique: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  monthlyStats: {
    month: string;
    leads: number;
    bookings: number;
  }[];
}

const VendorStats = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>({
    totalLeads: 0,
    totalBookings: 0,
    totalMessages: 0,
    averageRating: 0,
    responseRate: 0,
    profileViews: {
      total: 0,
      unique: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0
    },
    monthlyStats: []
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/vendor/signin');
        return;
      }

      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id, rating')
        .eq('user_id', user.id)
        .single();

      if (!vendorData) {
        toast.error('Vendor profile not found');
        return;
      }

      // Get total leads
      const { data: leads } = await supabase
        .from('leads')
        .select('created_at, status')
        .eq('vendor_id', vendorData.id);

      // Get total bookings
      const { data: bookings } = await supabase
        .from('appointments')
        .select('created_at, status')
        .eq('vendor_id', vendorData.id)
        .eq('status', 'confirmed');

      // Get total messages
      const { data: messages } = await supabase
        .from('messages')
        .select('created_at, status')
        .eq('receiver_id', user.id);

      // Get profile views stats
      const { data: viewsData } = await supabase
        .from('vendor_profile_views')
        .select('id, viewer_id, created_at')
        .eq('vendor_id', vendorData.id);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(now.setDate(now.getDate() - 7));
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const uniqueViewers = new Set(viewsData?.map(view => view.viewer_id || view.id));

      // Calculate response rate
      const totalInquiries = messages?.length || 0;
      const respondedInquiries = messages?.filter(m => m.status !== 'pending').length || 0;
      const responseRate = totalInquiries > 0 ? (respondedInquiries / totalInquiries) * 100 : 0;

      // Calculate monthly stats for the last 6 months
      const monthlyStats = [];
      const today2 = new Date();
      for (let i = 0; i < 6; i++) {
        const month = new Date(today2.getFullYear(), today2.getMonth() - i, 1);
        const monthStr = month.toLocaleString('default', { month: 'short' });
        
        const monthLeads = leads?.filter(l => {
          const leadDate = new Date(l.created_at);
          return leadDate.getMonth() === month.getMonth() && 
                 leadDate.getFullYear() === month.getFullYear();
        }).length || 0;

        const monthBookings = bookings?.filter(b => {
          const bookingDate = new Date(b.created_at);
          return bookingDate.getMonth() === month.getMonth() && 
                 bookingDate.getFullYear() === month.getFullYear();
        }).length || 0;

        monthlyStats.unshift({ month: monthStr, leads: monthLeads, bookings: monthBookings });
      }

      setStats({
        totalLeads: leads?.length || 0,
        totalBookings: bookings?.length || 0,
        totalMessages: messages?.length || 0,
        averageRating: vendorData.rating || 0,
        responseRate,
        profileViews: {
          total: viewsData?.length || 0,
          unique: uniqueViewers.size,
          today: viewsData?.filter(view => new Date(view.created_at) >= today).length || 0,
          thisWeek: viewsData?.filter(view => new Date(view.created_at) >= thisWeek).length || 0,
          thisMonth: viewsData?.filter(view => new Date(view.created_at) >= thisMonth).length || 0
        },
        monthlyStats
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <BackToDashboard />
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Business Statistics</h1>
        <p className="text-gray-600">Track your performance and growth</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          {
            label: 'Total Leads',
            value: stats.totalLeads,
            icon: <Users2 className="w-8 h-8 text-primary" />,
            description: 'Total inquiries received'
          },
          {
            label: 'Bookings',
            value: stats.totalBookings,
            icon: <Calendar className="w-8 h-8 text-primary" />,
            description: 'Confirmed appointments'
          },
          {
            label: 'Response Rate',
            value: `${Math.round(stats.responseRate)}%`,
            icon: <MessageSquare className="w-8 h-8 text-primary" />,
            description: 'Message response rate'
          },
          {
            label: 'Average Rating',
            value: stats.averageRating.toFixed(1),
            icon: <Star className="w-8 h-8 text-primary" />,
            description: 'Average customer rating'
          },
          {
            label: 'Profile Views',
            value: stats.profileViews.total,
            icon: <TrendingUp className="w-8 h-8 text-primary" />,
            description: 'Times your profile was viewed'
          },
          {
            label: 'Conversion Rate',
            value: `${stats.totalLeads > 0 ? Math.round((stats.totalBookings / stats.totalLeads) * 100) : 0}%`,
            icon: <DollarSign className="w-8 h-8 text-primary" />,
            description: 'Lead to booking rate'
          }
        ].map((metric, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 mb-1">{metric.label}</p>
                <p className="text-3xl font-semibold">{metric.value}</p>
                <p className="text-sm text-gray-500 mt-1">{metric.description}</p>
              </div>
              <div className="p-3 bg-primary/5 rounded-full">
                {metric.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Performance */}
      <section className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-primary" />
          Monthly Performance
        </h2>
        <div className="relative">
          <div className="flex justify-between mb-4">
            {stats.monthlyStats.map((month, index) => (
              <div key={index} className="flex-1 text-center">
                <div className="text-sm text-gray-600 mb-2">{month.month}</div>
                <div className="space-y-2">
                  <div 
                    className="mx-auto w-4 bg-primary transition-all duration-300"
                    style={{ height: `${Math.min(month.leads * 10, 150)}px` }}
                    title={`${month.leads} leads`}
                  />
                  <div 
                    className="mx-auto w-4 bg-green-500 transition-all duration-300"
                    style={{ height: `${Math.min(month.bookings * 10, 150)}px` }}
                    title={`${month.bookings} bookings`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-8 mt-4 pt-4 border-t">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-primary rounded-full mr-2" />
              <span className="text-sm text-gray-600">Leads</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
              <span className="text-sm text-gray-600">Bookings</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VendorStats;