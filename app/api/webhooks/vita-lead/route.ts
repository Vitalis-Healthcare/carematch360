import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import {
  VitaLeadPayload,
  buildClientPayload,
  buildCasePayload,
} from '@/lib/vita-mapping'

// ─────────────────────────────────────────────────────────────────────────
// POST /api/webhooks/vita-lead
//
// Receives lead lifecycle events from Vitalis Portal (Vita) and turns
// them into draft cases on the CareMatch360 side. Authenticated via
// HMAC-SHA256 signature in the X-Vita-Signature header.
//
// Event types accepted:
//   - lead.created   create draft client + case (status='lead')
//   - lead.updated   refresh client + case fields, keep status
//   - lead.won       flip case status from 'lead' to 'open'
//   - lead.lost      flip case status to 'cancelled'
//   - lead.cancelled flip case status to 'cancelled'
//
// We never delete data on this endpoint — even a 'lost' lead just
// flips the status, so historical pre-matching work is preserved.
// ─────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

interface WebhookEnvelope {
  event: string                  // e.g. 'lead.created'
  lead:  VitaLeadPayload         // the full lead state at the time of the event
  previous_status?: string       // for status-change events
  sent_at: string                // ISO timestamp from sender
}

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false
  // Accept either "sha256=<hex>" or just "<hex>" — we send with the prefix.
  const provided = signature.startsWith('sha256=') ? signature.slice(7) : signature
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')

  // timingSafeEqual requires equal-length buffers
  if (provided.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. Verify HMAC ──────────────────────────────────────────────────
    const secret = process.env.VITA_WEBHOOK_SECRET
    if (!secret) {
      console.error('vita-lead webhook: VITA_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const rawBody = await req.text()
    const signature = req.headers.get('x-vita-signature')
    if (!verifySignature(rawBody, signature, secret)) {
      console.warn('vita-lead webhook: invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const envelope = JSON.parse(rawBody) as WebhookEnvelope
    if (!envelope?.event || !envelope?.lead?.id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const lead = envelope.lead
    const db = createServiceClient()

    // ── 2. Upsert client ────────────────────────────────────────────────
    // Try to find an existing client by vita_lead_id; if found, update,
    // otherwise insert.
    const clientPayload = buildClientPayload(lead)

    const { data: existingClient } = await db
      .from('clients')
      .select('id')
      .eq('vita_lead_id', lead.id)
      .maybeSingle()

    let clientId: string
    if (existingClient?.id) {
      const { error: updErr } = await db
        .from('clients')
        .update({ ...clientPayload, updated_at: new Date().toISOString() })
        .eq('id', existingClient.id)
      if (updErr) {
        console.error('vita-lead webhook: client update failed', updErr)
        return NextResponse.json({ error: `Client update failed: ${updErr.message}` }, { status: 500 })
      }
      clientId = existingClient.id
    } else {
      const { data: newClient, error: insErr } = await db
        .from('clients')
        .insert(clientPayload)
        .select('id')
        .single()
      if (insErr || !newClient) {
        console.error('vita-lead webhook: client insert failed', insErr)
        return NextResponse.json({ error: `Client insert failed: ${insErr?.message}` }, { status: 500 })
      }
      clientId = newClient.id
    }

    // ── 3. Upsert case ──────────────────────────────────────────────────
    const { data: existingCase } = await db
      .from('cases')
      .select('id, status, allow_pre_dispatch')
      .eq('vita_lead_id', lead.id)
      .maybeSingle()

    // Determine target status based on event type. Status-changing events
    // override whatever the lead.status field says, since we always trust
    // the explicit event semantics over the field state.
    const eventType = envelope.event
    let targetStatus: string | null = null
    if (eventType === 'lead.won')              targetStatus = 'open'
    else if (eventType === 'lead.lost')        targetStatus = 'cancelled'
    else if (eventType === 'lead.cancelled')   targetStatus = 'cancelled'
    // For lead.created and lead.updated, we leave existing case status alone
    // (so a case that's already been converted to 'open' doesn't get knocked
    // back to 'lead' by an unrelated lead update from Vita)

    const casePayload = buildCasePayload(lead, clientId)

    if (existingCase?.id) {
      // Build update — preserve existing status unless we're explicitly
      // changing it, and preserve the coordinator's allow_pre_dispatch flag.
      const updateFields: any = {
        ...casePayload,
        updated_at: new Date().toISOString(),
        allow_pre_dispatch: existingCase.allow_pre_dispatch, // preserve coordinator override
      }
      if (targetStatus) {
        updateFields.status = targetStatus
      } else {
        // Don't downgrade an already-converted case back to 'lead'
        if (existingCase.status !== 'lead') {
          delete updateFields.status
        }
      }

      const { error: updErr } = await db
        .from('cases')
        .update(updateFields)
        .eq('id', existingCase.id)
      if (updErr) {
        console.error('vita-lead webhook: case update failed', updErr)
        return NextResponse.json({ error: `Case update failed: ${updErr.message}` }, { status: 500 })
      }
      return NextResponse.json({
        ok: true,
        action: 'updated',
        case_id: existingCase.id,
        client_id: clientId,
        new_status: updateFields.status ?? existingCase.status,
      })
    } else {
      // New case — apply targetStatus override if this is a status-change
      // event for a lead we somehow never imported as 'created' first.
      if (targetStatus) casePayload.status = targetStatus

      const { data: newCase, error: insErr } = await db
        .from('cases')
        .insert(casePayload)
        .select('id, status')
        .single()
      if (insErr || !newCase) {
        console.error('vita-lead webhook: case insert failed', insErr)
        return NextResponse.json({ error: `Case insert failed: ${insErr?.message}` }, { status: 500 })
      }
      return NextResponse.json({
        ok: true,
        action: 'created',
        case_id: newCase.id,
        client_id: clientId,
        new_status: newCase.status,
      })
    }
  } catch (err: any) {
    console.error('vita-lead webhook error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Health check — Vita can ping this to verify connectivity + secret
export async function GET() {
  const hasSecret = !!process.env.VITA_WEBHOOK_SECRET
  return NextResponse.json({
    ok: true,
    endpoint: '/api/webhooks/vita-lead',
    secret_configured: hasSecret,
  })
}
