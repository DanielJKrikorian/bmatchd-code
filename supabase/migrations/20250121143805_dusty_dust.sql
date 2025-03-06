/*
  # Initial Schema for Wedding Marketplace

  1. New Tables
    - users
      - id (uuid, primary key)
      - email (text, unique)
      - role (text)
      - created_at (timestamptz)
    
    - couples
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - partner1_name (text)
      - partner2_name (text)
      - wedding_date (date)
      - budget (numeric)
      - location (text)
      - created_at (timestamptz)
    
    - vendors
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - business_name (text)
      - category (text)
      - description (text)
      - location (text)
      - price_range (text)
      - rating (numeric)
      - images (text[])
      - created_at (timestamptz)
    
    - bookings
      - id (uuid, primary key)
      - couple_id (uuid, foreign key)
      - vendor_id (uuid, foreign key)
      - status (text)
      - date (date)
      - notes (text)
      - created_at (timestamptz)
    
    - messages
      - id (uuid, primary key)
      - sender_id (uuid, foreign key)
      - receiver_id (uuid, foreign key)
      - content (text)
      - created_at (timestamptz)
    
    - reviews
      - id (uuid, primary key)
      - couple_id (uuid, foreign key)
      - vendor_id (uuid, foreign key)
      - rating (integer)
      - content (text)
      - created_at (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('couple', 'vendor')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Couples table
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

ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couples can read own data"
  ON couples
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Vendors table
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
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vendor data"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can update own data"
  ON vendors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Bookings table
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) NOT NULL,
  vendor_id uuid REFERENCES vendors(id) NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples WHERE id = bookings.couple_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM vendors WHERE id = bookings.vendor_id AND user_id = auth.uid()
    )
  );

-- Messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id) NOT NULL,
  receiver_id uuid REFERENCES users(id) NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id OR
    auth.uid() = receiver_id
  );

-- Reviews table
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) NOT NULL,
  vendor_id uuid REFERENCES vendors(id) NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Couples can create reviews"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples WHERE id = couple_id AND user_id = auth.uid()
    )
  );