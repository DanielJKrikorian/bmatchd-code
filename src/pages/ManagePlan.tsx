import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Star, Calendar, CreditCard, XCircle, Loader2, CheckCircle } from 'lucide-react';
import { Button } from "../components/ui/button.tsx";
import { supabase } from "../lib/supabase.ts";
import { toast } from 'react-hot-toast';

const SUBSCRIPTION_PLANS = [
  { id: 'essential', name: 'Essential Listing', price: 29, yearlyPrice: 290, priceId: { monthly: 'price_1Qm0j3AkjdPARDjPzuQeCIMv', yearly: 'price_1Qm0j0AkjdPARDjPTefXNs7O' } },
  { id: 'featured', name: 'Featured Listing', price: 59, yearlyPrice: 590, priceId: { monthly: 'price_1Qm0iyAkjdPARDjPwP6t2XOA', yearly: 'price_1Qm0ivAkjdPARDjPZmvd6zCy' } },
  { id: 'elite', name: 'Elite Listing', price: 99, yearlyPrice: 990, priceId: { monthly: 'price_1Qm0itAkjdPARDjP5L87NBDb', yearly: 'price_1Qm0ipAkjdPARDjPF78SLb2j' } },
];

interface Subscription {
  plan_type: string;
  plan_name: string;
  billing_interval: 'monthly' | 'yearly';
  price: number;
  end_date: number;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: 'active' | 'pending_cancellation';
  plan_id: string;
}

interface PendingPlan {
  id: string;
  name: string;
  price: number;
  yearlyPrice: number;
}

const ManagePlan = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);
  const [showPlanSuccess, setShowPlanSuccess] = React.useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = React.useState<PendingPlan | null>(null);
  const [newPlanId, setNewPlanId] = React.useState<string>('');

  React.useEffect(() => {
    loadSubscriptionDetails();
  }, []);

  const loadSubscriptionDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Please sign in to view subscription details');

      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('subscription_plan, subscription_end_date')
        .eq('user_id', user.id)
        .maybeSingle();

      if (vendorError) throw vendorError;
      if (!vendor?.subscription_plan) {
        setError('No active subscription found');
        return;
      }

      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id, stripe_customer_id, status, plan_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subError) throw subError;
      if (!subData?.stripe_subscription_id) throw new Error('No Stripe subscription ID found');

      const plan = SUBSCRIPTION_PLANS.find(p => p.priceId.monthly === vendor.subscription_plan || p.priceId.yearly === vendor.subscription_plan);
      if (!plan) throw new Error('Plan not found');

      // Fetch Stripe subscription details via an Edge Function
      const { data: stripeSub, error: funcError } = await supabase.functions.invoke('get-subscription-details', {
        body: { stripe_subscription_id: subData.stripe_subscription_id },
      });

      if (funcError) throw funcError;

      const pendingUpdate = stripeSub.pending_update?.items?.[0]?.price
        ? SUBSCRIPTION_PLANS.find(p => p.priceId.monthly === stripeSub.pending_update.items[0].price || p.priceId.yearly === stripeSub.pending_update.items[0].price) || null
        : null;

      setSubscription({
        plan_type: plan.id,
        plan_name: plan.name,
        billing_interval: vendor.subscription_plan.includes('yearly') ? 'yearly' : 'monthly',
        price: vendor.subscription_plan.includes('yearly') ? plan.yearlyPrice : plan.price,
        end_date: stripeSub.current_period_end * 1000,
        stripe_subscription_id: subData.stripe_subscription_id,
        stripe_customer_id: subData.stripe_customer_id || '',
        status: stripeSub.cancel_at_period_end ? 'pending_cancellation' : subData.status === 'active' ? 'active' : 'pending_cancellation',
        plan_id: subData.plan_id,
      });
      setPendingPlan(pendingUpdate);
    } catch (err) {
      console.error('ManagePlan: Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async () => {
    if (!newPlanId || !subscription) return;

    setLoading(true);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('update-subscription-plan', {
        body: { subscription_id: subscription.stripe_subscription_id, new_plan_id: newPlanId },
      });

      if (funcError) throw funcError;
      toast.success(data?.message || 'Plan updated successfully!');
      loadSubscriptionDetails();
      setNewPlanId('');
      setShowPlanSuccess('Plan updated! Changes will apply at the next billing cycle.');
      setTimeout(() => setShowPlanSuccess(null), 5000);
    } catch (err) {
      console.error('ManagePlan: Error changing plan:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update plan');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;

    setLoading(true);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscription_id: subscription.stripe_subscription_id },
      });

      if (funcError) throw funcError;
      toast.success(data?.message || `Subscription scheduled to cancel on ${new Date(subscription.end_date).toLocaleDateString()}!`);
      setShowCancelConfirm(false);
      loadSubscriptionDetails();
    } catch (err) {
      console.error('ManagePlan: Error canceling subscription:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = () => {
    switch (subscription?.plan_type) {
      case 'elite': return <Crown className="w-8 h-8 text-yellow-600" />;
      case 'featured': return <Star className="w-8 h-8 text-blue-600" />;
      default: return <Star className="w-8 h-8 text-green-600" />;
    }
  };

  const getPlanColor = () => {
    switch (subscription?.plan_type) {
      case 'elite': return 'bg-yellow-100';
      case 'featured': return 'bg-blue-100';
      default: return 'bg-green-100';
    }
  };

  if (loading) return <p>Loading subscription...</p>;
  if (error || !subscription) return <p>{error || 'No active subscription found'}</p>;

  if (showPlanSuccess) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Plan Updated!</h2>
          <p className="text-gray-600">{showPlanSuccess}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className={`w-16 h-16 ${getPlanColor()} rounded-full flex items-center justify-center mx-auto mb-6`}>
          {getPlanIcon()}
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Manage Your Subscription</h1>
          <p className="text-gray-600">You're currently on the {subscription.plan_name} plan</p>
          {pendingPlan && <p className="text-gray-600 mt-2">Pending change to {pendingPlan.name} on {new Date(subscription.end_date).toLocaleDateString()}</p>}
          {subscription.status === 'pending_cancellation' && <p className="text-gray-600 mt-2">Pending cancellation on {new Date(subscription.end_date).toLocaleDateString()}</p>}
        </div>
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center"><Crown className="w-5 h-5 text-primary mr-3" /><span className="font-medium">Current Plan</span></div>
            <span className="text-gray-600">{subscription.plan_name}</span>
          </div>
          {pendingPlan && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center"><Crown className="w-5 h-5 text-primary mr-3" /><span className="font-medium">Next Plan</span></div>
              <span className="text-gray-600">{pendingPlan.name}</span>
            </div>
          )}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center"><Calendar className="w-5 h-5 text-primary mr-3" /><span className="font-medium">Billing Cycle</span></div>
            <span className="text-gray-600">{subscription.billing_interval === 'yearly' ? 'Yearly' : 'Monthly'}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center"><CreditCard className="w-5 h-5 text-primary mr-3" /><span className="font-medium">Price</span></div>
            <span className="text-gray-600">${subscription.price}/{subscription.billing_interval === 'yearly' ? 'year' : 'month'}</span>
          </div>
          {subscription.end_date && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center"><Calendar className="w-5 h-5 text-primary mr-3" /><span className="font-medium">Next Billing Date</span></div>
              <span className="text-gray-600">{new Date(subscription.end_date).toLocaleDateString()}</span>
            </div>
          )}
          {subscription.status === 'pending_cancellation' && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center"><XCircle className="w-5 h-5 text-red-600 mr-3" /><span className="font-medium">Cancellation Date</span></div>
              <span className="text-gray-600">{new Date(subscription.end_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Change Subscription Plan</h2>
          <select value={newPlanId} onChange={(e) => setNewPlanId((e.target as unknown as HTMLSelectElement & { value: string }).value)} className="w-full rounded-md border border-gray-300 px-3 py-2 mb-2">
            <option value="">Select a new plan</option>
            {SUBSCRIPTION_PLANS.map(plan => (
              <React.Fragment key={plan.id}>
                <option value={plan.priceId.monthly}>{plan.name} - Monthly (${plan.price})</option>
                <option value={plan.priceId.yearly}>{plan.name} - Yearly (${plan.yearlyPrice})</option>
              </React.Fragment>
            ))}
          </select>
          <Button onClick={handleChangePlan} disabled={!newPlanId || loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Update Plan'}
          </Button>
        </div>
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Cancel Subscription</h2>
          <Button variant="destructive" onClick={() => setShowCancelConfirm(true)} className="w-full">
            Cancel Subscription
          </Button>
          {showCancelConfirm && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
              <div className="bg-white rounded-lg p-6 max-w-md text-center">
                <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Are you sure?</h3>
                <p className="text-gray-600 mb-6">This will cancel your {subscription.plan_name} subscription at the end of the billing period on {new Date(subscription.end_date).toLocaleDateString()}.</p>
                <div className="flex space-x-2 justify-center">
                  <Button variant="destructive" onClick={handleCancel} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Yes, Cancel'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>No, Keep</Button>
                </div>
              </div>
            </div>
          )}
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default ManagePlan;