-- ============================================================
-- CareMatch360 — Patch 006b: Care levels + migrations
-- Run AFTER patch_006a has completed and committed
-- ============================================================

-- ── 1. Add care_level column to cases ────────────────────────
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS care_level TEXT;

UPDATE cases SET care_level =
  CASE required_credential::text
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

-- ── 2. Add care_needs column to clients ──────────────────────
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS care_needs TEXT[] NOT NULL DEFAULT '{}';

UPDATE clients SET care_needs =
  CASE required_credential::text
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
SELECT 'cases by care_level' AS info, care_level, COUNT(*) 
FROM cases GROUP BY care_level
UNION ALL
SELECT 'clients with care_needs', 
  CASE WHEN array_length(care_needs,1) > 0 THEN 'has care_needs' ELSE 'empty' END,
  COUNT(*)
FROM clients GROUP BY 2
ORDER BY 1, 2;
