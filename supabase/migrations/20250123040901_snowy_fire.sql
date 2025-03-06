-- Drop existing problematic triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP TRIGGER IF EXISTS on_vendor_created ON users;
DROP FUNCTION IF EXISTS handle_new_vendor();

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for vendors" ON public.vendors;
DROP POLICY IF EXISTS "Enable vendor self-management" ON public.vendors;

-- Create a single, reliable function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role text;
BEGIN
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::text, 'couple');

  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, user_role)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      role = EXCLUDED.role;

  IF user_role = 'vendor' THEN
    INSERT INTO vendors (
      user_id,
      business_name,
      category,
      description,
      location,
      price_range,
      rating,
      images
    ) VALUES (
      NEW.id,
      '',
      '',
      '',
      '',
      'Premium',
      0,
      '{}'::text[]
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure tables exist with proper constraints
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('couple', 'vendor', 'admin')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES public.users(id),
  business_name text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  price_range text NOT NULL DEFAULT 'Premium',
  rating numeric NOT NULL DEFAULT 0,
  images text[] DEFAULT '{}'::text[],
  subscription_plan text CHECK (subscription_plan IN ('essential', 'featured', 'elite', null)),
  subscription_end_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Create basic policies with new names to avoid conflicts
CREATE POLICY "users_read_policy"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "vendors_read_policy"
  ON public.vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "vendors_write_policy"
  ON public.vendors
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;