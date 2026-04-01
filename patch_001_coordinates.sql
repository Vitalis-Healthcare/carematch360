-- ============================================================
-- CareMatch360 — Patch 001: Add coordinates to seed data
-- Run this ONCE in Supabase SQL Editor
-- (Only needed if you already ran migration_001.sql)
-- ============================================================

-- Update seed providers with real Maryland city coordinates
UPDATE providers SET lat = 38.9907, lng = -77.0261 WHERE name = 'Mary Johnson';
UPDATE providers SET lat = 39.0993, lng = -76.8483 WHERE name = 'James Okeke';
UPDATE providers SET lat = 39.0840, lng = -77.1528 WHERE name = 'Patricia Davis';
UPDATE providers SET lat = 38.9554, lng = -76.9455 WHERE name = 'Kevin Obi';
UPDATE providers SET lat = 39.1434, lng = -77.2014 WHERE name = 'Susan Lee';
UPDATE providers SET lat = 39.0298, lng = -76.9199 WHERE name = 'Adaeze Nwoke';
UPDATE providers SET lat = 39.0376, lng = -77.0577 WHERE name = 'Thomas Wright';

-- Update seed clients
UPDATE clients SET lat = 38.9907, lng = -77.0261 WHERE name = 'Robert Thompson';
UPDATE clients SET lat = 39.0993, lng = -76.8483 WHERE name = 'Agnes Mwangi';
UPDATE clients SET lat = 39.0840, lng = -77.1528 WHERE name = 'Harold Stevens';
UPDATE clients SET lat = 38.9554, lng = -76.9455 WHERE name = 'Dorothy Kim';
UPDATE clients SET lat = 39.1434, lng = -77.2014 WHERE name = 'Eugene Okafor';

-- Confirm
SELECT name, city, lat, lng FROM providers ORDER BY name;
SELECT name, city, lat, lng FROM clients ORDER BY name;
