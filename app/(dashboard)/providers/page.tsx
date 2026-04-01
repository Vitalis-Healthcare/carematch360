export const dynamic = 'force-dynamic'
import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProvidersClient from './client'
import { CREDENTIAL_LABELS, CREDENTIAL_TYPES } from '@/types'

export default async function ProvidersPage({
  searchParams,
}: {
  searchParams: Promise<{ credential?: string; search?: string; available?: string; status?: string }>
}) {
  const params = await searchParams
  const db = createServiceClient()
  let providers: any[] = []

  try {
    let q = db.from('providers').select('*').order('name')
    if (params.credential) q = q.eq('credential_type', params.credential)
    if (params.available === '1') q = q.eq('available', true).eq('status', 'active')
    if (params.status === 'inactive') q = q.eq('status', 'inactive')
    const { data } = await q
    providers = data ?? []
  } catch {}

  if (params.search) {
    const s = params.search.toLowerCase()
    providers = providers.filter(p =>
      p.name?.toLowerCase().includes(s) || p.email?.toLowerCase().includes(s) || p.city?.toLowerCase().includes(s)
    )
  }

  const inactiveCount = providers.filter(p => p.status === 'inactive').length
  const activeCount = providers.filter(p => p.status === 'active').length

  return (
    <ProvidersClient
      providers={providers}
      inactiveCount={inactiveCount}
      activeCount={activeCount}
      params={params}
      credentialTypes={CREDENTIAL_TYPES}
      credentialLabels={CREDENTIAL_LABELS}
    />
  )
}
