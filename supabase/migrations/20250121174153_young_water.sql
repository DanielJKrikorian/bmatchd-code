/*
  # Add saved vendors functionality

  1. New Tables
    - `saved_vendors`
      - `id` (uuid, primary key)
      - `couple_id` (uuid, references users)
      - `vendor_id` (uuid, references vendors)
      - `notes` (text, optional)
      - `saved_at` (timestamp)

  2. Security
    - Enable RLS on `saved_vendors` table
    - Add policies for couples to manage their saved vendors
*/

-- Create saved_vendors table
CREATE TABLE saved_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES users(id) NOT NULL,
  vendor_id uuid REFERENCES vendors(id) NOT NULL,
  notes text,
  saved_at timestamptz DEFAULT now(),
  UNIQUE(couple_id, vendor_id)
);

-- Enable RLS
ALTER TABLE saved_vendors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Couples can manage their saved vendors"
  ON saved_vendors
  FOR ALL
  TO authenticated
  USING (auth.uid() = couple_id)
  WITH CHECK (auth.uid() = couple_id);