import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@14.0.0?deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  const baseResponse = {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  };

  console.log('Received request:', {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
  });

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const contentLength = req.headers.get('content-length');
    const contentType = req.headers.get('content-type');
    console.log('Request validation:', {
      contentLength,
      contentType,
    });

    // Relaxed validation: Allow empty body if content-type is set
    if (contentLength && parseInt(contentLength) === 0 && (!contentType || !contentType.includes('application/json'))) {
      console.log('Validation failed: Empty body with invalid or missing Content-Type');
      return new Response(
        JSON.stringify({ error: 'Content-Type must be application/json with a valid body' }),
        { ...baseResponse, status: 400 }
      );
    }

    // Log the raw body for debugging
    const rawBody = await req.text();
    console.log('Raw request body:', rawBody);

    let body;
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
      console.log('Parsed request body:', body);
    } catch (error) {
      console.error('Failed to parse JSON body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { ...baseResponse, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    );

    console.log('Fetching authenticated user');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('User not authenticated');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { ...baseResponse, status: 401 }
      );
    }

    console.log('Fetching vendor for user:', user.id);
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!vendor) {
      console.log('Vendor not found for user:', user.id);
      return new Response(
        JSON.stringify({ error: 'Vendor not found' }),
        { ...baseResponse, status: 404 }
      );
    }

    console.log('Initializing Stripe client');
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-04-10',
    });

    console.log('Generating coupon code');
    const couponCode = `COUPON-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    console.log('Creating Stripe coupon');
    const stripeCoupon = await stripe.coupons.create({
      percent_off: 10,
      duration: 'repeating',
      duration_in_months: 3,
      name: couponCode,
    });

    console.log('Saving coupon to vendor_coupons:', {
      vendor_id: vendor.id,
      coupon_code: couponCode,
      stripe_coupon_id: stripeCoupon.id,
    });
    const { error: insertError } = await supabase
      .from('vendor_coupons')
      .insert({
        vendor_id: vendor.id,
        coupon_code: couponCode,
        stripe_coupon_id: stripeCoupon.id,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Failed to save coupon:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save coupon' }),
        { ...baseResponse, status: 500 }
      );
    }

    console.log('Coupon generated successfully:', { couponCode, stripeCouponId: stripeCoupon.id });
    return new Response(
      JSON.stringify({ couponCode, stripeCouponId: stripeCoupon.id }),
      { ...baseResponse, status: 200 }
    );
  } catch (error) {
    console.error('Error in generate-coupon:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { ...baseResponse, status: 500 }
    );
  }
});