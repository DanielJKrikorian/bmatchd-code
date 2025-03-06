-- Add vegetarian and vegan toggle columns to couples table
ALTER TABLE couples
ADD COLUMN IF NOT EXISTS vegetarian_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS vegan_enabled boolean DEFAULT true;

-- Add comment to document the columns
COMMENT ON COLUMN couples.vegetarian_enabled IS 'Whether vegetarian meal option is enabled';
COMMENT ON COLUMN couples.vegan_enabled IS 'Whether vegan meal option is enabled';