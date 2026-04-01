-- ============================================================
-- CareMatch360 — Patch 002: All 7 Enhancements
-- Run ONCE in Supabase SQL Editor
-- ============================================================

-- ─── 1. CASE SCHEDULING ───────────────────────────────────
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS schedule_type      TEXT NOT NULL DEFAULT 'one_time'
    CHECK (schedule_type IN ('one_time','recurring','flexible')),
  ADD COLUMN IF NOT EXISTS recurring_days     TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recurring_start    TIME,
  ADD COLUMN IF NOT EXISTS recurring_end      TIME,
  ADD COLUMN IF NOT EXISTS flexible_hours_day NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS flexible_days_week INTEGER,
  ADD COLUMN IF NOT EXISTS flexible_any_time  BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── 2 & 3. ADDITIONAL REQUIREMENTS (providers) ───────────
ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS has_car             BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gender              TEXT NOT NULL DEFAULT 'unspecified'
    CHECK (gender IN ('male','female','non_binary','unspecified')),
  ADD COLUMN IF NOT EXISTS meal_prep           BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS total_care          BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS wheelchair_transfer BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hoyer_lift          BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS spanish_speaking    BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── 2 & 3. ADDITIONAL REQUIREMENTS (cases / clients) ────
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS requires_car             BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gender_preference        TEXT NOT NULL DEFAULT 'any'
    CHECK (gender_preference IN ('any','male','female')),
  ADD COLUMN IF NOT EXISTS requires_meal_prep       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requires_total_care      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requires_wheelchair      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requires_hoyer_lift      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requires_spanish         BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS requires_car             BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gender_preference        TEXT NOT NULL DEFAULT 'any'
    CHECK (gender_preference IN ('any','male','female')),
  ADD COLUMN IF NOT EXISTS requires_meal_prep       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requires_total_care      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requires_wheelchair      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requires_hoyer_lift      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requires_spanish         BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── 4. DUAL PAYER ────────────────────────────────────────
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS payer_types TEXT[] NOT NULL DEFAULT '{}';

-- Migrate existing payer_type → payer_types
UPDATE clients
  SET payer_types = ARRAY[payer_type]
  WHERE payer_type IS NOT NULL AND payer_types = '{}';

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS payer_types TEXT[] NOT NULL DEFAULT '{}';

-- ─── 5. CASE DOCUMENTS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS case_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  file_type   TEXT,
  file_size   INTEGER,
  doc_type    TEXT NOT NULL DEFAULT 'other'
    CHECK (doc_type IN ('doctors_order','client_request','authorization','insurance','assessment','care_plan','id','other')),
  uploaded_by TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_case_docs_case ON case_documents(case_id);
ALTER TABLE case_documents DISABLE ROW LEVEL SECURITY;

-- ─── 6. MULTIPLE CREDENTIALS ──────────────────────────────
ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS additional_credentials TEXT[] NOT NULL DEFAULT '{}';

-- ─── 7. PREFERRED WORK HOURS ──────────────────────────────
ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS work_hours_start   TIME,
  ADD COLUMN IF NOT EXISTS work_hours_end     TIME,
  ADD COLUMN IF NOT EXISTS shift_preference   TEXT NOT NULL DEFAULT 'any'
    CHECK (shift_preference IN ('morning','afternoon','evening','overnight','any'));

-- ─── VERIFY ───────────────────────────────────────────────
SELECT 'providers' as tbl, column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'providers'
    AND column_name IN ('has_car','gender','meal_prep','hoyer_lift','work_hours_start','shift_preference','additional_credentials')
UNION ALL
SELECT 'cases' as tbl, column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'cases'
    AND column_name IN ('schedule_type','recurring_days','flexible_hours_day','requires_hoyer_lift','payer_types')
UNION ALL
SELECT 'clients' as tbl, column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'clients'
    AND column_name IN ('requires_car','gender_preference','payer_types')
ORDER BY tbl, column_name;
