import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno';

// Import Supabase client directly
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Adjust to your domain in production
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-04-10',
});

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { headers: corsHeaders, status: 405 });
  }

  try {
    const body = await req.json();
    console.log('Received request:', body);

    const { subscription_id, new_plan_id } = body;

    if (!subscription_id || !new_plan_id) {
      return new Response(JSON.stringify({ error: 'Missing subscription_id or new_plan_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('Stripe secret key:', Deno.env.get('STRIPE_SECRET_KEY')?.slice(0, 4));

    // Verify the subscription exists
    const existingSubscription = await stripe.subscriptions.retrieve(subscription_id);
    console.log('Existing subscription retrieved:', existingSubscription.id);

    // Update the Stripe subscription
    const subscription = await stripe.subscriptions.update(subscription_id, {
      cancel_at_period_end: false,
      proration_behavior: 'create_prorations',
      items: [{ id: existingSubscription.items.data[0].id, plan: new_plan_id }],
    });
    console.log('Subscription updated:', subscription.id);

    // Initialize Supabase client with environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://rtzrhxxdqmnpydskixso.supabase.co';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0enJoeHhkcW1ucHlkc2tpeHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODI2NzA3MywiZXhwIjoyMDUzODQzMDczfQ.0DfkLrBnehL1O3RvfxsYMpjC69rTszOfuiuMKFUKiq0';
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Update Supabase subscriptions table
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({ plan_id: new_plan_id })
      .eq('stripe_subscription_id', subscription_id);

    if (subError) throw new Error(`Failed to update subscriptions table: ${subError.message}`);

    // Update vendors table
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription_id)
      .single();
    const { error: vendorError } = await supabase
      .from('vendors')
      .update({ subscription_plan: new_plan_id })
      .eq('user_id', subData.user_id);

    if (vendorError) throw new Error(`Failed to update vendors table: ${vendorError.message}`);

    return new Response(JSON.stringify({ message: 'Subscription plan updated successfully', subscription }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: unknown) {
    console.error('update-subscription-plan: Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Failed to update subscription plan' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});