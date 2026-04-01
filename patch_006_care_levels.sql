-- ============================================================
-- CareMatch360 — Patch 006: Care Levels + Expanded Credentials
-- Run ONCE in Supabase SQL Editor
-- ============================================================

-- ── 1. Add new values to the credential_type ENUM ────────────
-- PostgreSQL requires ALTER TYPE … ADD VALUE for enums
ALTER TYPE credential_type ADD VALUE IF NOT EXISTS 'UA';
ALTER TYPE credential_type ADD VALUE IF NOT EXISTS 'GNA';
ALTER TYPE credential_type ADD VALUE IF NOT EXISTS 'CMT';

-- ── 2. Add care_level to cases ───────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'care_level_type'
  ) THEN
    CREATE TYPE care_level_type AS ENUM (
      'companion_care',
      'personal_care',
      'skilled_nursing',
      'physical_therapy',
      'occupational_therapy',
      'speech_therapy'
    );
  END IF;
END $$;

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS care_level TEXT;

-- Migrate existing cases: map old required_credential → care_level
UPDATE cases SET care_level =
  CASE required_credential
    WHEN 'RN'  THEN 'skilled_nursing'
    WHEN 'LPN' THEN 'skilled_nursing'
    WHEN 'CNA' THEN 'personal_care'
    WHEN 'UA'  THEN 'personal_care'
    WHEN 'GNA' THEN 'personal_care'
    WHEN 'CMT' THEN 'personal_care'
    WHEN 'PT'  THEN 'physical_therapy'
    WHEN 'OT'  THEN 'occupational_therapy'
    WHEN 'ST'  THEN 'speech_therapy'
    ELSE 'personal_care'
  END
WHERE care_level IS NULL;

-- ── 3. Add care_needs to clients ─────────────────────────────
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS care_needs TEXT[] NOT NULL DEFAULT '{}';

-- Migrate existing clients
UPDATE clients SET care_needs =
  CASE required_credential
    WHEN 'RN'  THEN ARRAY['skilled_nursing']
    WHEN 'LPN' THEN ARRAY['skilled_nursing']
    WHEN 'CNA' THEN ARRAY['personal_care']
    WHEN 'UA'  THEN ARRAY['personal_care']
    WHEN 'GNA' THEN ARRAY['personal_care']
    WHEN 'CMT' THEN ARRAY['personal_care']
    WHEN 'PT'  THEN ARRAY['physical_therapy']
    WHEN 'OT'  THEN ARRAY['occupational_therapy']
    WHEN 'ST'  THEN ARRAY['speech_therapy']
    ELSE ARRAY['personal_care']
  END
WHERE care_needs = '{}' AND required_credential IS NOT NULL;

-- ── Verify ───────────────────────────────────────────────────
SELECT 'enum values' AS info, enumlabel AS value
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'credential_type'
ORDER BY enumsortorder;
