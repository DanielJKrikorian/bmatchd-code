import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Shield, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import type { SubscriptionPlan } from '../types';

const SUBSCRIPTION_PLANS: Record<
  SubscriptionPlan['id'],
  Omit<SubscriptionPlan, 'id'>
> = {
  essential: {
    name: 'Essential Listing',
    price: 29,
    yearlyPrice: 290,
    description: 'Get found and start booking clients',
    features: [
      'Standard Listing in Vendor Directory',
      'Appear in Relevant Search Results',
      'Contact Requests from Interested Clients',
      'Access to Basic Analytics',
    ],
  },
  featured: {
    name: 'Featured Listing',
    price: 59,
    yearlyPrice: 590,
    description: 'Stand out and get more leads',
    features: [
      'Everything in Essential Listing',
      'Priority Placement in Search Results',
      'Featured Badge',
      'Lead Boost',
      'Enhanced Profile',
    ],
  },
  elite: {
    name: 'Elite Listing',
    price: 99,
    yearlyPrice: 990,
    description: 'Maximum exposure & premium leads',
    badge: 'Most Popular',
    features: [
      'Everything in Featured Listing',
      'Top Placement on Homepage & Search',
      'Exclusive Vendor Spotlight',
      'Verified Vendor Badge',
      'Instant Lead Notifications',
      'Advanced Analytics & Insights',
    ],
  },
};

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<any>(null);

  const planId = searchParams.get('plan') as SubscriptionPlan['id'];
  const isAnnual = searchParams.get('billing') === 'annual';

  const plan = planId ? SUBSCRIPTION_PLANS[planId] : null;
  const price = isAnnual ? plan?.yearlyPrice : plan?.price;

  useEffect(() => {
    const loadVendorData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Please sign in to continue');
          navigate('/vendor/register');
          return;
        }

        const { data: vendorData, error } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setVendor(vendorData);
      } catch (error) {
        console.error('Error loading vendor data:', error);
        toast.error('Failed to load vendor data');
      } finally {
        setLoading(false);
      }
    };

    loadVendorData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Loading checkout...</p>
      </div>
    );
  }

  if (!plan || !planId) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Plan Selected</h1>
          <p className="text-gray-600 mb-6">
            Please select a valid subscription plan.
          </p>
          <Button onClick={() => navigate('/subscription')}>View Plans</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <button
        onClick={() => navigate('/subscription')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Plans
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Order Summary */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Complete Your Order</h1>
            <p className="text-gray-600">
              Review your subscription details below
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-gray-600">{plan.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">${price}</p>
                <p className="text-gray-600">/{isAnnual ? 'year' : 'month'}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Plan Features:</h4>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-gray-600">
                    <span className="text-primary mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {isAnnual && (
              <div className="bg-primary/5 rounded-lg p-4">
                <p className="text-primary font-medium">
                  You save ${(plan.price * 12 - plan.yearlyPrice).toFixed(2)}{' '}
                  with annual billing
                </p>
              </div>
            )}
          </div>

          {/* Business Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Business Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Business Name</p>
                <p className="font-medium">{vendor.business_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-medium">{vendor?.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{vendor.location}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="lg:sticky lg:top-8">
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Payment Summary</h3>

              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${price}</span>
              </div>

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${price}</span>
              </div>
            </div>

            <Button
              className="w-full h-12 text-lg"
              onClick={() =>
                navigate(
                  `/subscription/process?plan=${planId}&billing=${
                    isAnnual ? 'annual' : 'monthly'
                  }`
                )
              }
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Proceed to Payment
            </Button>

            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center text-sm text-gray-600">
                <Shield className="w-4 h-4 mr-2 text-primary" />
                Secure payment processing by Stripe
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2 text-primary" />
                Cancel or change your plan anytime
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;