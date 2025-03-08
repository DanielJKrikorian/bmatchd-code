import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno';
import { config } from 'https://deno.land/x/dotenv@v3.2.2/mod.ts';

config({ path: `${import.meta.dirname}/../.env`, export: true });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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
    const { stripe_subscription_id } = await req.json();
    if (!stripe_subscription_id) {
      return new Response(JSON.stringify({ error: 'Missing stripe_subscription_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const subscription = await stripe.subscriptions.retrieve(stripe_subscription_id);
    return new Response(JSON.stringify(subscription), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: unknown) {
    console.error('Error fetching subscription:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Failed to fetch subscription' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});