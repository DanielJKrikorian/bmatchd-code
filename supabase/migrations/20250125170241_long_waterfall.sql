-- Add city_id to couples table
ALTER TABLE couples
ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES cities(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_couples_city_id ON couples(city_id);

-- Update couples table queries in Dashboard.tsx
COMMENT ON COLUMN couples.city_id IS 'Reference to the city where the couple is located';
COMMENT ON COLUMN couples.location IS 'Legacy location field - kept for backwards compatibility';