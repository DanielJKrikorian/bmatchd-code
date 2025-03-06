-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS vendor_service_areas CASCADE;
DROP TABLE IF EXISTS saved_vendors CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS couples CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS cities CASCADE;

-- Create base tables
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('couple', 'vendor', 'admin')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE vendors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
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

CREATE TABLE couples (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  partner1_name text NOT NULL,
  partner2_name text NOT NULL,
  wedding_date date,
  budget numeric,
  location text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE cities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  state text NOT NULL,
  country text NOT NULL DEFAULT 'USA',
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, state, country)
);

CREATE TABLE vendor_service_areas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  city_id uuid REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id, city_id)
);

CREATE TABLE saved_vendors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  notes text,
  saved_at timestamptz DEFAULT now(),
  UNIQUE(couple_id, vendor_id)
);

CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text NOT NULL,
  response text,
  response_date timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  status text CHECK (status IN ('pending', 'accepted', 'declined', 'closed')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create indexes for better performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_category ON vendors(category);
CREATE INDEX idx_vendors_subscription_plan ON vendors(subscription_plan);
CREATE INDEX idx_couples_user_id ON couples(user_id);
CREATE INDEX idx_couples_wedding_date ON couples(wedding_date);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_appointments_vendor_id ON appointments(vendor_id);
CREATE INDEX idx_appointments_couple_id ON appointments(couple_id);
CREATE INDEX idx_reviews_vendor_id ON reviews(vendor_id);
CREATE INDEX idx_reviews_couple_id ON reviews(couple_id);
CREATE INDEX idx_saved_vendors_couple_id ON saved_vendors(couple_id);
CREATE INDEX idx_saved_vendors_vendor_id ON saved_vendors(vendor_id);
CREATE INDEX idx_service_areas_vendor_id ON vendor_service_areas(vendor_id);
CREATE INDEX idx_service_areas_city_id ON vendor_service_areas(city_id);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create simplified RLS policies
-- Users table
CREATE POLICY "read_users" ON users FOR SELECT USING (true);

-- Vendors table
CREATE POLICY "read_vendors" ON vendors FOR SELECT USING (true);
CREATE POLICY "write_vendors" ON vendors FOR ALL TO authenticated USING (user_id = auth.uid());

-- Couples table
CREATE POLICY "read_couples" ON couples FOR SELECT USING (true);
CREATE POLICY "write_couples" ON couples FOR ALL TO authenticated USING (user_id = auth.uid());

-- Cities table
CREATE POLICY "read_cities" ON cities FOR SELECT USING (true);

-- Messages table
CREATE POLICY "access_messages" ON messages FOR ALL TO authenticated 
USING (auth.uid() IN (sender_id, receiver_id));

-- Reviews table
CREATE POLICY "read_reviews" ON reviews FOR SELECT USING (true);

-- Saved vendors table
CREATE POLICY "access_saved_vendors" ON saved_vendors FOR ALL TO authenticated 
USING (auth.uid() IN (SELECT user_id FROM couples WHERE id = couple_id));

-- Appointments table
CREATE POLICY "access_appointments" ON appointments FOR ALL TO authenticated 
USING (auth.uid() IN (
  SELECT user_id FROM vendors WHERE id = vendor_id
  UNION
  SELECT user_id FROM couples WHERE id = couple_id
));

-- Service areas table
CREATE POLICY "read_service_areas" ON vendor_service_areas FOR SELECT USING (true);
CREATE POLICY "write_service_areas" ON vendor_service_areas FOR ALL TO authenticated 
USING (auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id));

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;