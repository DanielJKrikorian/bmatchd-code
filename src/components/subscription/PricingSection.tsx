import React, { useState } from 'react';
import { PricingCard } from './PricingCard';
import { Button } from '../ui/button';
import type { SubscriptionPlan } from '../../types';

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'essential',
    name: 'Essential Listing',
    price: 29,
    yearlyPrice: 290,
    description: 'Get found and start booking clients',
    features: [
      'Standard Listing in Vendor Directory',
      'Appear in Relevant Search Results',
      'Contact Requests from Interested Clients',
      'Access to Basic Analytics'
    ],
    priceId: {
      monthly: 'price_1Qm0j3AkjdPARDjPzuQeCIMv', // Updated: Essential Monthly
      yearly: 'price_1Qm0j0AkjdPARDjPTefXNs7O'  // Updated: Essential Yearly
    }
  },
  {
    id: 'featured',
    name: 'Featured Listing',
    price: 59,
    yearlyPrice: 590,
    description: 'Stand out and get more leads',
    features: [
      'Everything in Essential Listing',
      'Priority Placement in Search Results',
      'Featured Badge',
      'Lead Boost',
      'Enhanced Profile'
    ],
    priceId: {
      monthly: 'price_1Qm0iyAkjdPARDjPwP6t2XOA', // Updated: Featured Monthly
      yearly: 'price_1Qm0ivAkjdPARDjPZmvd6zCy'  // Updated: Featured Yearly
    }
  },
  {
    id: 'elite',
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
      'Advanced Analytics & Insights'
    ],
    priceId: {
      monthly: 'price_1Qm0itAkjdPARDjP5L87NBDb', // Updated: Elite Monthly
      yearly: 'price_1Qm0ipAkjdPARDjPF78SLb2j'  // Updated: Elite Yearly
    }
  }
];

interface PricingSectionProps {
  currentPlan?: SubscriptionPlan['id'];
}

export function PricingSection({ currentPlan }: PricingSectionProps) {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-gray-600 mb-8">Select the perfect plan to showcase your services</p>
        
        <div className="inline-flex items-center rounded-full border p-1 mb-8">
          <Button
            variant={!isAnnual ? 'default' : 'ghost'}
            className="rounded-full"
            onClick={() => setIsAnnual(false)}
          >
            Monthly
          </Button>
          <Button
            variant={isAnnual ? 'default' : 'ghost'}
            className="rounded-full"
            onClick={() => setIsAnnual(true)}
          >
            Yearly (Save up to 20%)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            isAnnual={isAnnual}
            isCurrentPlan={currentPlan === plan.id}
          />
        ))}
      </div>
    </div>
  );
}