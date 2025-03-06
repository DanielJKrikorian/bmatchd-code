-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_vendor_created ON users;
DROP FUNCTION IF EXISTS handle_new_vendor();

-- Create a secure function to handle new vendor creation
CREATE OR REPLACE FUNCTION handle_new_vendor()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create vendor profile if one doesn't exist
  IF NEW.role = 'vendor' AND NOT EXISTS (
    SELECT 1 FROM vendors WHERE user_id = NEW.id
  ) THEN
    INSERT INTO vendors (
      user_id,
      business_name,
      category,
      description,
      location,
      price_range,
      rating,
      images,
      created_at
    ) VALUES (
      NEW.id,
      '',
      '',
      '',
      '',
      'Premium',
      0,
      '{}',
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for vendor creation
CREATE TRIGGER on_vendor_created
  AFTER INSERT OR UPDATE ON users
  FOR EACH ROW
  WHEN (NEW.role = 'vendor')
  EXECUTE FUNCTION handle_new_vendor();

-- Ensure vendor role is allowed
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check,
ADD CONSTRAINT users_role_check 
CHECK (role IN ('couple', 'vendor', 'admin'));

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;