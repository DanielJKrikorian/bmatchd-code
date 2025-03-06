-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('essential', 'featured', 'elite')),
  billing_interval text NOT NULL CHECK (billing_interval IN ('month', 'year')),
  status text NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for vendor"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE id = subscriptions.vendor_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Enable admin read access"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create function to update subscription status
CREATE OR REPLACE FUNCTION update_vendor_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Update vendor subscription details
  UPDATE vendors
  SET 
    subscription_plan = NEW.plan_type,
    subscription_end_date = NEW.current_period_end
  WHERE id = NEW.vendor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for subscription updates
CREATE TRIGGER on_subscription_update
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_subscription();

-- Create indexes for better performance
CREATE INDEX idx_subscriptions_vendor ON subscriptions(vendor_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX idx_subscriptions_stripe_ids ON subscriptions(stripe_subscription_id, stripe_customer_id);

-- Add comments
COMMENT ON TABLE subscriptions IS 'Tracks vendor subscriptions with Stripe integration';
COMMENT ON COLUMN subscriptions.plan_type IS 'Subscription plan level (essential, featured, elite)';
COMMENT ON COLUMN subscriptions.billing_interval IS 'Billing frequency (month, year)';
COMMENT ON COLUMN subscriptions.status IS 'Current subscription status';
COMMENT ON COLUMN subscriptions.current_period_end IS 'End date of current billing period';