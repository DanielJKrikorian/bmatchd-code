-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_vendor_role_assigned ON users;

-- Drop existing functions
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS handle_vendor_role();

-- Create or update tables
DO $$ 
BEGIN
    -- Create users table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        CREATE TABLE public.users (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            email text UNIQUE NOT NULL,
            role text NOT NULL CHECK (role IN ('couple', 'vendor', 'admin')),
            created_at timestamptz DEFAULT now()
        );
    END IF;

    -- Create vendors table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vendors') THEN
        CREATE TABLE public.vendors (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id uuid REFERENCES public.users(id) NOT NULL UNIQUE,
            business_name text NOT NULL DEFAULT '',
            category text NOT NULL DEFAULT '',
            description text NOT NULL DEFAULT '',
            location text NOT NULL DEFAULT '',
            price_range text NOT NULL DEFAULT 'Premium',
            rating numeric NOT NULL DEFAULT 0,
            images text[] DEFAULT '{}',
            website_url text,
            facebook_url text,
            instagram_url text,
            tiktok_url text,
            youtube_url text,
            subscription_plan text CHECK (subscription_plan IN ('essential', 'featured', 'elite', null)),
            subscription_end_date timestamptz,
            created_at timestamptz DEFAULT now()
        );
    END IF;

    -- Create couples table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'couples') THEN
        CREATE TABLE public.couples (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id uuid REFERENCES public.users(id) NOT NULL UNIQUE,
            partner1_name text NOT NULL,
            partner2_name text NOT NULL,
            wedding_date date,
            budget numeric,
            location text NOT NULL,
            created_at timestamptz DEFAULT now()
        );
    END IF;

    -- Create cities table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cities') THEN
        CREATE TABLE public.cities (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            name text NOT NULL,
            state text NOT NULL,
            country text NOT NULL DEFAULT 'USA',
            created_at timestamptz DEFAULT now(),
            UNIQUE(name, state, country)
        );
    END IF;

    -- Create vendor_service_areas table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vendor_service_areas') THEN
        CREATE TABLE public.vendor_service_areas (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
            city_id uuid REFERENCES cities(id) ON DELETE CASCADE,
            created_at timestamptz DEFAULT now(),
            UNIQUE(vendor_id, city_id)
        );
    END IF;

    -- Create saved_vendors table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'saved_vendors') THEN
        CREATE TABLE public.saved_vendors (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            couple_id uuid REFERENCES couples(id) ON DELETE CASCADE,
            vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
            notes text,
            saved_at timestamptz DEFAULT now(),
            UNIQUE(couple_id, vendor_id)
        );
    END IF;

    -- Create reviews table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
        CREATE TABLE public.reviews (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            couple_id uuid REFERENCES couples(id) ON DELETE CASCADE,
            vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
            rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
            content text NOT NULL,
            response text,
            response_date timestamptz,
            created_at timestamptz DEFAULT now()
        );
    END IF;

    -- Create messages table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
        CREATE TABLE public.messages (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
            receiver_id uuid REFERENCES users(id) ON DELETE CASCADE,
            content text NOT NULL,
            status text CHECK (status IN ('pending', 'accepted', 'declined', 'closed')) DEFAULT 'pending',
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
        );
    END IF;

    -- Create appointments table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'appointments') THEN
        CREATE TABLE public.appointments (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
            couple_id uuid REFERENCES couples(id) ON DELETE CASCADE,
            title text NOT NULL,
            description text,
            start_time timestamptz NOT NULL,
            end_time timestamptz NOT NULL,
            status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now(),
            CONSTRAINT valid_time_range CHECK (end_time > start_time)
        );
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating them
DO $$ 
BEGIN
    -- Drop policies for users table
    DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON users;
    
    -- Drop policies for vendors table
    DROP POLICY IF EXISTS "Enable read access for all users" ON vendors;
    DROP POLICY IF EXISTS "Enable write access for vendor owners" ON vendors;
    
    -- Drop policies for couples table
    DROP POLICY IF EXISTS "Enable read access for couple owners" ON couples;
    DROP POLICY IF EXISTS "Enable write access for couple owners" ON couples;
    
    -- Drop policies for cities table
    DROP POLICY IF EXISTS "Enable read access for all users" ON cities;
    
    -- Drop policies for vendor service areas
    DROP POLICY IF EXISTS "Enable read access for all users" ON vendor_service_areas;
    DROP POLICY IF EXISTS "Enable write access for vendor owners" ON vendor_service_areas;
    
    -- Drop policies for saved vendors
    DROP POLICY IF EXISTS "Enable read access for couple owners" ON saved_vendors;
    DROP POLICY IF EXISTS "Enable write access for couple owners" ON saved_vendors;
    
    -- Drop policies for reviews
    DROP POLICY IF EXISTS "Enable read access for all users" ON reviews;
    DROP POLICY IF EXISTS "Enable write access for couple owners" ON reviews;
    DROP POLICY IF EXISTS "Enable response update for vendor owners" ON reviews;
    
    -- Drop policies for messages
    DROP POLICY IF EXISTS "Enable read access for conversation participants" ON messages;
    DROP POLICY IF EXISTS "Enable write access for sender" ON messages;
    DROP POLICY IF EXISTS "Enable update access for participants" ON messages;
    
    -- Drop policies for appointments
    DROP POLICY IF EXISTS "Enable read access for participants" ON appointments;
    DROP POLICY IF EXISTS "Enable write access for participants" ON appointments;
END $$;

-- Create new policies
-- Users table policies
CREATE POLICY "Enable read access for all authenticated users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Vendors table policies
CREATE POLICY "Enable read access for all users"
  ON vendors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable write access for vendor owners"
  ON vendors FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Couples table policies
CREATE POLICY "Enable read access for couple owners"
  ON couples FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Enable write access for couple owners"
  ON couples FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Cities table policies
CREATE POLICY "Enable read access for all users"
  ON cities FOR SELECT
  USING (true);

-- Vendor service areas policies
CREATE POLICY "Enable read access for all users"
  ON vendor_service_areas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable write access for vendor owners"
  ON vendor_service_areas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE id = vendor_service_areas.vendor_id
      AND user_id = auth.uid()
    )
  );

-- Saved vendors policies
CREATE POLICY "Enable read access for couple owners"
  ON saved_vendors FOR SELECT
  TO authenticated
  USING (
    couple_id IN (
      SELECT id FROM couples
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Enable write access for couple owners"
  ON saved_vendors FOR ALL
  TO authenticated
  USING (
    couple_id IN (
      SELECT id FROM couples
      WHERE user_id = auth.uid()
    )
  );

-- Reviews policies
CREATE POLICY "Enable read access for all users"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable write access for couple owners"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    couple_id IN (
      SELECT id FROM couples
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Enable response update for vendor owners"
  ON reviews FOR UPDATE
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendors
      WHERE user_id = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY "Enable read access for conversation participants"
  ON messages FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id OR
    auth.uid() = receiver_id
  );

CREATE POLICY "Enable write access for sender"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Enable update access for participants"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = sender_id OR
    auth.uid() = receiver_id
  );

-- Appointments policies
CREATE POLICY "Enable read access for participants"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()) OR
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );

CREATE POLICY "Enable write access for participants"
  ON appointments FOR ALL
  TO authenticated
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()) OR
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'couple')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create function to handle vendor profile creation
CREATE OR REPLACE FUNCTION handle_vendor_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'vendor' AND NOT EXISTS (
    SELECT 1 FROM vendors WHERE user_id = NEW.id
  ) THEN
    INSERT INTO vendors (user_id)
    VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for vendor profile creation
CREATE TRIGGER on_vendor_role_assigned
  AFTER INSERT OR UPDATE ON users
  FOR EACH ROW
  WHEN (NEW.role = 'vendor')
  EXECUTE FUNCTION handle_vendor_role();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;