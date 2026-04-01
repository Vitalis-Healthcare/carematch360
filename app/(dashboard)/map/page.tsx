export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import NetworkMapClient from '@/components/NetworkMapClient'

export default async function MapPage() {
  const db = createServiceClient()
  let providers: any[] = []
  let clients: any[] = []
  let cases: any[] = []

  try {
    const { data } = await db
      .from('providers')
      .select('id,name,credential_type,skills,city,state,address,lat,lng,service_radius_miles,available,status,phone,email')
      .eq('status', 'active')
      .order('name')
    providers = data ?? []
  } catch {}

  try {
    const { data } = await db
      .from('clients')
      .select('id,name,required_credential,required_skills,urgency_level,city,state,address,lat,lng,payer_type,status')
      .eq('status', 'active')
      .order('name')
    clients = data ?? []
  } catch {}

  try {
    const { data } = await db
      .from('cases')
      .select('id,title,required_credential,required_skills,urgency,status,client_id,clients(id,name,lat,lng,city,state)')
      .in('status', ['open','matching'])
      .order('created_at', { ascending: false })
      .limit(50)
    cases = data ?? []
  } catch {}

  const mapped = providers.filter(p => p.lat != null).length
  const unmapped = providers.filter(p => p.lat == null).length

  return (
    <>
      <PageHeader
        title="Network Map"
        subtitle={`${mapped} mapped providers · ${clients.length} clients · ${cases.length} open cases`}
        breadcrumbs={[{ label: 'Network Map' }]}
      />
      <div style={{ padding: '20px 28px' }}>
        <NetworkMapClient
          providers={providers}
          clients={clients}
          cases={cases}
        />
      </div>
    </>
  )
}
