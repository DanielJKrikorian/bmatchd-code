import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, MessageSquare, Heart, Settings, LogOut, Link, Check, Globe, Eye, 
  DollarSign, Users2, Gift, Layout, ClipboardList, ArrowRight, Pencil, Store 
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import type { Couple } from '../../types';

interface CoupleDashboardProps {
  couple: Couple & { public_profile: boolean; venue?: string };
}

const getBudgetRange = (budget: number | null): string => {
  if (!budget) return 'Not set';
  
  const ranges = [
    { max: 15000, label: 'Under $15,000' },
    { max: 25000, label: '$15,000 - $25,000' },
    { max: 35000, label: '$25,000 - $35,000' },
    { max: 50000, label: '$35,000 - $50,000' },
    { max: 75000, label: '$50,000 - $75,000' },
    { max: 100000, label: '$75,000 - $100,000' },
    { max: 150000, label: '$100,000 - $150,000' },
    { max: 200000, label: '$150,000 - $200,000' }
  ];

  for (const range of ranges) {
    if (budget <= range.max) return range.label;
  }
  return 'Over $200,000';
};

const formatWeddingDate = (dateString: string | null): string => {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const CoupleDashboard: React.FC<CoupleDashboardProps> = ({ couple }) => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    appointmentsCount: 0,
    unreadMessages: 0,
    pendingLeads: 0,
    totalAppointments: 0
  });
  const [showCopied, setShowCopied] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state

  const loadCoupleMetrics = useCallback(async () => {
    try {
      const { data: upcomingAppointments } = await supabase
        .from('appointments')
        .select('id')
        .eq('couple_id', couple.id)
        .in('status', ['confirmed', 'booked'])
        .gte('wedding_date', new Date().toISOString().split('T')[0]);

      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('receiver_id', couple.user_id)
        .eq('status', 'pending');

      const { data: savedVendors } = await supabase
        .from('saved_vendors')
        .select('id')
        .eq('couple_id', couple.id);

      setMetrics({
        appointmentsCount: upcomingAppointments?.length || 0,
        unreadMessages: messages?.length || 0,
        pendingLeads: savedVendors?.length || 0,
        totalAppointments: upcomingAppointments?.length || 0
      });
    } catch (error) {
      console.error('Error loading couple metrics:', error);
      toast.error('Failed to load dashboard statistics');
    }
  }, [couple.id, couple.user_id]);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Please sign in to access the dashboard');
          navigate('/auth');
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;

        if (userData?.role !== 'couple') {
          toast.error('Access denied: You are not a couple');
          navigate('/auth');
          return;
        }

        // Role is confirmed as couple, proceed with metrics
        loadCoupleMetrics();
      } catch (error) {
        console.error('Error checking user role:', error);
        toast.error('Failed to load dashboard');
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [navigate, loadCoupleMetrics]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  const handleShare = async () => {
    try {
      const profileUrl = `${window.location.origin}/couples/${couple.id}`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${couple.partner1_name} & ${couple.partner2_name}'s Wedding`,
            text: 'View our wedding details and registry',
            url: profileUrl
          });
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            await navigator.clipboard.writeText(profileUrl);
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
            toast.success('Profile link copied to clipboard!');
          }
        }
      } else {
        await navigator.clipboard.writeText(profileUrl);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
        toast.success('Profile link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing profile:', error);
      toast.error('Failed to share profile');
    }
  };

  const togglePublicProfile = async () => {
    try {
      const { error } = await supabase
        .from('couples')
        .update({ 
          public_profile: !couple.public_profile,
          profile_slug: null
        })
        .eq('id', couple.id);

      if (error) throw error;

      toast.success(couple.public_profile ? 'Profile made private' : 'Profile made public');
      window.location.reload();
    } catch (error) {
      console.error('Error toggling profile visibility:', error);
      toast.error('Failed to update profile visibility');
    }
  };

  const getDaysUntilWedding = () => {
    if (!couple.wedding_date) return 'Not set';
    const weddingDate = new Date(couple.wedding_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    weddingDate.setHours(0, 0, 0, 0);
    const diffTime = weddingDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays.toString() : 'Wedding day passed';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome, {couple.partner1_name} & {couple.partner2_name}!</h1>
          <p className="text-gray-600">Plan your perfect wedding</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/couple/settings')}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>

      {/* Wedding Details */}
      <section className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">Wedding Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <p className="text-gray-600">Wedding Date</p>
                <p className="font-medium">{formatWeddingDate(couple.wedding_date)}</p>
              </div>
              <div>
                <p className="text-gray-600">Location</p>
                <p className="font-medium">{couple.venue || 'Not set'}</p>
              </div>
              <div>
                <p className="text-gray-600">Budget Range</p>
                <p className="font-medium">{getBudgetRange(couple.budget)}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline"
              onClick={togglePublicProfile}
              className="flex-1 sm:flex-none"
            >
              {couple.public_profile ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Make Private
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 mr-2" />
                  Make Public
                </>
              )}
            </Button>
            {couple.public_profile && (
              <Button 
                variant="outline"
                onClick={handleShare}
                className="flex-1 sm:flex-none"
              >
                {showCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4 mr-2" />
                    Share
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { 
            icon: <Calendar className="w-6 h-6 text-rose-500" />, 
            label: 'Days Until Wedding',
            value: getDaysUntilWedding(),
            onClick: () => navigate('/couple/settings')
          },
          { 
            icon: <Calendar className="w-6 h-6 text-rose-500" />, 
            label: 'Upcoming Appointments',
            value: metrics.appointmentsCount.toString(),
            onClick: () => navigate('/appointments'),
            showEmpty: metrics.appointmentsCount === 0
          },
          { 
            icon: <MessageSquare className="w-6 h-6 text-rose-500" />, 
            label: 'Unread Messages',
            value: metrics.unreadMessages.toString(),
            onClick: () => navigate('/couple/messages'),
            showEmpty: metrics.unreadMessages === 0
          },
          { 
            icon: <Heart className="w-6 h-6 text-rose-500" />, 
            label: 'Saved Vendors',
            value: metrics.pendingLeads.toString(),
            onClick: () => navigate('/saved-vendors'),
            showEmpty: metrics.pendingLeads === 0
          },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={stat.onClick}
            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left w-full"
          >
            <div className="flex items-center space-x-3">
              {stat.icon}
              <div>
                <p className="text-gray-600 text-sm">{stat.label}</p>
                {stat.showEmpty ? (
                  <p className="text-sm text-gray-500">None yet</p>
                ) : (
                  <p className="text-lg sm:text-xl font-semibold">{stat.value}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Wedding Management Tools */}
      <section className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm p-6 sm:p-8">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <ClipboardList className="w-5 h-5 mr-2 text-primary" />
          Wedding Management Tools
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {[
            {
              icon: <DollarSign className="w-6 h-6" />,
              title: "Budget",
              description: "Track expenses",
              color: 'bg-green-100 text-green-600',
              href: '/wedding/budget'
            },
            {
              icon: <Users2 className="w-6 h-6" />,
              title: "Guest List",
              description: "Manage RSVPs",
              color: 'bg-blue-100 text-blue-600',
              href: '/wedding/guests'
            },
            {
              icon: <Gift className="w-6 h-6" />,
              title: "Registry",
              description: "Manage gifts",
              color: 'bg-purple-100 text-purple-600',
              href: '/wedding/registry'
            },
            {
              icon: <Layout className="w-6 h-6" />,
              title: "Seating",
              description: "Plan layouts",
              color: 'bg-orange-100 text-orange-600',
              href: '/wedding/seating'
            },
            {
              icon: <ClipboardList className="w-6 h-6" />,
              title: "Checklist",
              description: "Track tasks",
              color: 'bg-pink-100 text-pink-600',
              href: '/wedding/checklist'
            }
          ].map((tool) => (
            <div
              key={tool.title}
              onClick={() => navigate(tool.href)}
              className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-6 cursor-pointer border border-gray-100 hover:border-primary/20"
            >
              <div className={`${tool.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {tool.icon}
              </div>
              <h3 className="font-semibold text-lg mb-1">{tool.title}</h3>
              <p className="text-gray-600 text-sm">{tool.description}</p>
              <div className="flex items-center text-primary font-medium mt-4 group-hover:translate-x-2 transition-transform">
                <span>Open</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => navigate('/vendors')}
          className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-6 cursor-pointer border-2 border-transparent hover:border-primary/20"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Find Vendors</h3>
              <p className="text-gray-600">Browse and connect with vendors</p>
            </div>
          </div>
          <div className="flex items-center text-primary font-medium mt-2 group-hover:translate-x-2 transition-transform">
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </div>

        <div 
          onClick={() => navigate('/couple/profile/edit')}
          className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-6 cursor-pointer border-2 border-transparent hover:border-primary/20"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
              <Pencil className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Edit Profile</h3>
              <p className="text-gray-600">Customize your couple profile</p>
            </div>
          </div>
          <div className="flex items-center text-primary font-medium mt-2 group-hover:translate-x-2 transition-transform">
            <span>Edit Now</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </div>

        <div 
          onClick={() => navigate('/saved-vendors')}
          className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-6 cursor-pointer border-2 border-transparent hover:border-primary/20"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-pink-100 rounded-full group-hover:scale-110 transition-transform">
              <Heart className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Saved Vendors</h3>
              <p className="text-gray-600">Review your shortlisted vendors</p>
            </div>
          </div>
          <div className="flex items-center text-primary font-medium mt-2 group-hover:translate-x-2 transition-transform">
            <span>View Saved</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </div>

        <div 
          onClick={() => navigate(`/couples/${couple.id}`)}
          className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-6 cursor-pointer border-2 border-transparent hover:border-primary/20"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
              <Eye className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Preview Profile</h3>
              <p className="text-gray-600">View your public profile</p>
            </div>
          </div>
          <div className="flex items-center text-primary font-medium mt-2 group-hover:translate-x-2 transition-transform">
            <span>View Profile</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default CoupleDashboard;