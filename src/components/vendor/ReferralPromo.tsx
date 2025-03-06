import React, { useState, useEffect } from 'react';
import { Gift, Copy, Check, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface ReferralPromoProps {
  vendorId: string;
}

const ReferralPromo: React.FC<ReferralPromoProps> = ({ vendorId }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    completedReferrals: 0,
    rewardsEarned: 0
  });
  const [showCopied, setShowCopied] = useState(false);

  useEffect(() => {
    loadReferralStats();
  }, [vendorId]);

  const loadReferralStats = async () => {
    try {
      const { data, error } = await supabase.rpc('check_referral_rewards', {
        vendor_id: vendorId
      });

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error loading referral stats:', error);
      toast.error('Failed to load referral stats');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const signupUrl = `${window.location.origin}/vendor/register?ref=${vendorId}`;
      await navigator.clipboard.writeText(signupUrl);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
      toast.success('Referral link copied to clipboard!');
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Referral Program</h2>
          <p className="text-gray-600">
            Earn free months by referring other vendors
          </p>
        </div>
        <div className="p-3 bg-primary/10 rounded-full">
          <Gift className="w-6 h-6 text-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Completed Referrals</p>
          <p className="text-2xl font-semibold">{stats.completedReferrals}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Free Months Earned</p>
          <p className="text-2xl font-semibold">{stats.rewardsEarned}</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Share your unique referral link with other vendors. When they sign up and subscribe, you'll earn rewards!
        </p>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleCopyLink}
        >
          {showCopied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Referral Link
            </>
          )}
        </Button>
        <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t">
          <span>3 referrals = 1 free month</span>
          <Button variant="ghost" size="sm" onClick={() => window.open('/vendor/ambassador', '_blank')}>
            Learn More
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReferralPromo;