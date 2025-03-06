-- Add more US cities
INSERT INTO cities (name, state) VALUES
  -- Northeast
  ('Buffalo', 'New York'),
  ('Pittsburgh', 'Pennsylvania'),
  ('Baltimore', 'Maryland'),
  ('Providence', 'Rhode Island'),
  ('Hartford', 'Connecticut'),
  ('Albany', 'New York'),
  
  -- Southeast
  ('Tampa', 'Florida'),
  ('Raleigh', 'North Carolina'),
  ('Virginia Beach', 'Virginia'),
  ('Charleston', 'South Carolina'),
  ('Savannah', 'Georgia'),
  ('Birmingham', 'Alabama'),
  
  -- Midwest
  ('Cleveland', 'Ohio'),
  ('Milwaukee', 'Wisconsin'),
  ('Kansas City', 'Missouri'),
  ('St. Louis', 'Missouri'),
  ('Cincinnati', 'Ohio'),
  ('Madison', 'Wisconsin'),
  
  -- Southwest
  ('Albuquerque', 'New Mexico'),
  ('Tucson', 'Arizona'),
  ('El Paso', 'Texas'),
  ('Oklahoma City', 'Oklahoma'),
  ('Tulsa', 'Oklahoma'),
  ('Santa Fe', 'New Mexico'),
  
  -- West Coast
  ('Sacramento', 'California'),
  ('Oakland', 'California'),
  ('Salt Lake City', 'Utah'),
  ('Boise', 'Idaho'),
  ('Spokane', 'Washington'),
  ('Eugene', 'Oregon')
ON CONFLICT (name, state, country) DO NOTHING;