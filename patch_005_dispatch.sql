-- ============================================================
-- CareMatch360 — Patch 005: Phase 2 Dispatch & Response
-- Run ONCE in Supabase SQL Editor
-- ============================================================

-- Single-use response tokens (one per case_match per dispatch)
CREATE TABLE IF NOT EXISTS dispatch_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token         TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  case_match_id UUID NOT NULL REFERENCES case_matches(id) ON DELETE CASCADE,
  case_id       UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  provider_id   UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  channel       TEXT NOT NULL CHECK (channel IN ('email','sms','whatsapp')),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '48 hours',
  used_at       TIMESTAMPTZ,
  answer        TEXT CHECK (answer IN ('yes','no')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tokens_token    ON dispatch_tokens(token);
CREATE INDEX IF NOT EXISTS idx_tokens_match    ON dispatch_tokens(case_match_id);
CREATE INDEX IF NOT EXISTS idx_tokens_expires  ON dispatch_tokens(expires_at);
ALTER TABLE dispatch_tokens DISABLE ROW LEVEL SECURITY;

-- Extend case_matches with dispatch tracking
ALTER TABLE case_matches
  ADD COLUMN IF NOT EXISTS notified_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notified_channels TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS response_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS response_channel TEXT;

-- Extend cases with dispatch timestamp
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ;

-- Dispatch log (one row per send attempt)
CREATE TABLE IF NOT EXISTS dispatch_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  channel     TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('sent','failed','bounced')),
  external_id TEXT,   -- Resend message ID or Twilio SID
  error       TEXT,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dispatch_log_case ON dispatch_log(case_id);
ALTER TABLE dispatch_log DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('dispatch_tokens','dispatch_log')
ORDER BY table_name;
