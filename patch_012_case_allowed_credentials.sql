-- ============================================================
-- CareMatch360 — Patch 012: case qualification restriction (v2.7.27)
--
-- Adds cases.allowed_credentials: a hard restriction on which
-- provider credentials the matching engine may surface for this
-- case. NULL or empty array = no restriction (the care-level
-- pool applies, unchanged behavior for all existing cases).
--
-- The credential_type enum already holds all 9 values
-- (UA/CNA/GNA/CMT/LPN/RN/PT/OT/ST — extended by patch_006a).
-- This patch adds NO enum values, so it is single-pass safe.
-- ============================================================

ALTER TABLE cases ADD COLUMN IF NOT EXISTS allowed_credentials credential_type[];

COMMENT ON COLUMN cases.allowed_credentials IS
  'v2.7.27 — hard matching restriction; subset of the care-level pool. NULL/empty = no restriction.';

-- Verify (read-only) — expect exactly one row:
--   column_name         | data_type | udt_name
--   allowed_credentials | ARRAY     | _credential_type
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'cases' AND column_name = 'allowed_credentials';
