-- Add stripe_customer_id to vendors table
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_vendors_stripe_customer 
ON vendors(stripe_customer_id);

-- Add comment to document the column
COMMENT ON COLUMN vendors.stripe_customer_id IS 'Stripe customer ID for subscription management';