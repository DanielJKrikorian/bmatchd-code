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

console.log('Stripe Webhook Edge Function Initialized');

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text();

  try {
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );

    console.log('Received Stripe Event:', event.type);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        const userEmail = subscription.customer_email || (await stripe.customers.retrieve(subscription.customer)).email;
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('email', userEmail)
          .single();

        if (!user) {
          console.error('User not found for email:', userEmail);
          return new Response('User not found', { status: 404 });
        }

        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            stripe_customer_id: subscription.customer,
            stripe_subscription_id: subscription.id,
            plan_id: subscription.items.data[0].price.id,
            status: subscription.status,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        console.log('Subscription updated:', subscription.id);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});