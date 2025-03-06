-- Add public profile settings to couples table
ALTER TABLE couples
ADD COLUMN IF NOT EXISTS public_profile boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_slug text UNIQUE;

-- Create function to generate unique slug
CREATE OR REPLACE FUNCTION generate_couple_slug(
  partner1 text,
  partner2 text
) RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  new_slug text;
  counter integer := 1;
BEGIN
  -- Create base slug from partner names
  base_slug := lower(
    regexp_replace(
      partner1 || '-and-' || partner2,
      '[^a-zA-Z0-9]+',
      '-',
      'g'
    )
  );
  
  -- Remove leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  
  -- Try the base slug first
  new_slug := base_slug;
  
  -- Keep trying with incrementing numbers until we find a unique slug
  WHILE EXISTS (
    SELECT 1 FROM couples WHERE profile_slug = new_slug
  ) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter::text;
  END LOOP;
  
  RETURN new_slug;
END;
$$;

-- Create trigger to generate slug on couple creation/update
CREATE OR REPLACE FUNCTION update_couple_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.public_profile AND (NEW.profile_slug IS NULL OR NEW.profile_slug = '') THEN
    NEW.profile_slug := generate_couple_slug(NEW.partner1_name, NEW.partner2_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_couple_slug
  BEFORE INSERT OR UPDATE ON couples
  FOR EACH ROW
  EXECUTE FUNCTION update_couple_slug();

-- Create policy for public profile access
CREATE POLICY "Allow public access to public profiles"
  ON couples
  FOR SELECT
  USING (public_profile = true);

-- Add index for better performance
CREATE INDEX idx_couples_profile_slug ON couples(profile_slug);