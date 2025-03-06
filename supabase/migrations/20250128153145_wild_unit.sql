-- Update subscription plans with new price IDs
UPDATE subscription_plans 
SET stripe_price_id = 'price_1Qm0j3AkjdPARDjPzuQeCIMv'
WHERE plan_type = 'essential' AND billing_interval = 'month';

UPDATE subscription_plans 
SET stripe_price_id = 'price_1Qm0j0AkjdPARDjPTefXNs7O'
WHERE plan_type = 'essential' AND billing_interval = 'year';

UPDATE subscription_plans 
SET stripe_price_id = 'price_1Qm0iyAkjdPARDjPwP6t2XOA'
WHERE plan_type = 'featured' AND billing_interval = 'month';

UPDATE subscription_plans 
SET stripe_price_id = 'price_1Qm0ivAkjdPARDjPZmvd6zCy'
WHERE plan_type = 'featured' AND billing_interval = 'year';

UPDATE subscription_plans 
SET stripe_price_id = 'price_1Qm0itAkjdPARDjP5L87NBDb'
WHERE plan_type = 'elite' AND billing_interval = 'month';

UPDATE subscription_plans 
SET stripe_price_id = 'price_1Qm0ipAkjdPARDjPF78SLb2j'
WHERE plan_type = 'elite' AND billing_interval = 'year';

-- Add comment to document the update
COMMENT ON TABLE subscription_plans IS 'Updated price IDs on 2024-01-28';