-- Create vendor referrals table
CREATE TABLE IF NOT EXISTS vendor_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  referred_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(referrer_id, referred_id)
);

-- Enable RLS
ALTER TABLE vendor_referrals ENABLE ROW LEVEL SECURITY;

-- Create policy for vendor referrals
CREATE POLICY "enable_referral_access"
  ON vendor_referrals
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = referrer_id OR
    auth.uid() = referred_id
  );

-- Create function to handle referral completion
CREATE OR REPLACE FUNCTION handle_referral_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- If vendor subscribes, mark their referral as completed
  IF NEW.subscription_plan IS NOT NULL AND OLD.subscription_plan IS NULL THEN
    UPDATE vendor_referrals
    SET 
      status = 'completed',
      completed_at = now()
    WHERE 
      referred_id = NEW.user_id
      AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for referral completion
CREATE TRIGGER on_vendor_subscription
  AFTER UPDATE OF subscription_plan ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION handle_referral_completion();

-- Create function to check referral rewards
CREATE OR REPLACE FUNCTION check_referral_rewards(vendor_id uuid)
RETURNS TABLE (
  completed_referrals bigint,
  rewards_earned bigint
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH referral_stats AS (
    SELECT 
      COUNT(*) as completed,
      FLOOR(COUNT(*) / 3) as rewards
    FROM vendor_referrals
    WHERE referrer_id = vendor_id
    AND status = 'completed'
  )
  SELECT 
    completed as completed_referrals,
    rewards as rewards_earned
  FROM referral_stats;
$$;

-- Grant necessary permissions
GRANT ALL ON vendor_referrals TO authenticated;
GRANT EXECUTE ON FUNCTION check_referral_rewards TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_referrals_referrer ON vendor_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_vendor_referrals_referred ON vendor_referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_vendor_referrals_status ON vendor_referrals(status);