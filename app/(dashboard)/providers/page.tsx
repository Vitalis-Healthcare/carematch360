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
  }>
}) {
  const params = await searchParams
  const db = createServiceClient()
  let providers: any[] = []

  try {
    // We pull everything and let JS handle source filter + sort, since
    // `source` is derived rather than stored. With the current network
    // size (~440 providers) this is comfortably fast.
    let q = db.from('providers').select('*')
    if (params.credential)         q = q.eq('credential_type', params.credential)
    if (params.available === '1')  q = q.eq('available', true).eq('status', 'active')
    if (params.status === 'inactive') q = q.eq('status', 'inactive')
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
    />
  )
}
