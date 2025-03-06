-- Create wedding expenses table
CREATE TABLE IF NOT EXISTS wedding_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE wedding_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for couple"
  ON wedding_expenses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE id = wedding_expenses.couple_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Enable write access for couple"
  ON wedding_expenses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE id = wedding_expenses.couple_id
      AND user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_wedding_expenses_couple ON wedding_expenses(couple_id);
CREATE INDEX idx_wedding_expenses_vendor ON wedding_expenses(vendor_id);
CREATE INDEX idx_wedding_expenses_category ON wedding_expenses(category);
CREATE INDEX idx_wedding_expenses_created ON wedding_expenses(created_at);

-- Add comment to document the table
COMMENT ON TABLE wedding_expenses IS 'Stores wedding expenses for couples with vendor relationships';