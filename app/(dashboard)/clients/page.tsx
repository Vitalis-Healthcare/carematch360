export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import ClientsClient from './client'

export type ClientSource = 'vita' | 'axiscare' | 'inquiry' | 'manual'
export type ClientSort   = 'newest' | 'oldest' | 'name'

// Derive how a client entered our system from fields that already exist:
//   - vita_lead_id IS NOT NULL          → imported from a Vita lead (patch_009)
//   - axiscare_id IS NOT NULL           → imported from AxisCare (patch_004)
//   - notes starts with [INQUIRY]       → submitted via getcare.vitalishealthcare.com
//   - otherwise                         → manually added by a coordinator
function detectSource(c: any): ClientSource {
  if (c?.vita_lead_id != null) return 'vita'
  if (c?.axiscare_id != null) return 'axiscare'
  if (typeof c?.notes === 'string' && c.notes.startsWith('[INQUIRY]')) return 'inquiry'
  return 'manual'
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    urgency?: string
    source?: string
    sort?: string
  }>
}) {
  const params = await searchParams
  const db = createServiceClient()
  let clients: any[] = []

  try {
    let q = db.from('clients').select('*')
    if (params.urgency) q = q.eq('urgency_level', params.urgency)
    const { data } = await q
    clients = data ?? []
  } catch {}

  // Search filter (in-memory) — search across name, city, contact, payers
  if (params.search) {
    const s = params.search.toLowerCase()
    clients = clients.filter(c =>
      c.name?.toLowerCase().includes(s) ||
      c.city?.toLowerCase().includes(s) ||
      c.contact_name?.toLowerCase().includes(s) ||
      (Array.isArray(c.payer_types) && c.payer_types.some((p: string) => p?.toLowerCase().includes(s)))
    )
  }

  // Attach derived source so the client component can show badges
  clients = clients.map(c => ({ ...c, _source: detectSource(c) }))

  // Source filter
  const sourceParam = (params.source ?? '') as ClientSource | ''
  if (sourceParam === 'vita' || sourceParam === 'axiscare' || sourceParam === 'inquiry' || sourceParam === 'manual') {
    clients = clients.filter(c => c._source === sourceParam)
  }

  // Sort
  const sort: ClientSort =
    params.sort === 'oldest' ? 'oldest' :
    params.sort === 'name'   ? 'name'   :
    'newest' // default
  clients.sort((a, b) => {
    if (sort === 'name')   return (a.name ?? '').localeCompare(b.name ?? '')
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0
    return sort === 'oldest' ? ta - tb : tb - ta
  })

  return (
    <>
      <PageHeader
        title="Client Database"
        subtitle={`${clients.length} client${clients.length !== 1 ? 's' : ''} on record`}
        breadcrumbs={[{ label: 'Clients' }]}
        actions={<Link href="/clients/new"><button className="btn-primary">+ Add Client</button></Link>}
      />
      <ClientsClient
        clients={clients}
        params={{ ...params, source: sourceParam, sort }}
      />
    </>
  )
}
