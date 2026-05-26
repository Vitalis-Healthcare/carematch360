export const dynamic = 'force-dynamic'
import { createServiceClient } from '@/lib/supabase/server'
import ProvidersClient from './client'
import { CREDENTIAL_LABELS, CREDENTIAL_TYPES } from '@/types'

export type ProviderSource = 'axiscare' | 'application' | 'manual'
export type ProviderSort   = 'newest' | 'oldest' | 'name'

// Derive how a provider entered our system from fields that already exist:
//   - axiscare_id IS NOT NULL  → imported from AxisCare
//   - notes starts with [APPLICATION] → submitted via apply.vitalishealthcare.com
//   - otherwise                → manually added by a coordinator
function detectSource(p: any): ProviderSource {
  if (p?.axiscare_id != null) return 'axiscare'
  if (typeof p?.notes === 'string' && p.notes.startsWith('[APPLICATION]')) return 'application'
  return 'manual'
}

// Comma-separated multi-select param → string[]. Empty values dropped.
function splitCsv(v?: string): string[] {
  if (!v) return []
  return v.split(',').map(s => s.trim()).filter(Boolean)
}

export default async function ProvidersPage({
  searchParams,
}: {
  searchParams: Promise<{
    credential?: string
    search?: string
    available?: string
    status?: string
    source?: string
    sort?: string
    // v2.7.18 — new multi-dimension filters
    gender?: string   // CSV: 'male,female,non_binary,unspecified'
    city?: string     // single string, exact match
    skills?: string   // CSV of canonical display strings (URL-encoded)
    shifts?: string   // CSV: 'morning,afternoon,evening,overnight'
    days?: string     // CSV: 'Monday,Tuesday,…,Sunday'
  }>
}) {
  const params = await searchParams
  const db = createServiceClient()

  // Parse multi-select params once
  const genderList = splitCsv(params.gender)
  const skillsList = splitCsv(params.skills)
  const shiftList  = splitCsv(params.shifts)
  const dayList    = splitCsv(params.days)

  // City dropdown is populated from the FULL provider set so that the
  // list of available cities does not shrink as other filters narrow
  // the result. Pulled in a separate small query to keep this stable.
  let cities: string[] = []
  try {
    const { data: cityRows } = await db
      .from('providers')
      .select('city')
      .not('city', 'is', null)
      .neq('city', '')
    const cityList: string[] = []
    for (const r of cityRows ?? []) {
      const c = (r?.city as string | null | undefined)?.trim()
      if (c) cityList.push(c)
    }
    cities = Array.from(new Set(cityList)).sort()
  } catch {}

  let providers: any[] = []

  try {
    // Push every indexable filter down to Postgres. With 500+ providers
    // and growing, we no longer want to pull everything and filter in JS.
    // `source` stays JS-side because it is derived from axiscare_id / notes.
    // `search` stays JS-side to preserve the existing OR-across-fields
    // behaviour (name OR email OR city).
    let q = db.from('providers').select('*')
    if (params.credential)            q = q.eq('credential_type', params.credential)
    if (params.available === '1')     q = q.eq('available', true).eq('status', 'active')
    if (params.status === 'inactive') q = q.eq('status', 'inactive')

    // v2.7.18 — new filters
    if (genderList.length) q = q.in('gender', genderList)
    if (params.city)       q = q.eq('city', params.city)
    if (skillsList.length) q = q.contains('skills', skillsList)        // ALL must be present (@>)
    if (shiftList.length)  q = q.overlaps('shift_preferences', shiftList) // ANY overlap (&&)
    if (dayList.length)    q = q.overlaps('preferred_days', dayList)      // ANY overlap (&&)

    const { data } = await q
    providers = data ?? []
  } catch {}

  // Search filter (in-memory, same pattern as before)
  if (params.search) {
    const s = params.search.toLowerCase()
    providers = providers.filter(p =>
      p.name?.toLowerCase().includes(s) ||
      p.email?.toLowerCase().includes(s) ||
      p.city?.toLowerCase().includes(s)
    )
  }

  // Attach derived source so the client can show badges without re-deriving.
  providers = providers.map(p => ({ ...p, _source: detectSource(p) }))

  // Source filter
  const sourceParam = (params.source ?? '') as ProviderSource | ''
  if (sourceParam === 'axiscare' || sourceParam === 'application' || sourceParam === 'manual') {
    providers = providers.filter(p => p._source === sourceParam)
  }

  // Sort
  const sort: ProviderSort =
    params.sort === 'newest' ? 'newest' :
    params.sort === 'oldest' ? 'oldest' :
    params.sort === 'name'   ? 'name'   :
    'newest' // default to newest first now that we have the column
  providers.sort((a, b) => {
    if (sort === 'name')   return (a.name ?? '').localeCompare(b.name ?? '')
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0
    return sort === 'oldest' ? ta - tb : tb - ta
  })

  const inactiveCount = providers.filter(p => p.status === 'inactive').length
  const activeCount   = providers.filter(p => p.status === 'active').length

  return (
    <ProvidersClient
      providers={providers}
      inactiveCount={inactiveCount}
      activeCount={activeCount}
      params={{ ...params, source: sourceParam, sort }}
      credentialTypes={CREDENTIAL_TYPES}
      credentialLabels={CREDENTIAL_LABELS}
      cities={cities}
    />
  )
}
