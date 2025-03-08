import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno';
import { config } from 'https://deno.land/x/dotenv@v3.2.2/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Load .env file for local development
config({ path: `${import.meta.dirname}/../.env`, export: true });

// Initialize Stripe with the secret key from environment
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-04-10',
});

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://rtzrhxxdqmnpydskixso.supabase.co';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0enJoeHhkcW1ucHlkc2tpeHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODI2NzA3MywiZXhwIjoyMDUzODQzMDczfQ.0DfkLrBnehL1O3RvfxsYMpjC69rTszOfuiuMKFUKiq0';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { headers: corsHeaders, status: 405 });
  }

  // Verify Authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { headers: corsHeaders, status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response('Unauthorized', { headers: corsHeaders, status: 401 });
  }

  const { userId, paymentMethodId, priceId, couponCode } = await req.json();

  try {
    console.log('STRIPE_SECRET_KEY loaded:', stripeSecretKey.slice(0, 4));
    console.log('SUPABASE_SERVICE_ROLE_KEY loaded:', supabaseServiceRoleKey.slice(0, 4));
    if (!stripeSecretKey || !supabaseServiceRoleKey) {
      throw new Error('Missing required environment variables');
    }

    console.log('stripe-subscribe: Starting with:', { userId, paymentMethodId, priceId, couponCode });
    if (userId !== user.id) {
      throw new Error('User ID mismatch');
    }

    const { data: { user: fetchedUser } } = await supabase.auth.admin.getUserById(userId);
    if (!fetchedUser || !fetchedUser.email) throw new Error('User email not found');

    // Validate coupon code if provided
    let promotionCodeId: string | null = null;
    let discountPercent: number | null = null;
    if (couponCode) {
      console.log('stripe-subscribe: Validating coupon code:', couponCode);
      const promoResponse = await fetch(`https://api.stripe.com/v1/promotion_codes?code=${encodeURIComponent(couponCode)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const promotionCodes = await promoResponse.json();
      if (!promoResponse.ok) {
        throw new Error(promotionCodes.error?.message || 'Failed to validate promo code');
      }

      if (promotionCodes.data.length === 0 || !promotionCodes.data[0].active) {
        throw new Error('Invalid or expired promo code');
      }
      promotionCodeId = promotionCodes.data[0].id;
      discountPercent = promotionCodes.data[0].coupon.percent_off ? promotionCodes.data[0].coupon.percent_off / 100 : null;
    }

    // Only create customer and subscription if paymentMethodId is provided
    if (paymentMethodId) {
      console.log('stripe-subscribe: Creating customer for:', fetchedUser.email);
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: fetchedUser.email,
          payment_method: paymentMethodId,
          'invoice_settings[default_payment_method]': paymentMethodId,
          'metadata[userId]': userId,
        }).toString(),
      });

      const customer = await customerResponse.json();
      if (!customerResponse.ok) {
        throw new Error(customer.error?.message || 'Failed to create customer');
      }

      console.log('stripe-subscribe: Creating subscription for customer:', customer.id);
      const subscriptionResponse = await fetch('https://api.stripe.com/v1/subscriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          customer: customer.id,
          'items[0][price]': priceId,
          default_payment_method: paymentMethodId,
          payment_behavior: 'default_incomplete',
          'expand[]': 'latest_invoice.payment_intent',
          ...(promotionCodeId && { promotion_code: promotionCodeId }),
          'metadata[userId]': userId,
        }).toString(),
      });

      const subscription = await subscriptionResponse.json();
      if (!subscriptionResponse.ok) {
        throw new Error(subscription.error?.message || 'Failed to create subscription');
      }

      console.log('stripe-subscribe: Updating subscription in DB:', subscription.id);
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
          plan_id: priceId,
          status: subscription.status,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      console.log('stripe-subscribe: Success:', subscription.id);
      return new Response(JSON.stringify({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        ...(couponCode && { couponApplied: !!promotionCodeId, discountPercent }),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    } else {
      // Return only coupon validation result
      return new Response(JSON.stringify({
        couponApplied: !!promotionCodeId,
        discountPercent,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }
  } catch (err: any) {
    console.error('stripe-subscribe: Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});