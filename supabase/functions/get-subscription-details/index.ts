import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@15.12.0?target=deno&no-check";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-04-10",
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { headers: corsHeaders, status: 405 });
  }

  try {
    const textBody = await req.text();
    console.log("Received request body:", textBody);

    if (!textBody || textBody.trim() === "") {
      return new Response(JSON.stringify({ error: "Empty request body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const body = JSON.parse(textBody);
    const { stripe_subscription_id } = body;

    if (!stripe_subscription_id) {
      return new Response(JSON.stringify({ error: "Missing stripe_subscription_id" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const subscription = await stripe.subscriptions.retrieve(stripe_subscription_id);

    const response = {
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      pending_update: subscription.pending_update || null,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("get-subscription-details: Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});