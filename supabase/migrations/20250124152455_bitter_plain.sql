-- Update the essential monthly plan price ID
UPDATE subscription_plans 
SET stripe_price_id = 'price_1QkEtxAkjdPARDjPWEOOGAon'
WHERE plan_type = 'essential' 
AND billing_interval = 'month';

-- Add comment to document the change
COMMENT ON TABLE subscription_plans IS 'Updated essential monthly plan price ID on 2024-01-24';