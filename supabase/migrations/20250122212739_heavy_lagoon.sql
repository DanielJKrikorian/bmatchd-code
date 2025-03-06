-- Add more cities for all states
INSERT INTO cities (name, state) VALUES
  -- Florida
  ('Jacksonville', 'Florida'),
  ('Miami', 'Florida'),
  ('Tampa', 'Florida'),
  ('Orlando', 'Florida'),
  ('St. Petersburg', 'Florida'),
  ('Hialeah', 'Florida'),
  ('Port St. Lucie', 'Florida'),
  ('Cape Coral', 'Florida'),
  ('Tallahassee', 'Florida'),
  ('Fort Lauderdale', 'Florida'),
  
  -- Louisiana
  ('New Orleans', 'Louisiana'),
  ('Baton Rouge', 'Louisiana'),
  ('Shreveport', 'Louisiana'),
  ('Lafayette', 'Louisiana'),
  ('Lake Charles', 'Louisiana'),
  ('Kenner', 'Louisiana'),
  ('Bossier City', 'Louisiana'),
  ('Monroe', 'Louisiana'),
  ('Alexandria', 'Louisiana'),
  ('Houma', 'Louisiana'),
  
  -- Massachusetts
  ('Boston', 'Massachusetts'),
  ('Worcester', 'Massachusetts'),
  ('Springfield', 'Massachusetts'),
  ('Lowell', 'Massachusetts'),
  ('Cambridge', 'Massachusetts'),
  ('New Bedford', 'Massachusetts'),
  ('Brockton', 'Massachusetts'),
  ('Quincy', 'Massachusetts'),
  ('Lynn', 'Massachusetts'),
  ('Fall River', 'Massachusetts'),
  
  -- Michigan
  ('Detroit', 'Michigan'),
  ('Grand Rapids', 'Michigan'),
  ('Warren', 'Michigan'),
  ('Sterling Heights', 'Michigan'),
  ('Ann Arbor', 'Michigan'),
  ('Lansing', 'Michigan'),
  ('Flint', 'Michigan'),
  ('Dearborn', 'Michigan'),
  ('Livonia', 'Michigan'),
  ('Westland', 'Michigan'),
  
  -- Missouri
  ('Kansas City', 'Missouri'),
  ('St. Louis', 'Missouri'),
  ('Springfield', 'Missouri'),
  ('Columbia', 'Missouri'),
  ('Independence', 'Missouri'),
  ('Lee''s Summit', 'Missouri'),
  ('O''Fallon', 'Missouri'),
  ('St. Joseph', 'Missouri'),
  ('St. Charles', 'Missouri'),
  ('St. Peters', 'Missouri'),
  
  -- Nevada
  ('Las Vegas', 'Nevada'),
  ('Henderson', 'Nevada'),
  ('Reno', 'Nevada'),
  ('North Las Vegas', 'Nevada'),
  ('Sparks', 'Nevada'),
  ('Carson City', 'Nevada'),
  ('Fernley', 'Nevada'),
  ('Elko', 'Nevada'),
  ('Mesquite', 'Nevada'),
  ('Boulder City', 'Nevada'),
  
  -- New Mexico
  ('Albuquerque', 'New Mexico'),
  ('Las Cruces', 'New Mexico'),
  ('Rio Rancho', 'New Mexico'),
  ('Santa Fe', 'New Mexico'),
  ('Roswell', 'New Mexico'),
  ('Farmington', 'New Mexico'),
  ('Alamogordo', 'New Mexico'),
  ('Clovis', 'New Mexico'),
  ('Hobbs', 'New Mexico'),
  ('Carlsbad', 'New Mexico'),
  
  -- New York
  ('New York City', 'New York'),
  ('Buffalo', 'New York'),
  ('Rochester', 'New York'),
  ('Syracuse', 'New York'),
  ('Albany', 'New York'),
  ('Yonkers', 'New York'),
  ('Schenectady', 'New York'),
  ('Utica', 'New York'),
  ('White Plains', 'New York'),
  ('Binghamton', 'New York'),
  
  -- North Carolina
  ('Charlotte', 'North Carolina'),
  ('Raleigh', 'North Carolina'),
  ('Greensboro', 'North Carolina'),
  ('Durham', 'North Carolina'),
  ('Winston-Salem', 'North Carolina'),
  ('Fayetteville', 'North Carolina'),
  ('Cary', 'North Carolina'),
  ('Wilmington', 'North Carolina'),
  ('High Point', 'North Carolina'),
  ('Asheville', 'North Carolina'),
  
  -- Ohio
  ('Columbus', 'Ohio'),
  ('Cleveland', 'Ohio'),
  ('Cincinnati', 'Ohio'),
  ('Toledo', 'Ohio'),
  ('Akron', 'Ohio'),
  ('Dayton', 'Ohio'),
  ('Parma', 'Ohio'),
  ('Canton', 'Ohio'),
  ('Youngstown', 'Ohio'),
  ('Lorain', 'Ohio'),
  
  -- Oklahoma
  ('Oklahoma City', 'Oklahoma'),
  ('Tulsa', 'Oklahoma'),
  ('Norman', 'Oklahoma'),
  ('Broken Arrow', 'Oklahoma'),
  ('Edmond', 'Oklahoma'),
  ('Lawton', 'Oklahoma'),
  ('Moore', 'Oklahoma'),
  ('Midwest City', 'Oklahoma'),
  ('Enid', 'Oklahoma'),
  ('Stillwater', 'Oklahoma'),
  
  -- Pennsylvania
  ('Philadelphia', 'Pennsylvania'),
  ('Pittsburgh', 'Pennsylvania'),
  ('Allentown', 'Pennsylvania'),
  ('Erie', 'Pennsylvania'),
  ('Reading', 'Pennsylvania'),
  ('Scranton', 'Pennsylvania'),
  ('Bethlehem', 'Pennsylvania'),
  ('Lancaster', 'Pennsylvania'),
  ('Harrisburg', 'Pennsylvania'),
  ('Altoona', 'Pennsylvania'),
  
  -- Tennessee
  ('Nashville', 'Tennessee'),
  ('Memphis', 'Tennessee'),
  ('Knoxville', 'Tennessee'),
  ('Chattanooga', 'Tennessee'),
  ('Clarksville', 'Tennessee'),
  ('Murfreesboro', 'Tennessee'),
  ('Franklin', 'Tennessee'),
  ('Jackson', 'Tennessee'),
  ('Johnson City', 'Tennessee'),
  ('Bartlett', 'Tennessee'),
  
  -- Texas
  ('Houston', 'Texas'),
  ('San Antonio', 'Texas'),
  ('Dallas', 'Texas'),
  ('Austin', 'Texas'),
  ('Fort Worth', 'Texas'),
  ('El Paso', 'Texas'),
  ('Arlington', 'Texas'),
  ('Corpus Christi', 'Texas'),
  ('Plano', 'Texas'),
  ('Laredo', 'Texas'),
  
  -- Virginia
  ('Virginia Beach', 'Virginia'),
  ('Norfolk', 'Virginia'),
  ('Chesapeake', 'Virginia'),
  ('Richmond', 'Virginia'),
  ('Newport News', 'Virginia'),
  ('Alexandria', 'Virginia'),
  ('Hampton', 'Virginia'),
  ('Roanoke', 'Virginia'),
  ('Portsmouth', 'Virginia'),
  ('Suffolk', 'Virginia')
ON CONFLICT (name, state, country) DO NOTHING;