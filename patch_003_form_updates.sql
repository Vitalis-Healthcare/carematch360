-- ============================================================
-- CareMatch360 — Patch 003: Form refinements
-- ============================================================

-- 1. Shift preference → multi-select (TEXT[])
ALTER TABLE providers
  DROP COLUMN IF EXISTS work_hours_start,
  DROP COLUMN IF EXISTS work_hours_end;

-- Convert shift_preference from TEXT to TEXT[] safely
ALTER TABLE providers ADD COLUMN IF NOT EXISTS shift_preferences TEXT[] NOT NULL DEFAULT '{}';
-- Migrate existing value
UPDATE providers SET shift_preferences = ARRAY[shift_preference] WHERE shift_preference IS NOT NULL AND shift_preference != 'any';
ALTER TABLE providers DROP COLUMN IF EXISTS shift_preference;

-- 2. Client additional credentials
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS additional_credentials TEXT[] NOT NULL DEFAULT '{}';

-- 3. Consolidate capability flags into skills/requirements arrays for cleaner UI
-- (flags remain in DB for matching engine; UI presents them as selectable items)
-- No schema change needed — we just change how UI surfaces them

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'providers'
  AND column_name IN ('shift_preferences','has_car','meal_prep','hoyer_lift')
ORDER BY column_name;

SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'clients'
  AND column_name IN ('additional_credentials','requires_car','requires_hoyer_lift')
ORDER BY column_name;
