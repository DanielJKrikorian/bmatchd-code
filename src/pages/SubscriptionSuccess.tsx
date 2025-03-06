import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Loader2, ArrowRight, Crown, Star, Calendar, AlertCircle, Share2, Users, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface SubscriptionDetails {
  plan_type: string;
  plan_name: string;
  billing_interval: string;
  end_date: string | null;
}

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [subscription, setSubscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setStatus('error');
          toast.error('Authentication required');
          navigate('/auth');
          return;
        }

        // Get vendor profile
        const { data: vendor } = await supabase
          .from('vendors')
          .select('subscription_plan')
          .eq('user_id', user.id)
          .single();

        if (vendor?.subscription_plan) {
          setSubscription(vendor.subscription_plan);
          setStatus('success');
        } else {
          setStatus('error');
          toast.error('Subscription not found');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setError('Failed to verify subscription');
      }
    };

    verifyPayment();
  }, [navigate, searchParams]);

  const handleShare = async () => {
    try {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .single();

      if (!vendor) {
        toast.error('Vendor profile not found');
        return;
      }

      const profileUrl = `${window.location.origin}/vendors/${vendor.id}`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Check out my wedding vendor profile',
            text: 'Find me on BMATCHD - Your Wedding Vendor Marketplace',
            url: profileUrl
          });
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            await navigator.clipboard.writeText(profileUrl);
            toast.success('Profile link copied to clipboard!');
          }
        }
      } else {
        await navigator.clipboard.writeText(profileUrl);
        toast.success('Profile link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing profile:', error);
      toast.error('Failed to share profile');
    }
  };

  if (status === 'verifying') {
    return (
      <div className="max-w-lg mx-auto py-16 px-4">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Verifying Subscription</h1>
          <p className="text-gray-600">Please wait while we confirm your subscription...</p>
        </div>
      </div>
    );
  }

  if (status === 'error' || !subscription) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Subscription Verification Failed</h1>
          <p className="text-gray-600 mb-6">
            {error || 'We could not verify your subscription. Please contact support if you believe this is an error.'}
          </p>
          <div className="space-y-3">
            <Button className="w-full" onClick={() => navigate('/subscription')}>
              Try Again
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/dashboard')}
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Subscription Active!</h1>
          <p className="text-gray-600">
            Your {subscription} subscription is now active.
            You can now access all the features and start growing your business.
          </p>
        </div>

        {/* Next Steps Section */}
        <div className="border-t pt-8 mb-8">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Complete Your Profile</h3>
                <p className="text-gray-600 text-sm">
                  Add photos, services, and details to make your profile stand out to couples.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Share2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Share Your Profile</h3>
                <p className="text-gray-600 text-sm mb-2">
                  Share your profile link with potential clients and on social media.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Profile
                </Button>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Connect with Couples</h3>
                <p className="text-gray-600 text-sm">
                  Start receiving inquiries and booking requests from engaged couples.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button className="w-full" onClick={() => navigate('/vendor/settings')}>
            Complete Your Profile
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;