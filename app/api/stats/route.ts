import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────────────────────────────────
// GET /api/stats  (v2.7.23)
//
// Read-only aggregate counts for the Vitalis Portal "Thursday Brief".
//
// This endpoint exists because Vita has NO database access to CareMatch360 —
// the only links between the two systems are push webhooks in each direction.
// Rather than hand Vita a second Supabase service key (which would couple the
// two projects at the credential level), CareMatch360 publishes its own
// aggregate and Vita reads it over HTTP with a shared secret.
//
// THREE RULES, all deliberate:
//
//   1. COUNTS ONLY. No names, no emails, no phone numbers, no ids, no free
//      text. Nothing that leaves this file can identify a provider or a
//      client. This is a system boundary, so PII does not cross it — not
//      "is filtered later", does not cross it at all.
//
//   2. STATUS VOCABULARIES ARE TALLIED, NOT ASSUMED. `providers.status` and
//      `cases.status` are counted by reading what is actually in the column.
//      If a new status is added to either CHECK constraint tomorrow, this
//      endpoint reports it without a code change and without silently
//      dropping those rows into nothing.
//
//   3. A METRIC THAT CANNOT BE COMPUTED IS REPORTED AS `null` WITH A WARNING,
//      NEVER AS ZERO. The Brief prints these numbers to the whole team. A
//      zero that actually means "the query failed" is worse than a visible
//      gap, because nobody goes looking for it.
//
// Auth: Authorization: Bearer ${VITA_STATS_SECRET}
// Public path: '/api/stats' must be listed in middleware.ts PUBLIC_PATHS or
// the session-cookie check redirects it to /login as HTML.
// ─────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

// Supabase caps a single select at 1000 rows. Page rather than truncate —
// a silently short read here becomes a wrong number in a report the team
// is told to act on.
const PAGE_SIZE = 1000
const MAX_PAGES = 50 // 50,000 rows; far beyond any realistic size for these tables

interface PagedResult<T> {
  rows: T[]
  ok: boolean
  warning: string | null
}

async function readAll<T>(
  db: ReturnType<typeof createServiceClient>,
  table: string,
  columns: string
): Promise<PagedResult<T>> {
  const rows: T[] = []
  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, error } = await db.from(table).select(columns).range(from, to)
      if (error) {
        return { rows: [], ok: false, warning: table + ': ' + error.message }
      }
      const batch = (data || []) as unknown as T[]
      for (let i = 0; i < batch.length; i++) rows.push(batch[i])
      if (batch.length < PAGE_SIZE) break
      if (page === MAX_PAGES - 1) {
        return {
          rows: rows,
          ok: false,
          warning: table + ': more than ' + MAX_PAGES * PAGE_SIZE + ' rows; counts are truncated',
        }
      }
    }
    return { rows: rows, ok: true, warning: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { rows: [], ok: false, warning: table + ': ' + msg }
  }
}

function tally(values: Array<string | null | undefined>): Record<string, number> {
  const out: Record<string, number> = {}
  for (let i = 0; i < values.length; i++) {
    const key = values[i] == null || values[i] === '' ? 'unspecified' : String(values[i])
    out[key] = (out[key] || 0) + 1
  }
  return out
}

/** Inclusive of `since`, exclusive of `until` — the same convention the Brief
 *  uses for its Thursday-to-Wednesday window, so the two never double-count a
 *  boundary day.
 *
 *  Compared as epoch milliseconds, NOT as strings. PostgREST renders
 *  timestamptz as `2026-07-23T14:22:00.123456+00:00` while the window bounds
 *  are built by `toISOString()` as `2026-07-23T14:22:00.123Z`. Those two
 *  spellings of the same instant do not compare correctly with `<`, and the
 *  failure is silent — a count that is quietly a few rows short. */
function inWindow(ts: string | null | undefined, sinceMs: number, untilMs: number): boolean {
  if (!ts) return false
  const t = Date.parse(ts)
  if (isNaN(t)) return false
  return t >= sinceMs && t < untilMs
}

function bad(status: number, message: string) {
  return NextResponse.json({ error: message }, { status: status })
}

interface ProviderRow {
  status: string | null
  credential_type: string | null
  state: string | null
  available: boolean | null
  sms_consent: boolean | null
  sent_to_vita_at: string | null
  vita_candidate_id: string | null
  created_at: string | null
}

interface CaseRow {
  status: string | null
}

interface CaseRowDated {
  status: string | null
  created_at: string | null
}

export async function GET(req: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────────────────
  const secret = process.env.VITA_STATS_SECRET
  if (!secret) {
    // 503 rather than 401: the caller's credentials are not the problem, the
    // server is not configured. A 401 here sends whoever is debugging off
    // hunting for a bad token that was fine all along.
    return bad(503, 'VITA_STATS_SECRET is not configured on this deployment')
  }

  const header = req.headers.get('authorization') || ''
  const provided = header.startsWith('Bearer ') ? header.slice(7) : ''
  const a = Buffer.from(provided)
  const b = Buffer.from(secret)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return bad(401, 'Unauthorized')
  }

  // ── Window ─────────────────────────────────────────────────────────────
  // Vita passes its Thursday-to-Wednesday window explicitly. The default is
  // only a convenience for a manual curl.
  const url = new URL(req.url)
  const untilParam = url.searchParams.get('until')
  const sinceParam = url.searchParams.get('since')

  const until = untilParam ? new Date(untilParam) : new Date()
  if (isNaN(until.getTime())) return bad(400, 'until is not a valid date')

  const since = sinceParam
    ? new Date(sinceParam)
    : new Date(until.getTime() - 7 * 86400000)
  if (isNaN(since.getTime())) return bad(400, 'since is not a valid date')
  if (since >= until) return bad(400, 'since must be earlier than until')

  const sinceIso = since.toISOString()
  const untilIso = until.toISOString()
  const sinceMs = since.getTime()
  const untilMs = until.getTime()

  const db = createServiceClient()
  const warnings: string[] = []

  // ── Providers ──────────────────────────────────────────────────────────
  const provCols =
    'status, credential_type, state, available, sms_consent, sent_to_vita_at, vita_candidate_id, created_at'
  const prov = await readAll<ProviderRow>(db, 'providers', provCols)
  if (prov.warning) warnings.push(prov.warning)

  const providers = prov.ok
    ? (function () {
        const rows = prov.rows
        let available = 0
        let smsConsent = 0
        let sentToVita = 0
        let linkedToVita = 0
        let newInWindow = 0
        const statusVals: Array<string | null> = []
        const credVals: Array<string | null> = []
        const stateVals: Array<string | null> = []

        for (let i = 0; i < rows.length; i++) {
          const r = rows[i]
          statusVals.push(r.status)
          credVals.push(r.credential_type)
          stateVals.push(r.state)
          if (r.available === true) available++
          if (r.sms_consent === true) smsConsent++
          if (r.sent_to_vita_at) sentToVita++
          if (r.vita_candidate_id) linkedToVita++
          if (inWindow(r.created_at, sinceMs, untilMs)) newInWindow++
        }

        return {
          total: rows.length,
          by_status: tally(statusVals),
          by_credential: tally(credVals),
          by_state: tally(stateVals),
          available: available,
          sms_consent: smsConsent,
          sent_to_vita: sentToVita,
          linked_to_vita: linkedToVita,
          new_in_window: newInWindow,
        }
      })()
    : null

  // ── Cases ──────────────────────────────────────────────────────────────
  // `cases.created_at` is not documented in the schema reference, so it is
  // attempted separately. If the column is absent the status tally still
  // works and only `new_in_window` degrades to null.
  const casesDated = await readAll<CaseRowDated>(db, 'cases', 'status, created_at')

  let cases: Record<string, unknown> | null = null

  if (casesDated.ok) {
    const rows = casesDated.rows
    let newInWindow = 0
    const statusVals: Array<string | null> = []
    for (let i = 0; i < rows.length; i++) {
      statusVals.push(rows[i].status)
      if (inWindow(rows[i].created_at, sinceMs, untilMs)) newInWindow++
    }
    cases = {
      total: rows.length,
      by_status: tally(statusVals),
      new_in_window: newInWindow,
    }
  } else {
    // Retry without created_at before giving up on the whole table.
    const casesPlain = await readAll<CaseRow>(db, 'cases', 'status')
    if (casesPlain.ok) {
      const statusVals: Array<string | null> = []
      for (let i = 0; i < casesPlain.rows.length; i++) statusVals.push(casesPlain.rows[i].status)
      cases = {
        total: casesPlain.rows.length,
        by_status: tally(statusVals),
        new_in_window: null,
      }
      warnings.push(
        'cases.new_in_window unavailable (created_at could not be read); status counts are complete'
      )
    } else {
      if (casesPlain.warning) warnings.push(casesPlain.warning)
    }
  }

  if (!providers) {
    warnings.push('providers aggregate unavailable')
  }

  return NextResponse.json({
    source: 'carematch360',
    version: 'v2.7.23',
    generated_at: new Date().toISOString(),
    window: { since: sinceIso, until: untilIso },
    providers: providers,
    cases: cases,
    warnings: warnings,
  })
}
