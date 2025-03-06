import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*', // Allow all for now, tighten later
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers });

  const { userId, priceId, successUrl, cancelUrl } = await req.json();

  try {
    const customer = await stripe.customers.create({ metadata: { userId } });
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return new Response(JSON.stringify({ sessionId: session.id }), { status: 200, headers });
  } catch (err: any) {
    console.error('Checkout Error:', err);
    return new Response(err.message, { status: 500, headers });
  }
});