// src/pages/VendorSubscription.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PricingSection } from '../components/subscription/PricingSection';
import type { SubscriptionPlan } from '../types';
import { supabase } from '../lib/supabase';

const VendorSubscription = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan['id'] | undefined>();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to access subscription plans');
        navigate('/vendor/register');
        return;
      }

      // Get vendor profile
      const { data: vendor } = await supabase
        .from('vendors')
        .select('subscription_plan, business_name')
        .eq('user_id', user.id)
        .single();

      // If vendor has no business name set, redirect to settings
      if (!vendor?.business_name) {
        navigate('/vendor/settings?newVendor=true');
        return;
      }

      if (vendor?.subscription_plan) {
        setCurrentPlan(vendor.subscription_plan as SubscriptionPlan['id']);
      }

      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Choose Your Subscription Plan</h1>
        <p className="text-xl text-gray-600">
          Select the perfect plan to grow your wedding business
        </p>
      </div>

      <PricingSection currentPlan={currentPlan} />
    </div>
  );
};

export default VendorSubscription;
