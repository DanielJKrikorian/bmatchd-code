-- Create subscription plans reference table
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stripe_price_id text UNIQUE NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('essential', 'featured', 'elite')),
  billing_interval text NOT NULL CHECK (billing_interval IN ('month', 'year')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to all users"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert subscription plans
INSERT INTO subscription_plans (stripe_price_id, name, plan_type, billing_interval) VALUES
  ('price_1QjjRHAkjdPARDjPspcn7Y66', 'Essential Monthly', 'essential', 'month'),
  ('price_1QjjSUAkjdPARDjP4Pr1di5N', 'Essential Yearly', 'essential', 'year'),
  ('price_1QjjURAkjdPARDjPYhPJVCzU', 'Featured Monthly', 'featured', 'month'),
  ('price_1QjjV6AkjdPARDjPo2PNW7a4', 'Featured Yearly', 'featured', 'year'),
  ('price_1QjjX3AkjdPARDjPxu1pLYWC', 'Elite Monthly', 'elite', 'month'),
  ('price_1QjjXfAkjdPARDjPr6N4GhoY', 'Elite Yearly', 'elite', 'year');

-- Add index for faster lookups
CREATE INDEX idx_subscription_plans_price_id ON subscription_plans(stripe_price_id);