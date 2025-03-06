-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a simplified function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users with role from metadata
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'couple')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create separate function for vendor profile creation
CREATE OR REPLACE FUNCTION create_vendor_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'vendor' THEN
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

-- Create trigger for vendor profile creation
CREATE TRIGGER on_vendor_role_assigned
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW
  WHEN (NEW.role = 'vendor')
  EXECUTE FUNCTION create_vendor_profile();

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
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "allow_read_users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_read_vendors"
  ON public.vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_vendor_write"
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