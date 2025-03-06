-- Add more cities to Rhode Island and Connecticut
INSERT INTO cities (name, state) VALUES
  -- Rhode Island
  ('Newport', 'Rhode Island'),
  ('Warwick', 'Rhode Island'),
  ('Cranston', 'Rhode Island'),
  ('Pawtucket', 'Rhode Island'),
  ('Narragansett', 'Rhode Island'),
  ('Westerly', 'Rhode Island'),
  ('Woonsocket', 'Rhode Island'),
  ('Bristol', 'Rhode Island'),
  ('Jamestown', 'Rhode Island'),
  ('Block Island', 'Rhode Island'),
  ('East Greenwich', 'Rhode Island'),
  ('Middletown', 'Rhode Island'),
  ('North Kingstown', 'Rhode Island'),
  ('South Kingstown', 'Rhode Island'),
  ('Portsmouth', 'Rhode Island'),

  -- Connecticut
  ('Stamford', 'Connecticut'),
  ('New Haven', 'Connecticut'),
  ('Bridgeport', 'Connecticut'),
  ('Waterbury', 'Connecticut'),
  ('Danbury', 'Connecticut'),
  ('New London', 'Connecticut'),
  ('Greenwich', 'Connecticut'),
  ('Mystic', 'Connecticut'),
  ('Norwalk', 'Connecticut'),
  ('West Hartford', 'Connecticut'),
  ('New Britain', 'Connecticut'),
  ('Bristol', 'Connecticut'),
  ('Meriden', 'Connecticut'),
  ('Milford', 'Connecticut'),
  ('Westport', 'Connecticut'),
  ('Madison', 'Connecticut'),
  ('Guilford', 'Connecticut'),
  ('Stonington', 'Connecticut'),
  ('Essex', 'Connecticut'),
  ('Old Saybrook', 'Connecticut')
ON CONFLICT (name, state, country) DO NOTHING;