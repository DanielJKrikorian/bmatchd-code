-- Re-enable vendor role in users table
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check,
ADD CONSTRAINT users_role_check 
CHECK (role IN ('couple', 'vendor', 'admin'));

-- Create trigger function for new vendor creation
CREATE OR REPLACE FUNCTION handle_new_vendor()
RETURNS TRIGGER AS $$
BEGIN
  -- Create vendor profile if one doesn't exist
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
      E'\\$\\$\\$\\$',
      0,
      '{}',
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for vendor creation
DROP TRIGGER IF EXISTS on_vendor_created ON users;
CREATE TRIGGER on_vendor_created
  AFTER INSERT OR UPDATE ON users
  FOR EACH ROW
  WHEN (NEW.role = 'vendor')
  EXECUTE FUNCTION handle_new_vendor();