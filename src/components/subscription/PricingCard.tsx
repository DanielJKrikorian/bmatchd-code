import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '../ui/button';
import type { SubscriptionPlan } from '../../types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface PricingCardProps {
  plan: SubscriptionPlan;
  isAnnual: boolean;
  isCurrentPlan?: boolean;
}

export function PricingCard({ plan, isAnnual, isCurrentPlan }: PricingCardProps) {
  const navigate = useNavigate();
  const price = isAnnual ? plan.yearlyPrice : plan.price;
  const [loading, setLoading] = useState(false);
  
  const handleSubscribe = () => {
    try {
      setLoading(true);
      
      if (isCurrentPlan) {
        navigate('/subscription/manage');
        return;
      }

      navigate('/subscription/payment', {
        state: {
          planId: isAnnual ? plan.priceId.yearly : plan.priceId.monthly, // Fixed to use isAnnual
          interval: isAnnual ? 'yearly' : 'monthly',
        },
      });
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Unable to load payment page');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm p-8 border-2 ${plan.id === 'elite' ? 'border-primary' : 'border-transparent'}`}>
      {plan.badge && (
        <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          {plan.badge}
        </span>
      )}
      
      <h3 className="text-2xl font-bold">{plan.name}</h3>
      <p className="text-gray-600 mt-2 mb-4">{plan.description}</p>
      
      <div className="mb-6">
        <span className="text-4xl font-bold">${price}</span>
        <span className="text-gray-600">/{isAnnual ? 'year' : 'month'}</span>
        {isAnnual && (
          <div className="text-sm text-primary mt-1">
            Save ${(plan.price * 12 - plan.yearlyPrice).toFixed(2)} annually
          </div>
        )}
      </div>
      
      <ul className="space-y-4 mb-8">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="w-5 h-5 text-primary shrink-0 mr-3" />
            <span className="text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>
      
      <Button
        className="w-full"
        variant={plan.id === 'elite' ? 'default' : 'outline'}
        onClick={handleSubscribe}
        disabled={loading}
      >
        {isCurrentPlan ? 'Manage Plan' : 'Subscribe Now'}
      </Button>
    </div>
  );
}