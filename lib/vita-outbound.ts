// ═════════════════════════════════════════════════════════════════════════
// CareMatch360 → Vita provider push (v2.7.22)
//
// Sends a signed provider record to Vita's receiver, which turns it into a
// candidate with a pre-filled application draft.
//
// Auth: HMAC-SHA256 over the raw body in X-Carematch-Signature, mirroring the
// scheme lib/carematch-webhook.ts uses in the opposite direction. The secret is
// VITA_OUTBOUND_SECRET here and CAREMATCH_INBOUND_SECRET on the Vita side —
// same value, DELIBERATELY separate from the VITA_WEBHOOK_SECRET pair used for
// inbound leads, so a leak in one direction does not authorise the other.
//
// The payload shape below is mirrored on the Vita side by the CarematchProvider
// interface in lib/carematch-inbound.ts. Change one, change both.
// ═════════════════════════════════════════════════════════════════════════

import { createHmac } from 'node:crypto'

/** Mirrors CarematchProvider in Vita's lib/carematch-inbound.ts. */
export interface VitaProviderPayload {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  gender: string | null
  credential_type: string | null
  additional_credentials: string[] | null
  license_number: string | null
  skills: string[] | null
  preferred_days: string[] | null
  shift_preferences: string[] | null
  years_experience: string | null
  has_car: boolean | null
}

export interface VitaPushResult {
  ok: boolean
  status?: number
  /** Vita's own message, written to be shown to staff verbatim. */
  error?: string
  candidate_id?: string
  candidate_url?: string
  created?: boolean
  fields_filled?: number
  fields_left_alone?: number
}

/**
 * The apply form stores years of experience inside the notes column, behind an
 * "[APPLICATION] Years exp: <value>" prefix. stripNotesPrefix() in
 * lib/email/types.ts returns everything AFTER that line; this pulls out the
 * value itself.
 *
 * Providers added through the admin form have no prefix and simply return null
 * — Vita leaves the field blank rather than guessing.
 */
export function extractYearsExperience(notes: string | null | undefined): string | null {
  if (!notes) return null
  const match = notes.match(/^\[APPLICATION\] Years exp: ([^\n]*)/)
  const value = match?.[1]?.trim()
  return value ? value : null
}

function nullIfEmpty(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function asArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)).filter(Boolean) : []
}

/**
 * Build the wire payload from a providers row.
 *
 * `has_car` is sent as the boolean column AND left in `skills` if the chip is
 * there, because the two are maintained in sync and Vita accepts either signal.
 * Nothing here is invented: a column CareMatch360 does not hold arrives as null
 * and Vita leaves the corresponding field blank for the candidate to answer.
 */
export function buildProviderPayload(p: Record<string, unknown>): VitaProviderPayload {
  return {
    id:                     String(p.id ?? ''),
    name:                   String(p.name ?? ''),
    email:                  nullIfEmpty(p.email),
    phone:                  nullIfEmpty(p.phone),
    address:                nullIfEmpty(p.address),
    city:                   nullIfEmpty(p.city),
    state:                  nullIfEmpty(p.state),
    zip:                    nullIfEmpty(p.zip),
    gender:                 nullIfEmpty(p.gender),
    credential_type:        nullIfEmpty(p.credential_type),
    additional_credentials: asArray(p.additional_credentials),
    license_number:         nullIfEmpty(p.license_number),
    skills:                 asArray(p.skills),
    preferred_days:         asArray(p.preferred_days),
    shift_preferences:      asArray(p.shift_preferences),
    years_experience:       extractYearsExperience(p.notes as string | null),
    has_car:                p.has_car === true,
  }
}

/**
 * Sign and POST the provider to Vita.
 *
 * The signature covers the exact bytes sent, so the body is serialised once and
 * that same string is both hashed and posted. Re-serialising would change the
 * bytes and the far side would reject it.
 */
export async function sendProviderToVita(p: Record<string, unknown>): Promise<VitaPushResult> {
  const url = process.env.VITA_OUTBOUND_URL
  const secret = process.env.VITA_OUTBOUND_SECRET

  if (!url || !secret) {
    console.error('[vita-push] VITA_OUTBOUND_URL or VITA_OUTBOUND_SECRET is not set')
    return { ok: false, error: 'The Vita connection is not configured yet. Ask an administrator to set VITA_OUTBOUND_URL and VITA_OUTBOUND_SECRET.' }
  }

  const envelope = {
    event: 'provider.pushed',
    provider: buildProviderPayload(p),
    // Vita refuses anything more than five minutes old, so this must be the
    // real send time, not a value carried from earlier in the request.
    sent_at: new Date().toISOString(),
  }

  const rawBody = JSON.stringify(envelope)
  const signature = createHmac('sha256', secret).update(rawBody).digest('hex')

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Carematch-Signature': `sha256=${signature}`,
        'X-Carematch-Event': 'provider.pushed',
      },
      body: rawBody,
    })

    let body: Record<string, unknown> = {}
    try { body = await res.json() } catch { /* Vita always sends JSON; an empty body is handled below. */ }

    if (!res.ok || body.ok !== true) {
      // Vita's 422 and 409 messages are written in plain English for staff.
      // Pass them straight through rather than replacing them with our own.
      const message = typeof body.error === 'string' && body.error
        ? body.error
        : `Vita rejected the push (HTTP ${res.status}).`
      console.error('[vita-push] rejected:', res.status, message)
      return { ok: false, status: res.status, error: message }
    }

    return {
      ok: true,
      status: res.status,
      candidate_id:      typeof body.candidate_id === 'string' ? body.candidate_id : undefined,
      candidate_url:     typeof body.candidate_url === 'string' ? body.candidate_url : undefined,
      created:           body.created === true,
      fields_filled:     typeof body.fields_filled === 'number' ? body.fields_filled : undefined,
      fields_left_alone: typeof body.fields_left_alone === 'number' ? body.fields_left_alone : undefined,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[vita-push] threw:', message)
    return { ok: false, error: 'Could not reach Vita. Please try again in a moment.' }
  }
}
