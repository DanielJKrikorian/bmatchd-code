-- Add meal options and profile fields to couples table
ALTER TABLE couples
ADD COLUMN IF NOT EXISTS meal_options jsonb DEFAULT jsonb_build_object(
  'standard_name', 'Standard',
  'standard_description', 'A traditional plated dinner',
  'vegetarian_name', 'Vegetarian',
  'vegetarian_description', 'A plant-based meal with dairy',
  'vegan_name', 'Vegan',
  'vegan_description', 'A fully plant-based meal'
);

-- Add comment to document the column
COMMENT ON COLUMN couples.meal_options IS 'Meal options and descriptions for wedding guests';