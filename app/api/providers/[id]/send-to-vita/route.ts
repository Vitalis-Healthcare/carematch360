// ═════════════════════════════════════════════════════════════════════════
// POST /api/providers/[id]/send-to-vita   (v2.7.22)
//
// Staff-triggered push of a provider into Vita as a candidate.
//
// This path is deliberately NOT in PUBLIC_PATHS in middleware.ts — unlike
// /api/webhooks/, which is HMAC-authenticated and must bypass the session
// check, this one is a staff action and stays behind the cookie. Middleware
// only checks that a cm360_session cookie EXISTS though; it never validates it
// or looks at the role, so the real gate is requireAuth() below.
//
// Vita records the link. On success we record our half of it so the button can
// say what happened and link to the candidate.
// ═════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { sendProviderToVita } from '@/lib/vita-outbound'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Coordinators manage providers day to day, so they can send. Providers
    // signing in to their own portal cannot.
    await requireAuth(['admin', 'coordinator'])

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Missing provider id.' }, { status: 400 })

    const db = createServiceClient()

    const { data: provider, error: loadErr } = await db
      .from('providers')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (loadErr) {
      console.error('[send-to-vita] provider load failed:', loadErr.message)
      return NextResponse.json({ error: 'Could not load this provider.' }, { status: 500 })
    }
    if (!provider) return NextResponse.json({ error: 'Provider not found.' }, { status: 404 })

    const result = await sendProviderToVita(provider as Record<string, unknown>)

    if (!result.ok) {
      // Vita's refusals are already written for a human to read — a missing
      // email, a one-word name, an application the candidate has already
      // submitted. Surface them unchanged rather than flattening them into
      // "something went wrong".
      return NextResponse.json(
        { error: result.error || 'Vita rejected the push.' },
        { status: result.status && result.status >= 400 && result.status < 500 ? result.status : 502 },
      )
    }

    // Record our half of the link. A failure here does NOT fail the request:
    // the candidate exists in Vita either way, and reporting failure would
    // invite a coordinator to press the button again chasing a push that
    // already worked.
    const { error: markErr } = await db
      .from('providers')
      .update({
        vita_candidate_id: result.candidate_id ?? null,
        sent_to_vita_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (markErr) {
      console.error('[send-to-vita] could not record the link (push itself succeeded):', markErr.message)
    }

    return NextResponse.json({
      ok: true,
      created: result.created,
      candidate_id: result.candidate_id,
      candidate_url: result.candidate_url,
      fields_filled: result.fields_filled,
      fields_left_alone: result.fields_left_alone,
      link_recorded: !markErr,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Admin or coordinator access required' }, { status: 403 })
    console.error('[send-to-vita] threw:', message)
    return NextResponse.json({ error: 'Unexpected error sending this provider to Vita.' }, { status: 500 })
  }
}
