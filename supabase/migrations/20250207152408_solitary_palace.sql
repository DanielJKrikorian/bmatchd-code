-- Create seating layouts table
CREATE TABLE IF NOT EXISTS seating_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('ceremony', 'reception')),
  tables jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE seating_layouts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for couple"
  ON seating_layouts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE id = seating_layouts.couple_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Enable write access for couple"
  ON seating_layouts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE id = seating_layouts.couple_id
      AND user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_seating_layouts_couple ON seating_layouts(couple_id);
CREATE INDEX idx_seating_layouts_type ON seating_layouts(type);
CREATE INDEX idx_seating_layouts_created ON seating_layouts(created_at);

-- Add comment to document the table
COMMENT ON TABLE seating_layouts IS 'Stores seating arrangements for wedding ceremonies and receptions';