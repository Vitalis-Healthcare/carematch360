-- ============================================================
-- patch_011: Vita provider push (v2.7.22)
-- Run in the Supabase SQL Editor, ONE STATEMENT AT A TIME.
-- Project: fclahdapdqguwzyyligz
-- Idempotent: safe to re-run.
--
-- Mirrors the vita_lead_id pattern established by patch_009 on the
-- clients and cases tables, in the opposite direction: there Vita owned
-- the id we stored, here Vita creates a candidate from our provider and
-- hands the id back.
-- ============================================================

-- 1. The Vita onb_candidates.id this provider was pushed into.
--    UNIQUE so one provider can never be linked to two candidates.
--    NULLs do not conflict in Postgres, so every un-pushed provider is
--    unaffected.
ALTER TABLE providers ADD COLUMN IF NOT EXISTS vita_candidate_id UUID UNIQUE;

-- 2. When the push last succeeded. Drives the "Sent to Vita on ..." line
--    and the Re-send wording on the provider page.
ALTER TABLE providers ADD COLUMN IF NOT EXISTS sent_to_vita_at TIMESTAMPTZ;

-- 3. PostgREST caches the schema. Without this the new columns are
--    invisible to the service client and the update after a successful
--    push fails silently on columns that plainly exist in the table editor.
NOTIFY pgrst, 'reload schema';
