-- patch_011_email_send_failures.sql
-- Creates the email_send_failures table for soft-failure logging on
-- transactional emails (starting with /api/providers/apply coordinator
-- notification). v2.7.16 will add an admin retry UI at
-- /(dashboard)/admin/email-failures that reads from this table.

CREATE TABLE IF NOT EXISTS public.email_send_failures (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz   NOT NULL    DEFAULT now(),
  recipient           text          NOT NULL,
  subject             text          NOT NULL,
  error_message       text          NOT NULL,
  payload             jsonb         NOT NULL,
  related_provider_id uuid                      REFERENCES public.providers(id) ON DELETE SET NULL,
  retry_count         integer       NOT NULL    DEFAULT 0,
  last_retry_at       timestamptz,
  resolved_at         timestamptz,
  resolved_by         text
);

-- Partial index: unresolved failures, newest first.
-- Sized for the admin retry queue and the future sidebar-badge count query.
CREATE INDEX IF NOT EXISTS email_send_failures_unresolved_idx
  ON public.email_send_failures (created_at DESC)
  WHERE resolved_at IS NULL;

-- Secondary index on related_provider_id for looking up failures
-- tied to a specific provider from the providers detail page.
CREATE INDEX IF NOT EXISTS email_send_failures_provider_idx
  ON public.email_send_failures (related_provider_id)
  WHERE related_provider_id IS NOT NULL;

-- Verify creation (this SELECT will return a row if the table exists).
-- Supabase SQL editor displays "Success. No rows returned" if it DIDN'T
-- get created, so we do a real check here — see carematch360-pitfalls
-- #13a for why the editor's messaging is ambiguous.
SELECT table_name
  FROM information_schema.tables
 WHERE table_schema = 'public'
   AND table_name   = 'email_send_failures';
