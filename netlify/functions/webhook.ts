import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe('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', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  'https://rgzynxmllathqtaxhoii.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnenlueG1sbGF0aHF0YXhob2lpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzY0MDg3MCwiZXhwIjoyMDUzMjE2ODcwfQ.zmN6QRrH72d64mZSbiMY3c031wwKjPqmn9JTPn1_maQ'
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Stripe-Signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const handler: Handler = async (event) => {
  try {
    const sig = event.headers['stripe-signature'];
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing Stripe signature or webhook secret' })
      };
    }

    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body!,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Webhook signature verification failed' })
      };
    }

    console.log("✅ Webhook received:", stripeEvent.type);

    // Handle different Stripe event types
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        const { userId } = session.metadata || {};

        if (!userId) {
          throw new Error('No user ID in session metadata');
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0].price.id;

        // Get plan details from subscription_plans table
        const { data: planData, error: planError } = await supabase
          .from('subscription_plans')
          .select('plan_type, billing_interval')
          .eq('stripe_price_id', priceId)
          .single();

        if (planError) throw planError;

        // Update vendor subscription
        const { error: updateError } = await supabase
          .from('vendors')
          .update({ 
            subscription_plan: planData.plan_type,
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const { userId } = subscription.metadata || {};

        if (!userId) break;

        // Update vendor subscription
        const { error: updateError } = await supabase
          .from('vendors')
          .update({ 
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const { userId } = subscription.metadata || {};

        if (!userId) break;

        // Remove vendor subscription
        const { error: updateError } = await supabase
          .from('vendors')
          .update({ 
            subscription_plan: null,
            subscription_end_date: null
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;

        break;
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ received: true })
    };
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Webhook handler failed',
        details: error.message
      })
    };
  }
};

export { handler };