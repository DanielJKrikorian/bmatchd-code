/*
  # Fix Database Schema
  
  1. Tables
    - Create core tables if they don't exist
    - Add subscription fields to vendors table
  
  2. Security
    - Enable RLS
    - Add policies with existence checks
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('couple', 'vendor')),
  created_at timestamptz DEFAULT now()
);

-- Create vendors table if it doesn't exist
CREATE TABLE IF NOT EXISTS vendors (
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

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Create policies with existence checks
DO $$ 
BEGIN
    -- Users policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can read own data'
    ) THEN
        CREATE POLICY "Users can read own data"
          ON users
          FOR SELECT
          TO authenticated
          USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can update own data'
    ) THEN
        CREATE POLICY "Users can update own data"
          ON users
          FOR UPDATE
          TO authenticated
          USING (auth.uid() = id);
    END IF;

    -- Vendors policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'vendors' 
        AND policyname = 'Anyone can read vendor data'
    ) THEN
        CREATE POLICY "Anyone can read vendor data"
          ON vendors
          FOR SELECT
          TO authenticated
          USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'vendors' 
        AND policyname = 'Vendors can update own data'
    ) THEN
        CREATE POLICY "Vendors can update own data"
          ON vendors
          FOR UPDATE
          TO authenticated
          USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'vendors' 
        AND policyname = 'Vendors can insert own data'
    ) THEN
        CREATE POLICY "Vendors can insert own data"
          ON vendors
          FOR INSERT
          TO authenticated
          WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;