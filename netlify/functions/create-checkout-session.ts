import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe('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', {
  apiVersion: '2023-10-16',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Stripe-Signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const handler: Handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Success' })
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Validate request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    const { priceId, userId, email } = requestData;
    
    // Validate required fields
    if (!priceId || !userId || !email) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          details: {
            priceId: !priceId,
            userId: !userId,
            email: !email
          }
        })
      };
    }

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${event.headers.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${event.headers.origin}/subscription`,
      metadata: { userId },
      billing_address_collection: 'required',
      customer_update: { address: 'auto' },
      payment_method_collection: 'always',
      subscription_data: { metadata: { userId } },
      allow_promotion_codes: true,
    });

    if (!session?.url) {
      throw new Error('No session URL returned from Stripe');
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url
      })
    };
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to create subscription',
        details: error.message
      })
    };
  }
};

export { handler };