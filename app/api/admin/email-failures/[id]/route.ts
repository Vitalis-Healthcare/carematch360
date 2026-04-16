import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'
import { renderApplicantConfirmationHtml } from '@/lib/email/applicant-confirmation-html'
import { sendApplyNotification } from '@/lib/email/send-apply-notification'
import type { FontBundle } from '@/lib/email/apply-notification-pdf'
import type { ApplicantData } from '@/lib/email/types'
import { readFileSync } from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const maxDuration = 30

// ──────────────────────────────────────────────────────────────
// Asset loading — same pattern as apply/route.ts. MUST live in
// this route file (not an imported helper) so Vercel's Node File
// Trace bundles public/branding + public/fonts with this function.
// ──────────────────────────────────────────────────────────────

function loadAssetAsDataUri(relativePath: string, mime: string): string {
  try {
    const abs = path.resolve(process.cwd(), 'public', relativePath)
    const bytes = readFileSync(abs)
    return `data:${mime};base64,${bytes.toString('base64')}`
  } catch (err) {
    console.error(`[retry] Failed to load asset ${relativePath}:`, err)
    return ''
  }
}

const LOGO_DATA_URI = loadAssetAsDataUri('branding/vitalis-logo.png', 'image/png')

const FONT_BUNDLE: FontBundle = {
  cormorant400:        loadAssetAsDataUri('fonts/cormorant-garamond-400.woff',        'font/woff'),
  cormorant400Italic:  loadAssetAsDataUri('fonts/cormorant-garamond-400-italic.woff', 'font/woff'),
  cormorant500:        loadAssetAsDataUri('fonts/cormorant-garamond-500.woff',        'font/woff'),
  cormorant600:        loadAssetAsDataUri('fonts/cormorant-garamond-600.woff',        'font/woff'),
  dmsans400:           loadAssetAsDataUri('fonts/dm-sans-400.woff',                   'font/woff'),
  dmsans500:           loadAssetAsDataUri('fonts/dm-sans-500.woff',                   'font/woff'),
  dmsans600:           loadAssetAsDataUri('fonts/dm-sans-600.woff',                   'font/woff'),
  dmsans700:           loadAssetAsDataUri('fonts/dm-sans-700.woff',                   'font/woff'),
}

/**
 * Rehydrate the ApplicantData from a stored applicant_snapshot.
 * submitted_at is stored as ISO string — convert back to Date so the
 * templates that call toLocaleString still work.
 */
function rehydrateApplicant(snapshot: any): ApplicantData {
  return {
    ...snapshot,
    submitted_at: new Date(snapshot.submitted_at),
  } as ApplicantData
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // ── Auth gate: admin only ─────────────────────────────────
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  let action: 'retry' | 'resolve'
  try {
    const body = await req.json()
    action = body?.action
    if (action !== 'retry' && action !== 'resolve') {
      return NextResponse.json(
        { error: "action must be 'retry' or 'resolve'" },
        { status: 400 }
      )
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const db = createServiceClient()

  // Fetch the failure row
  const { data: failure, error: fetchErr } = await db
    .from('email_send_failures')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr || !failure) {
    return NextResponse.json(
      { error: fetchErr?.message || 'Failure row not found' },
      { status: 404 }
    )
  }

  if (failure.resolved_at) {
    return NextResponse.json(
      { error: 'This failure is already resolved' },
      { status: 409 }
    )
  }

  // Resolve staff email for the audit trail (resolved_by)
  let staffEmail = ''
  try {
    const { data: staff } = await db
      .from('staff_users')
      .select('email')
      .eq('id', session.userId)
      .single()
    staffEmail = staff?.email || ''
  } catch {
    // Non-fatal — resolved_by will be empty
  }

  // ── Mark resolved: simple update, no send ─────────────────
  if (action === 'resolve') {
    const { error: updErr } = await db
      .from('email_send_failures')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: staffEmail || null,
      })
      .eq('id', id)

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, resolved: true })
  }

  // ── Retry: re-render and re-send ──────────────────────────
  const payload = failure.payload as any
  const kind = payload?.kind

  if (!payload?.applicant_snapshot) {
    return NextResponse.json(
      { error: 'Failure row has no applicant_snapshot — cannot retry' },
      { status: 422 }
    )
  }

  const applicant = rehydrateApplicant(payload.applicant_snapshot)

  const coordinatorEmail = process.env.COORDINATOR_EMAIL
  const resendKey        = process.env.RESEND_API_KEY
  const fromEmail        = process.env.RESEND_FROM_EMAIL
  const appUrl           = process.env.NEXT_PUBLIC_APP_URL || ''

  if (!resendKey || !fromEmail) {
    return NextResponse.json(
      { error: 'Email environment variables not configured (RESEND_API_KEY / RESEND_FROM_EMAIL)' },
      { status: 500 }
    )
  }

  let sendError: string | null = null

  if (kind === 'apply_notification') {
    if (!coordinatorEmail) {
      return NextResponse.json(
        { error: 'COORDINATOR_EMAIL not configured' },
        { status: 500 }
      )
    }
    const result = await sendApplyNotification({
      applicant,
      coordinatorEmail,
      fromEmail,
      appUrl,
      resendKey,
      logoDataUrl: LOGO_DATA_URI,
      fonts: FONT_BUNDLE,
    })
    if (!result.ok) sendError = result.error
  } else if (kind === 'applicant_confirmation') {
    try {
      const logoUrl = `${appUrl}/branding/vitalis-logo.png`
      const html = renderApplicantConfirmationHtml(applicant, { logoUrl })

      const { Resend } = await import('resend')
      const resend = new Resend(resendKey)

      const sendResult = await resend.emails.send({
        from: fromEmail,
        to: applicant.email,
        reply_to: coordinatorEmail || fromEmail,
        subject: 'Thank you for applying to Vitalis HealthCare',
        html,
      } as any)

      if (sendResult && (sendResult as any).error) {
        sendError = `Resend error: ${JSON.stringify((sendResult as any).error)}`
      }
    } catch (err: any) {
      sendError = err?.message || String(err) || 'Unknown send error'
    }
  } else {
    return NextResponse.json(
      { error: `Unknown payload.kind: ${kind}` },
      { status: 422 }
    )
  }

  const nowIso = new Date().toISOString()

  if (sendError) {
    // Retry failed — bump retry_count, update error, record attempt
    const { error: updErr } = await db
      .from('email_send_failures')
      .update({
        retry_count: (failure.retry_count ?? 0) + 1,
        last_retry_at: nowIso,
        error_message: sendError,
      })
      .eq('id', id)
    if (updErr) {
      console.error('[retry] Failed to update failure row after send error:', updErr)
    }
    return NextResponse.json(
      { error: sendError, retried: true, resolved: false },
      { status: 502 }
    )
  }

  // Retry succeeded — mark resolved
  const { error: updErr } = await db
    .from('email_send_failures')
    .update({
      retry_count: (failure.retry_count ?? 0) + 1,
      last_retry_at: nowIso,
      resolved_at: nowIso,
      resolved_by: staffEmail || null,
    })
    .eq('id', id)

  if (updErr) {
    console.error('[retry] Send succeeded but failed to mark resolved:', updErr)
    return NextResponse.json(
      { error: 'Send succeeded but failed to mark resolved: ' + updErr.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, retried: true, resolved: true })
}
