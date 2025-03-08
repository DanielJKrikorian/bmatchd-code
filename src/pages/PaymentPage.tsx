import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, CreditCard, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Use a stable stripePromise outside the component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51Qidb0AkjdPARDoIblpf881c4AGwku6GaAiyKMXQXtU763AatyWz9QuT6go5dvDOIynbbXuXxuwQPxnyBS00ISD0g2xO');

console.log('PaymentPage: Loading Stripe with VITE_STRIPE_PUBLIC_KEY:', import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_...');

const SUBSCRIPTION_PLANS = [
  { id: 'essential', name: 'Essential Listing', price: 29, yearlyPrice: 290, description: 'Get found and start booking clients', features: ['Standard Listing in Vendor Directory', 'Appear in Relevant Search Results', 'Contact Requests from Interested Clients', 'Access to Basic Analytics'], priceId: { monthly: 'price_1Qm0j3AkjdPARDjPzuQeCIMv', yearly: 'price_1Qm0j0AkjdPARDjPTefXNs7O' } },
  { id: 'featured', name: 'Featured Listing', price: 59, yearlyPrice: 590, description: 'Stand out and get more leads', features: ['Everything in Essential Listing', 'Priority Placement in Search Results', 'Featured Badge', 'Lead Boost', 'Enhanced Profile'], priceId: { monthly: 'price_1Qm0iyAkjdPARDjPwP6t2XOA', yearly: 'price_1Qm0ivAkjdPARDjPZmvd6zCy' } },
  { id: 'elite', name: 'Elite Listing', price: 99, yearlyPrice: 990, description: 'Maximum exposure & premium leads', badge: 'Most Popular', features: ['Everything in Featured Listing', 'Top Placement on Homepage & Search', 'Exclusive Vendor Spotlight', 'Verified Vendor Badge', 'Instant Lead Notifications', 'Advanced Analytics & Insights'], priceId: { monthly: 'price_1Qm0itAkjdPARDjP5L87NBDb', yearly: 'price_1Qm0ipAkjdPARDjPF78SLb2j' } }
];

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const { planId, interval = 'monthly' } = location.state || { planId: 'price_1Qm0j3AkjdPARDjPzuQeCIMv' };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: { line1: '', city: '', state: '', postal_code: '', country: 'US' },
    couponCode: '',
  });
  const [discount, setDiscount] = useState<number>(0);
  const [discountedPrice, setDiscountedPrice] = useState<number>(0);

  useEffect(() => {
    console.log('PaymentPage: Mounted with planId:', planId, 'interval:', interval);
    if (!planId) {
      toast.error('Invalid plan selection');
      navigate('/subscription');
    }
    const plan = SUBSCRIPTION_PLANS.find(p => p.priceId.monthly === planId || p.priceId.yearly === planId) || SUBSCRIPTION_PLANS[0];
    const basePrice = interval === 'yearly' ? plan.yearlyPrice : plan.price;
    setDiscountedPrice(basePrice);
  }, [planId, interval, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleApplyCoupon = async () => {
    if (!formData.couponCode) {
      toast.error('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    try {
      console.log('PaymentPage: Applying promo code:', formData.couponCode);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('https://rtzrhxxdqmnpydskixso.supabase.co/functions/v1/stripe-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: session.user.id,
          paymentMethodId: null, // Just for coupon validation
          priceId: planId,
          couponCode: formData.couponCode,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Invalid or expired promo code');

      if (result.couponApplied && result.discountPercent) {
        const plan = SUBSCRIPTION_PLANS.find(p => p.priceId.monthly === planId || p.priceId.yearly === planId) || SUBSCRIPTION_PLANS[0];
        const basePrice = interval === 'yearly' ? plan.yearlyPrice : plan.price;
        setDiscount(result.discountPercent);
        setDiscountedPrice(basePrice * (1 - result.discountPercent));
        toast.success(`Promo code ${formData.couponCode} applied! ${(result.discountPercent * 100)}% off`);
      } else {
        setDiscount(0);
        setDiscountedPrice(SUBSCRIPTION_PLANS.find(p => p.priceId.monthly === planId || p.priceId.yearly === planId)!.price);
        toast.error('Invalid or expired promo code');
      }
    } catch (err: any) {
      console.error('PaymentPage: Error validating promo code:', err);
      setDiscount(0);
      setDiscountedPrice(SUBSCRIPTION_PLANS.find(p => p.priceId.monthly === planId || p.priceId.yearly === planId)!.price);
      toast.error(err.message || 'Failed to validate promo code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      console.log('PaymentPage: Stripe or Elements not loaded');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card input error');

      console.log('PaymentPage: Creating payment method with Stripe');
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: formData.name,
          email: formData.email,
          address: formData.address,
        },
      });

      if (pmError) {
        console.error('PaymentPage: Stripe createPaymentMethod error:', pmError);
        throw pmError;
      }

      console.log('PaymentPage: PaymentMethod created:', paymentMethod.id);

      console.log('PaymentPage: Calling Supabase Edge Function for subscription');
      const response = await fetch('https://rtzrhxxdqmnpydskixso.supabase.co/functions/v1/stripe-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: session.user.id,
          paymentMethodId: paymentMethod.id,
          priceId: planId,
          couponCode: formData.couponCode || null,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create subscription');

      const { clientSecret } = result;
      if (clientSecret) {
        console.log('PaymentPage: Confirming card payment with Stripe');
        const { error: confirmError } = await stripe.confirmCardPayment(clientSecret);
        if (confirmError) throw confirmError;
      }

      console.log('PaymentPage: Subscription successful:', result.subscriptionId);
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err: any) {
      console.error('PaymentPage: Error:', err);
      toast.error(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const plan = SUBSCRIPTION_PLANS.find(p => p.priceId.monthly === planId || p.priceId.yearly === planId) || SUBSCRIPTION_PLANS[0];
  const isAnnual = interval === 'yearly';
  const basePrice = isAnnual ? plan.yearlyPrice : plan.price;

  if (showSuccess) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Payment Successful!</h2>
          <p className="text-gray-600">Your {plan.name} subscription is active. Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-white rounded-lg shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">{plan.name}</h2>
          <p className="text-gray-700 mb-4">{plan.description}</p>
          <ul className="text-gray-600 space-y-1">
            {plan.features.map((feature, index) => (
              <li key={index} className="text-sm">- {feature}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Complete Your Subscription</h1>
            <p className="text-gray-600 mt-2">Enter your details to start your {plan.name}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
                placeholder="john.doe@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
              <input
                type="text"
                name="address.line1"
                value={formData.address.line1}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none mb-2"
                placeholder="123 Main St"
              />
              <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none mb-2"
                placeholder="City"
              />
              <input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none mb-2"
                placeholder="State"
              />
              <input
                type="text"
                name="address.postal_code"
                value={formData.address.postal_code}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none mb-2"
                placeholder="Postal Code"
              />
              <input
                type="text"
                name="address.country"
                value={formData.address.country}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
                placeholder="Country (e.g., US)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  name="couponCode"
                  value={formData.couponCode}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
                  placeholder="Enter coupon code (e.g., LAUNCH)"
                />
                <Button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !formData.couponCode}
                >
                  {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </Button>
              </div>
              {discount > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  Discount applied: ${basePrice} → ${discountedPrice.toFixed(2)} ({(discount * 100)}% off)
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card Information</label>
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#333',
                      '::placeholder': { color: '#aaa' },
                    },
                  },
                }}
              />
              <p className="text-xl font-bold mt-2">
                Total: ${discountedPrice.toFixed(2)}<span className="text-sm text-gray-600">/{isAnnual ? 'year' : 'month'}</span>
              </p>
            </div>
            <div className="text-center text-sm text-gray-500">
              <span>Powered by </span>
              <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Stripe</a>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !stripe || !elements}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Subscribe'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

const PaymentPageWrapper = () => (
  <Elements stripe={stripePromise}>
    <PaymentPage />
  </Elements>
);

export default PaymentPageWrapper;