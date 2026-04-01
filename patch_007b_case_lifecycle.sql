-- ============================================================
-- CareMatch360 — Patch 007b: Case lifecycle columns
-- Run AFTER patch_007 commits
-- ============================================================

-- Add lifecycle columns to cases
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS closed_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hold_reason  TEXT,
  ADD COLUMN IF NOT EXISTS hold_note    TEXT,
  ADD COLUMN IF NOT EXISTS on_hold_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_at  TIMESTAMPTZ;

-- Backfill assigned_at for already-assigned cases
UPDATE cases
  SET assigned_at = updated_at
  WHERE status = 'assigned' AND assigned_at IS NULL;

-- Verify
SELECT status, COUNT(*) FROM cases GROUP BY status ORDER BY status;
