import { Handler, schedule } from "@netlify/functions";
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("❌ STRIPE_SECRET_KEY is missing from environment variables.");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("❌ SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Run every day at midnight
const handler: Handler = schedule("@daily", async (event) => {
  console.log("🔄 Starting subscription verification...");
  
  try {
    // Get all vendors with subscriptions
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, user_id, subscription_plan, subscription_end_date')
      .not('subscription_plan', 'is', null);

    if (vendorsError) throw vendorsError;

    console.log(`📊 Found ${vendors?.length || 0} vendors with subscriptions`);

    // Process each vendor
    for (const vendor of vendors || []) {
      try {
        // Get subscription from Stripe
        const subscriptions = await stripe.subscriptions.list({
          customer: vendor.user_id,
          status: 'active',
          limit: 1
        });

        if (subscriptions.data.length === 0) {
          console.log(`❌ No active subscription found for vendor ${vendor.id}`);
          
          // Remove subscription if no active subscription found
          const { error: updateError } = await supabase
            .from('vendors')
            .update({
              subscription_plan: null,
              subscription_end_date: null
            })
            .eq('id', vendor.id);

          if (updateError) throw updateError;
          
          continue;
        }

        const subscription = subscriptions.data[0];
        
        // Get plan details
        const { data: planData } = await supabase
          .from('subscription_plans')
          .select('plan_type')
          .eq('stripe_price_id', subscription.items.data[0].price.id)
          .single();

        if (!planData) {
          console.error(`❌ No matching plan found for price ${subscription.items.data[0].price.id}`);
          continue;
        }

        // Update vendor subscription details
        const { error: updateError } = await supabase
          .from('vendors')
          .update({
            subscription_plan: planData.plan_type,
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
          })
          .eq('id', vendor.id);

        if (updateError) throw updateError;

        console.log(`✅ Updated subscription for vendor ${vendor.id}`);
      } catch (error) {
        console.error(`❌ Error processing vendor ${vendor.id}:`, error);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Subscription verification completed',
        vendorsProcessed: vendors?.length || 0
      })
    };
  } catch (error) {
    console.error('❌ Error verifying subscriptions:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to verify subscriptions' })
    };
  }
});

export { handler };