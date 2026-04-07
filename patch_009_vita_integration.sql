-- ============================================================
-- CareMatch360 — Patch 009: Vita lead integration
-- Run in Supabase SQL Editor BEFORE deploying v2.7.11 code patch.
--
-- This adds the data plumbing so leads imported from Vita can land
-- as draft cases (status='lead'), be matched against the provider
-- network, and converted to active cases when the deal closes.
-- ============================================================

-- 1. Add 'lead' value to case_status enum
--    (Postgres requires this in its own statement, can't be in a
--     transaction with subsequent uses of the new value.)
ALTER TYPE case_status ADD VALUE IF NOT EXISTS 'lead';

-- 2. Add Vita cross-reference + dispatch-gate columns to cases
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS vita_lead_id         UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS vita_lead_status     TEXT,
  ADD COLUMN IF NOT EXISTS vita_lead_synced_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS allow_pre_dispatch   BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_cases_vita_lead    ON cases(vita_lead_id);
CREATE INDEX IF NOT EXISTS idx_cases_status_lead  ON cases(status) WHERE status = 'lead';

-- 3. Add Vita cross-reference + DOB to clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS vita_lead_id   UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS date_of_birth  DATE;

CREATE INDEX IF NOT EXISTS idx_clients_vita_lead ON clients(vita_lead_id);

-- 4. Sanity check
DO $$
DECLARE
  has_lead_status  BOOLEAN;
  has_vita_col     BOOLEAN;
  has_pre_dispatch BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'case_status'::regtype AND enumlabel = 'lead'
  ) INTO has_lead_status;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'vita_lead_id'
  ) INTO has_vita_col;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'allow_pre_dispatch'
  ) INTO has_pre_dispatch;

  IF has_lead_status AND has_vita_col AND has_pre_dispatch THEN
    RAISE NOTICE '✓ patch_009 applied: case_status.lead, cases.vita_lead_id, cases.allow_pre_dispatch all present.';
  ELSE
    RAISE EXCEPTION 'Patch 009 did not complete — missing pieces.';
  END IF;
END $$;
