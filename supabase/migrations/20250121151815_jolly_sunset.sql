/*
  # Database Schema Reset and Setup
  
  1. Tables
    - Drop all tables in correct order
    - Recreate core tables
  
  2. Security
    - Enable RLS
    - Add basic policies
*/

-- Drop tables in correct order (handle dependencies)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS couples CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('couple', 'vendor')),
  created_at timestamptz DEFAULT now()
);

-- Create vendors table
CREATE TABLE vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  business_name text NOT NULL,
  category text NOT NULL,
  description text,
  location text NOT NULL,
  price_range text NOT NULL,
  rating numeric DEFAULT 0,
  images text[] DEFAULT '{}',
  subscription_plan text CHECK (subscription_plan IN ('essential', 'featured', 'elite', null)),
  subscription_end_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create couples table
CREATE TABLE couples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  partner1_name text NOT NULL,
  partner2_name text NOT NULL,
  wedding_date date,
  budget numeric,
  location text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) NOT NULL,
  vendor_id uuid REFERENCES vendors(id) NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) NOT NULL,
  vendor_id uuid REFERENCES vendors(id) NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can read vendor data" ON vendors FOR SELECT USING (true);
CREATE POLICY "Vendors can update own data" ON vendors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Vendors can insert own data" ON vendors FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Couples can read own data" ON couples FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Couples can update own data" ON couples FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can read their own bookings" ON bookings 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM couples WHERE id = bookings.couple_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM vendors WHERE id = bookings.vendor_id AND user_id = auth.uid())
  );

CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Couples can create reviews" ON reviews 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM couples WHERE id = couple_id AND user_id = auth.uid())
  );