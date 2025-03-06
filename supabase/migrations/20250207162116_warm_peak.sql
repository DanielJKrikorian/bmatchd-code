-- Create wedding guests table
CREATE TABLE IF NOT EXISTS wedding_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  rsvp_status text NOT NULL CHECK (rsvp_status IN ('pending', 'attending', 'declined')) DEFAULT 'pending',
  meal_preference text CHECK (meal_preference IN ('standard', 'vegetarian', 'vegan')),
  dietary_restrictions text,
  song_request text,
  plus_one boolean DEFAULT false,
  plus_one_name text,
  plus_one_meal text CHECK (plus_one_meal IN ('standard', 'vegetarian', 'vegan')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE wedding_guests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for couple"
  ON wedding_guests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE id = wedding_guests.couple_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Enable write access for couple"
  ON wedding_guests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE id = wedding_guests.couple_id
      AND user_id = auth.uid()
    )
  );

-- Add song requests toggle and meal options to couples table
ALTER TABLE couples
ADD COLUMN IF NOT EXISTS allow_song_requests boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS meal_options jsonb DEFAULT jsonb_build_object(
  'standard_name', 'Standard',
  'standard_description', 'A traditional plated dinner',
  'vegetarian_name', 'Vegetarian',
  'vegetarian_description', 'A plant-based meal with dairy',
  'vegan_name', 'Vegan',
  'vegan_description', 'A fully plant-based meal'
);

-- Create indexes for better performance
CREATE INDEX idx_wedding_guests_couple ON wedding_guests(couple_id);
CREATE INDEX idx_wedding_guests_email ON wedding_guests(email);
CREATE INDEX idx_wedding_guests_rsvp_status ON wedding_guests(rsvp_status);
CREATE INDEX idx_wedding_guests_created ON wedding_guests(created_at);

-- Add comment to document the table
COMMENT ON TABLE wedding_guests IS 'Stores wedding guest list with RSVP and meal preferences';