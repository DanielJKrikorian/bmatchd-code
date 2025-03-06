-- Add cities for all states
INSERT INTO cities (name, state) VALUES
  -- Alabama
  ('Birmingham', 'Alabama'),
  ('Montgomery', 'Alabama'),
  ('Huntsville', 'Alabama'),
  ('Mobile', 'Alabama'),
  ('Tuscaloosa', 'Alabama'),
  
  -- Alaska
  ('Anchorage', 'Alaska'),
  ('Fairbanks', 'Alaska'),
  ('Juneau', 'Alaska'),
  ('Sitka', 'Alaska'),
  ('Ketchikan', 'Alaska'),
  
  -- Arizona (adding more cities)
  ('Scottsdale', 'Arizona'),
  ('Mesa', 'Arizona'),
  ('Chandler', 'Arizona'),
  ('Glendale', 'Arizona'),
  ('Gilbert', 'Arizona'),
  
  -- Arkansas
  ('Little Rock', 'Arkansas'),
  ('Fayetteville', 'Arkansas'),
  ('Fort Smith', 'Arkansas'),
  ('Springdale', 'Arkansas'),
  ('Jonesboro', 'Arkansas'),
  
  -- Add more California cities
  ('Palo Alto', 'California'),
  ('Mountain View', 'California'),
  ('Sunnyvale', 'California'),
  ('Santa Clara', 'California'),
  ('Redwood City', 'California'),
  
  -- Colorado (adding more cities)
  ('Lakewood', 'Colorado'),
  ('Thornton', 'Colorado'),
  ('Arvada', 'Colorado'),
  ('Westminster', 'Colorado'),
  ('Pueblo', 'Colorado'),
  
  -- Delaware
  ('Wilmington', 'Delaware'),
  ('Dover', 'Delaware'),
  ('Newark', 'Delaware'),
  ('Middletown', 'Delaware'),
  ('Smyrna', 'Delaware'),
  
  -- Georgia (adding more cities)
  ('Augusta', 'Georgia'),
  ('Athens', 'Georgia'),
  ('Macon', 'Georgia'),
  ('Roswell', 'Georgia'),
  ('Albany', 'Georgia'),
  
  -- Hawaii (adding more cities)
  ('Pearl City', 'Hawaii'),
  ('Waipahu', 'Hawaii'),
  ('Kaneohe', 'Hawaii'),
  ('Mililani', 'Hawaii'),
  ('Ewa Beach', 'Hawaii'),
  
  -- Idaho
  ('Meridian', 'Idaho'),
  ('Nampa', 'Idaho'),
  ('Idaho Falls', 'Idaho'),
  ('Pocatello', 'Idaho'),
  ('Caldwell', 'Idaho'),
  
  -- Indiana (adding more cities)
  ('Fort Wayne', 'Indiana'),
  ('Evansville', 'Indiana'),
  ('South Bend', 'Indiana'),
  ('Carmel', 'Indiana'),
  ('Fishers', 'Indiana'),
  
  -- Iowa
  ('Des Moines', 'Iowa'),
  ('Cedar Rapids', 'Iowa'),
  ('Davenport', 'Iowa'),
  ('Sioux City', 'Iowa'),
  ('Iowa City', 'Iowa'),
  
  -- Kansas
  ('Wichita', 'Kansas'),
  ('Overland Park', 'Kansas'),
  ('Kansas City', 'Kansas'),
  ('Olathe', 'Kansas'),
  ('Topeka', 'Kansas'),
  
  -- Kentucky
  ('Louisville', 'Kentucky'),
  ('Lexington', 'Kentucky'),
  ('Bowling Green', 'Kentucky'),
  ('Owensboro', 'Kentucky'),
  ('Covington', 'Kentucky'),
  
  -- Maine
  ('Portland', 'Maine'),
  ('Lewiston', 'Maine'),
  ('Bangor', 'Maine'),
  ('South Portland', 'Maine'),
  ('Auburn', 'Maine'),
  
  -- Maryland (adding more cities)
  ('Frederick', 'Maryland'),
  ('Rockville', 'Maryland'),
  ('Gaithersburg', 'Maryland'),
  ('Bowie', 'Maryland'),
  ('Hagerstown', 'Maryland'),
  
  -- Minnesota (adding more cities)
  ('St. Paul', 'Minnesota'),
  ('Rochester', 'Minnesota'),
  ('Duluth', 'Minnesota'),
  ('Bloomington', 'Minnesota'),
  ('Brooklyn Park', 'Minnesota'),
  
  -- Mississippi
  ('Jackson', 'Mississippi'),
  ('Gulfport', 'Mississippi'),
  ('Southaven', 'Mississippi'),
  ('Hattiesburg', 'Mississippi'),
  ('Biloxi', 'Mississippi'),
  
  -- Montana
  ('Billings', 'Montana'),
  ('Missoula', 'Montana'),
  ('Great Falls', 'Montana'),
  ('Bozeman', 'Montana'),
  ('Helena', 'Montana'),
  
  -- Nebraska
  ('Omaha', 'Nebraska'),
  ('Lincoln', 'Nebraska'),
  ('Bellevue', 'Nebraska'),
  ('Grand Island', 'Nebraska'),
  ('Kearney', 'Nebraska'),
  
  -- New Hampshire
  ('Manchester', 'New Hampshire'),
  ('Nashua', 'New Hampshire'),
  ('Concord', 'New Hampshire'),
  ('Dover', 'New Hampshire'),
  ('Rochester', 'New Hampshire'),
  
  -- New Jersey (adding more cities)
  ('Newark', 'New Jersey'),
  ('Jersey City', 'New Jersey'),
  ('Paterson', 'New Jersey'),
  ('Elizabeth', 'New Jersey'),
  ('Edison', 'New Jersey'),
  
  -- North Dakota
  ('Fargo', 'North Dakota'),
  ('Bismarck', 'North Dakota'),
  ('Grand Forks', 'North Dakota'),
  ('Minot', 'North Dakota'),
  ('West Fargo', 'North Dakota'),
  
  -- Oregon (adding more cities)
  ('Salem', 'Oregon'),
  ('Gresham', 'Oregon'),
  ('Hillsboro', 'Oregon'),
  ('Beaverton', 'Oregon'),
  ('Bend', 'Oregon'),
  
  -- South Carolina (adding more cities)
  ('Columbia', 'South Carolina'),
  ('Mount Pleasant', 'South Carolina'),
  ('Rock Hill', 'South Carolina'),
  ('Greenville', 'South Carolina'),
  ('Summerville', 'South Carolina'),
  
  -- South Dakota
  ('Sioux Falls', 'South Dakota'),
  ('Rapid City', 'South Dakota'),
  ('Aberdeen', 'South Dakota'),
  ('Brookings', 'South Dakota'),
  ('Watertown', 'South Dakota'),
  
  -- Utah (adding more cities)
  ('West Valley City', 'Utah'),
  ('Provo', 'Utah'),
  ('West Jordan', 'Utah'),
  ('Orem', 'Utah'),
  ('Sandy', 'Utah'),
  
  -- Vermont
  ('Burlington', 'Vermont'),
  ('South Burlington', 'Vermont'),
  ('Rutland', 'Vermont'),
  ('Essex Junction', 'Vermont'),
  ('Bennington', 'Vermont'),
  
  -- West Virginia
  ('Charleston', 'West Virginia'),
  ('Huntington', 'West Virginia'),
  ('Morgantown', 'West Virginia'),
  ('Parkersburg', 'West Virginia'),
  ('Wheeling', 'West Virginia'),
  
  -- Wisconsin (adding more cities)
  ('Green Bay', 'Wisconsin'),
  ('Kenosha', 'Wisconsin'),
  ('Racine', 'Wisconsin'),
  ('Appleton', 'Wisconsin'),
  ('Waukesha', 'Wisconsin'),
  
  -- Wyoming
  ('Cheyenne', 'Wyoming'),
  ('Casper', 'Wyoming'),
  ('Laramie', 'Wyoming'),
  ('Gillette', 'Wyoming'),
  ('Rock Springs', 'Wyoming')
ON CONFLICT (name, state, country) DO NOTHING;