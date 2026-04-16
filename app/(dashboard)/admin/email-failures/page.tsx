export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import EmailFailuresClient, { type FailureRow } from './client'

export default async function EmailFailuresPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'admin') redirect('/dashboard')

  const db = createServiceClient()

  // Unresolved rows, newest first. Uses the partial index
  // email_send_failures_unresolved_idx for the ORDER BY.
  const { data: failures } = await db
    .from('email_send_failures')
    .select('id, created_at, recipient, subject, error_message, payload, related_provider_id, retry_count, last_retry_at')
    .is('resolved_at', null)
    .order('created_at', { ascending: false })

  const rows: FailureRow[] = (failures ?? []).map((f: any) => ({
    id: f.id,
    created_at: f.created_at,
    recipient: f.recipient,
    subject: f.subject,
    error_message: f.error_message,
    related_provider_id: f.related_provider_id,
    retry_count: f.retry_count ?? 0,
    last_retry_at: f.last_retry_at,
    kind: f.payload?.kind ?? null,
    applicant_name: f.payload?.applicant_name ?? null,
    applicant_email: f.payload?.applicant_email ?? null,
    credential: f.payload?.credential ?? null,
  }))

  return <EmailFailuresClient failures={rows} />
}
