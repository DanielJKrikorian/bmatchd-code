-- Add venue and travel information columns to couples table
ALTER TABLE couples
ADD COLUMN IF NOT EXISTS venue text,
ADD COLUMN IF NOT EXISTS venue_address text,
ADD COLUMN IF NOT EXISTS hotel_name text,
ADD COLUMN IF NOT EXISTS hotel_address text,
ADD COLUMN IF NOT EXISTS hotel_website text,
ADD COLUMN IF NOT EXISTS hotel_notes text,
ADD COLUMN IF NOT EXISTS hotel_room_block text,
ADD COLUMN IF NOT EXISTS hotel_deadline timestamptz;

-- Add love story columns
ALTER TABLE couples
ADD COLUMN IF NOT EXISTS how_we_met text,
ADD COLUMN IF NOT EXISTS proposal_story text,
ADD COLUMN IF NOT EXISTS relationship_story text;

-- Add meal options and song requests
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

-- Add public profile settings
ALTER TABLE couples
ADD COLUMN IF NOT EXISTS public_profile boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_slug text UNIQUE;

-- Add venmo for registry
ALTER TABLE couples
ADD COLUMN IF NOT EXISTS venmo_username text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_couples_venue ON couples(venue);
CREATE INDEX IF NOT EXISTS idx_couples_profile_slug ON couples(profile_slug);
CREATE INDEX IF NOT EXISTS idx_couples_public_profile ON couples(public_profile);

-- Add comments to document the columns
COMMENT ON COLUMN couples.venue IS 'Name of the wedding venue';
COMMENT ON COLUMN couples.venue_address IS 'Address of the wedding venue';
COMMENT ON COLUMN couples.hotel_name IS 'Name of the hotel for guest accommodations';
COMMENT ON COLUMN couples.hotel_address IS 'Address of the hotel';
COMMENT ON COLUMN couples.hotel_website IS 'Website URL for hotel bookings';
COMMENT ON COLUMN couples.hotel_notes IS 'Additional notes about hotel accommodations';
COMMENT ON COLUMN couples.hotel_room_block IS 'Room block code or group name';
COMMENT ON COLUMN couples.hotel_deadline IS 'Deadline for room block reservations';
COMMENT ON COLUMN couples.how_we_met IS 'The story of how the couple first met';
COMMENT ON COLUMN couples.proposal_story IS 'The story of the marriage proposal';
COMMENT ON COLUMN couples.relationship_story IS 'What makes their relationship special';
COMMENT ON COLUMN couples.allow_song_requests IS 'Whether guests can request songs';
COMMENT ON COLUMN couples.meal_options IS 'Meal options and descriptions for wedding guests';
COMMENT ON COLUMN couples.public_profile IS 'Whether the couple profile is publicly viewable';
COMMENT ON COLUMN couples.profile_slug IS 'URL-friendly identifier for public profile';
COMMENT ON COLUMN couples.venmo_username IS 'Venmo username for registry gifts';