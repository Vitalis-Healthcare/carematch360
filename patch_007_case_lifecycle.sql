-- ============================================================
-- CareMatch360 — Patch 007: Case Lifecycle & Analytics
-- Run ONCE in Supabase SQL Editor
-- ============================================================

-- 1. Add on_hold to case_status enum
ALTER TYPE case_status ADD VALUE IF NOT EXISTS 'on_hold';

-- Run patch_007b after this commits
