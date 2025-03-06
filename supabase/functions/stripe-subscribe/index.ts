import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
});
const supabase = createClient(
  Deno.env.get('VITE_SUPABASE_URL')!,
  Deno.env.get('VITE_SUPABASE_ANON_KEY')!
);

serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers });

  const { userId, paymentMethodId, priceId } = await req.json();

  try {
    console.log('stripe-subscribe: Starting with:', { userId, paymentMethodId, priceId });
    const { data: { email } } = await supabase.auth.admin.getUserById(userId);
    if (!email) throw new Error('User email not found');

    console.log('stripe-subscribe: Creating customer for:', email);
    const customer = await stripe.customers.create({ 
      email, 
      payment_method: paymentMethodId,
      invoice_settings: { default_payment_method: paymentMethodId }
    });

    console.log('stripe-subscribe: Creating subscription for customer:', customer.id);
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
    });

    console.log('stripe-subscribe: Updating subscription in DB:', subscription.id);
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        plan_id: priceId,
        status: subscription.status,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    console.log('stripe-subscribe: Success:', subscription.id);
    return new Response(JSON.stringify({ subscriptionId: subscription.id }), { status: 200, headers });
  } catch (err: any) {
    console.error('stripe-subscribe: Error:', err);
    return new Response(err.message, { status: 500, headers });
  }
});