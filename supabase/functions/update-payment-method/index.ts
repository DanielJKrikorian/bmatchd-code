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
    const { action, customer_id, payment_method_id } = body;

    if (!action || !customer_id || typeof customer_id !== "string") {
      return new Response(JSON.stringify({ error: "Invalid or missing action/customer_id" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (action === "create_setup_intent") {
      const setupIntent = await stripe.setupIntents.create({
        customer: customer_id,
      });
      return new Response(JSON.stringify({ client_secret: setupIntent.client_secret }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "update_payment_method") {
      if (!payment_method_id || typeof payment_method_id !== "string") {
        return new Response(JSON.stringify({ error: "Invalid or missing payment_method_id" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      await stripe.customers.update(customer_id, {
        invoice_settings: { default_payment_method: payment_method_id },
      });
      return new Response(JSON.stringify({ message: "Payment method updated successfully" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (error) {
    console.error("update-payment-method: Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});