import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { buffer } from 'micro';

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("❌ STRIPE_SECRET_KEY is missing in environment variables.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const config = { api: { bodyParser: false } }; // Required for Stripe webhooks

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const handler: Handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Success' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405, // Method Not Allowed
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  // Validate webhook signature
  const sig = event.headers['stripe-signature'];
  if (!sig) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing Stripe Signature' }),
    };
  }

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      await buffer(event),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error("❌ Stripe webhook signature verification failed:", error.message);
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Webhook signature verification failed' }),
    };
  }

  console.log("✅ Webhook received:", stripeEvent.type);

  // Handle different Stripe event types
  switch (stripeEvent.type) {
    case 'checkout.session.completed':
      console.log("🎉 Checkout session completed:", stripeEvent.data.object);
      // TODO: Update user subscription status in database
      break;

    case 'invoice.payment_succeeded':
      console.log("💰 Subscription payment succeeded:", stripeEvent.data.object);
      // TODO: Mark user as paid
      break;

    case 'customer.subscription.created':
      console.log("📅 New Subscription Created:", stripeEvent.data.object);
      // TODO: Store subscription details in database
      break;

    case 'customer.subscription.deleted':
      console.log("⚠️ Subscription Cancelled:", stripeEvent.data.object);
      // TODO: Mark user as unsubscribed
      break;

    default:
      console.log(`⚠️ Unhandled event type: ${stripeEvent.type}`);
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ received: true }),
  };
};

export { handler };
