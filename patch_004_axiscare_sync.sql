-- ============================================================
-- CareMatch360 — Patch 004: AxisCare Integration
-- Run ONCE in Supabase SQL Editor
-- ============================================================

-- Settings table (stores integration config)
CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;

-- AxisCare sync log
CREATE TABLE IF NOT EXISTS axiscare_sync_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type    TEXT NOT NULL CHECK (entity_type IN ('caregiver','client')),
  axiscare_id    INTEGER NOT NULL,
  axiscare_name  TEXT NOT NULL,
  carematch_id   UUID,
  action         TEXT NOT NULL CHECK (action IN ('imported','skipped','updated','error')),
  error_message  TEXT,
  synced_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entity_type, axiscare_id)
);
CREATE INDEX IF NOT EXISTS idx_sync_log_entity ON axiscare_sync_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_log_synced  ON axiscare_sync_log(synced_at DESC);
ALTER TABLE axiscare_sync_log DISABLE ROW LEVEL SECURITY;

-- Add axiscare_id to providers and clients for future webhook sync
ALTER TABLE providers ADD COLUMN IF NOT EXISTS axiscare_id INTEGER UNIQUE;
ALTER TABLE clients   ADD COLUMN IF NOT EXISTS axiscare_id INTEGER UNIQUE;

-- Verify
SELECT column_name FROM information_schema.columns
WHERE table_name IN ('providers','clients')
  AND column_name = 'axiscare_id'
ORDER BY table_name;
