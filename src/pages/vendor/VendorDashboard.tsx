import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, MessageSquare, Settings, LogOut, Star, Store, Link as LinkIcon, Check, 
  BarChart3, Package, Globe, Eye, Gift 
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import ProfileProgress from '../../components/ProfileProgress';
import BadgeDownload from '../../components/vendor/BadgeDownload';
import type { Vendor } from '../../types';

interface VendorDashboardProps {
  vendor: Vendor;
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ vendor }) => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    appointmentsCount: 0,
    unreadMessages: 0,
    pendingLeads: 0,
    totalAppointments: 0,
  });
  const [showCopied, setShowCopied] = useState(false);
  const [planName, setPlanName] = useState<string>('');
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [stripeCouponId, setStripeCouponId] = useState<string | null>(null);
  const [generatingCoupon, setGeneratingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const loadVendorMetrics = useCallback(async () => {
    try {
      const [
        { data: upcomingAppointments },
        { data: messages },
        { data: leads },
        { data: totalAppointments },
      ] = await Promise.all([
        supabase
          .from('appointments')
          .select('id')
          .eq('vendor_id', vendor.id)
          .in('status', ['confirmed', 'booked'])
          .gte('wedding_date', new Date().toISOString().split('T')[0]),
        supabase
          .from('messages')
          .select('id')
          .eq('receiver_id', vendor.user_id)
          .eq('status', 'pending'),
        supabase
          .from('leads')
          .select('id')
          .eq('vendor_id', vendor.id)
          .eq('status', 'pending'),
        supabase
          .from('appointments')
          .select('id')
          .eq('vendor_id', vendor.id),
      ]);

      setMetrics({
        appointmentsCount: upcomingAppointments?.length || 0,
        unreadMessages: messages?.length || 0,
        pendingLeads: leads?.length || 0,
        totalAppointments: totalAppointments?.length || 0,
      });
    } catch (error) {
      console.error('Error loading vendor metrics:', error);
      toast.error('Failed to load dashboard statistics');
    }
  }, [vendor.id, vendor.user_id]);

  const loadPlanDetails = useCallback(async () => {
    if (!vendor.subscription_plan) {
      setPlanName('No Plan');
      return;
    }
    try {
      const { data: planData, error } = await supabase
        .from('subscription_plans')
        .select('plan_name')
        .eq('stripe_price_id', vendor.subscription_plan)
        .single();

      if (error) {
        console.error('Error loading plan details:', error);
        const fallbackName = vendor.subscription_plan
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        setPlanName(fallbackName || 'No Plan');
        return;
      }

      const displayName = planData.plan_name.replace(' Monthly', '').replace(' Yearly', '');
      setPlanName(displayName);
    } catch (error) {
      console.error('Error loading plan details:', error);
      setPlanName(vendor.subscription_plan.charAt(0).toUpperCase() + vendor.subscription_plan.slice(1) || 'No Plan');
    }
  }, [vendor.subscription_plan]);

  const loadCoupon = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_coupons')
        .select('coupon_code, stripe_coupon_id')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No coupon found for vendor:', vendor.id);
          setCouponCode(null);
          setStripeCouponId(null);
        } else {
          console.error('Error loading coupon:', error);
          throw error;
        }
      } else {
        setCouponCode(data?.coupon_code || null);
        setStripeCouponId(data?.stripe_coupon_id || null);
      }
    } catch (error) {
      console.error('Error loading coupon:', error);
      setCouponCode(null);
      setStripeCouponId(null);
    }
  }, [vendor.id]);

  const generateCoupon = async () => {
    setGeneratingCoupon(true);
    setCouponError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('generate-coupon', {
        body: JSON.stringify({ vendor_id: vendor.id, business_name: vendor.business_name }),
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('Edge Function Response:', { data, functionError });

      if (functionError) {
        throw new Error(`Function error: ${functionError.message || 'Unknown error'}`);
      }

      if (!data || !data.couponCode) {
        throw new Error('No coupon code returned from function');
      }

      setCouponCode(data.couponCode);
      setStripeCouponId(data.stripeCouponId);
      toast.success('Coupon generated successfully!');
      await loadCoupon();
    } catch (error: any) {
      console.error('Error generating coupon:', error);
      setCouponError(error.message || 'Failed to generate coupon');
      toast.error(error.message || 'Failed to generate coupon');
    } finally {
      setGeneratingCoupon(false);
    }
  };

  useEffect(() => {
    loadVendorMetrics();
    loadPlanDetails();
    loadCoupon();
  }, [loadVendorMetrics, loadPlanDetails, loadCoupon]);

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
      const profileUrl = `${window.location.origin}/vendors/${vendor.slug}`;
      if (navigator.share) {
        await navigator.share({
          title: 'Check out my wedding vendor profile',
          text: 'Find me on BMATCHD - Your Wedding Vendor Marketplace',
          url: profileUrl,
        });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
        toast.success('Profile link copied to clipboard!');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing profile:', error);
        toast.error('Failed to share profile');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome, {vendor.business_name || 'Vendor'}!</h1>
          <p className="text-gray-600">Manage your wedding business</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/reviews')}>
            <Star className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Reviews</span>
          </Button>
          <Button variant="outline" onClick={() => navigate('/vendor/packages')}>
            <Package className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Packages</span>
          </Button>
          <Button variant="outline" onClick={() => navigate('/stats')}>
            <BarChart3 className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Stats</span>
          </Button>
          <Button variant="outline" onClick={() => navigate('/vendor/settings')}>
            <Settings className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Log Out</span>
          </Button>
        </div>
      </div>

      <ProfileProgress vendor={vendor} />

      {!vendor.subscription_plan && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Globe className="w-6 h-6 text-yellow-600 mr-3" />
              <div>
                <p className="text-gray-800 font-medium">Get Listed to Reach Couples</p>
                <p className="text-gray-600 text-sm">
                  Subscribe to a plan to list your business and start connecting with engaged couples.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/subscription')}
              variant="default"
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              Get Listed
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { 
            icon: <Calendar className="w-6 h-6 text-rose-500" />, 
            label: 'Upcoming Appointments',
            value: metrics.appointmentsCount.toString(),
            onClick: () => navigate('/calendar'),
            showEmpty: metrics.appointmentsCount === 0,
          },
          { 
            icon: <MessageSquare className="w-6 h-6 text-rose-500" />, 
            label: 'Unread Messages',
            value: metrics.unreadMessages.toString(),
            onClick: () => navigate('/vendor/messages'),
            showEmpty: metrics.unreadMessages === 0,
          },
          { 
            icon: <Store className="w-6 h-6 text-rose-500" />, 
            label: 'Pending Leads', 
            value: metrics.pendingLeads.toString(),
            onClick: () => navigate('/vendor/leads'),
            showEmpty: metrics.pendingLeads === 0,
          },
          { 
            icon: <Calendar className="w-6 h-6 text-rose-500" />, 
            label: 'Total Appointments', 
            value: metrics.totalAppointments.toString(),
            onClick: () => navigate('/calendar'),
            showEmpty: metrics.totalAppointments === 0,
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

      <section className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Subscription Status</h2>
            <p className="text-gray-600">Current Plan: {planName}</p>
          </div>
          <Button 
            onClick={() => navigate(vendor.subscription_plan ? '/subscription/manage' : '/subscription')}
            variant={vendor.subscription_plan ? 'outline' : 'default'}
          >
            {vendor.subscription_plan ? 'Manage Plan' : 'Choose a Plan'}
          </Button>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Referral Program</h2>
            <p className="text-gray-600">
              Generate a 10% off coupon for any vendors you work with to use on their first month!
            </p>
            {couponCode && (
              <div className="mt-2">
                <p className="text-gray-800 font-medium">
                  Your Coupon Code: <span className="text-primary">{couponCode}</span>
                </p>
                {stripeCouponId && (
                  <p className="text-gray-600 text-sm">
                    Stripe Coupon ID: <span className="text-primary">{stripeCouponId}</span>
                  </p>
                )}
              </div>
            )}
            {couponError && (
              <p className="text-red-600 text-sm mt-2">{couponError}</p>
            )}
          </div>
          <Button
            onClick={generateCoupon}
            disabled={generatingCoupon || !!couponCode}
            variant="default"
          >
            {generatingCoupon ? (
              <>
                <Check className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : couponCode ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Coupon Generated
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Generate Coupon
              </>
            )}
          </Button>
        </div>
      </section>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold mb-2">Share Your Profile</h2>
            <p className="text-gray-600">Share your profile link with potential clients</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/vendors/${vendor.slug}/preview`)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button 
              variant="outline" 
              onClick={handleShare}
              className="min-w-[120px]"
            >
              {showCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Share
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {vendor.subscription_plan && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-xs">
              <h3 className="text-sm font-medium mb-1">BMATCHD Pro Badge</h3>
              <p className="text-xs text-gray-500">Display your verified status on your website</p>
            </div>
            <BadgeDownload businessName={vendor.business_name} />
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;