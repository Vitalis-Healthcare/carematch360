-- ============================================================
-- CareMatch360 — Patch 008: Custom Authentication
-- Run ONCE in Supabase SQL Editor
-- ============================================================

-- 1. Staff users (admin + coordinators)
CREATE TABLE staff_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin','coordinator')),
  active      BOOLEAN NOT NULL DEFAULT true,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed: Okezie as admin
INSERT INTO staff_users (email, full_name, role)
VALUES ('okezie@vitalishealthcare.com', 'Okezie Ofoegbu', 'admin');

-- 2. Auth tokens (magic links + SMS OTP)
CREATE TABLE auth_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT UNIQUE NOT NULL,               -- magic link token OR 6-digit OTP
  token_type  TEXT NOT NULL CHECK (token_type IN ('magic_link','otp')),
  channel     TEXT NOT NULL CHECK (channel IN ('email','sms')),
  user_type   TEXT NOT NULL CHECK (user_type IN ('staff','provider')),
  user_id     UUID NOT NULL,                      -- staff_users.id OR providers.id
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auth_tokens_token ON auth_tokens(token);
CREATE INDEX idx_auth_tokens_user ON auth_tokens(user_id, user_type);

-- 3. Auth sessions (httpOnly cookie sessions)
CREATE TABLE auth_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  user_type     TEXT NOT NULL CHECK (user_type IN ('staff','provider')),
  user_id       UUID NOT NULL,
  role          TEXT NOT NULL,                    -- admin | coordinator | provider
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auth_sessions_token ON auth_sessions(session_token);

-- 4. Cleanup: auto-delete expired tokens + sessions
-- (run periodically or let the app handle it)

-- Verify
SELECT 
  (SELECT COUNT(*) FROM staff_users) AS staff_users,
  'auth_tokens table ready' AS tokens,
  'auth_sessions table ready' AS sessions;
