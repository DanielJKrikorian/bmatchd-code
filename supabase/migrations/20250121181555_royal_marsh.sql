/*
  # Add appointments management

  1. New Tables
    - `appointments`
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, references vendors)
      - `couple_id` (uuid, references couples)
      - `title` (text)
      - `description` (text)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `status` (text: pending, confirmed, cancelled)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on appointments table
    - Add policies for vendors and couples to manage their appointments
*/

CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendors(id) NOT NULL,
  couple_id uuid REFERENCES couples(id) NOT NULL,
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Vendors can view their appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE id = appointments.vendor_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Couples can view their appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE id = appointments.couple_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can manage appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE id = appointments.vendor_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendors
      WHERE id = appointments.vendor_id
      AND user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();