-- ─────────────────────────────────────────────────────────────────
-- v2.7.19 — A2P 10DLC CTA fix: capture SMS consent on apply form
--
-- Adds two columns to `providers`:
--   sms_consent     — explicit opt-in for SMS case-opportunity messages
--   sms_consent_at  — timestamp of opt-in; NULL when user declined
--
-- Run this in Supabase SQL Editor BEFORE deploying the v2.7.19 code.
-- Both columns are safe to add to existing rows (defaults provided).
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS sms_consent    BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_consent_at TIMESTAMPTZ NULL;
