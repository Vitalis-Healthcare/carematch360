export const dynamic = 'force-dynamic'
import { createServiceClient } from '@/lib/supabase/server'
import NetworkMapV2 from '@/components/NetworkMapV2'

export default async function MapV2Page() {
  const db = createServiceClient()
  let providers: any[] = []
  let clients: any[] = []
  let cases: any[] = []

  try {
    const { data } = await db.from('providers')
      .select('id,name,credential_type,skills,city,state,lat,lng,service_radius_miles,available,status,phone,email')
      .eq('status', 'active').order('name')
    providers = data ?? []
  } catch {}

  try {
    const { data } = await db.from('clients')
      .select('id,name,required_credential,required_skills,urgency_level,city,state,lat,lng,payer_types,status')
      .eq('status', 'active').order('name')
    clients = data ?? []
  } catch {}

  try {
    const { data } = await db.from('cases')
      .select('id,title,required_credential,required_skills,urgency,status,client_id,clients(id,name,lat,lng,city,state)')
      .in('status', ['open','matching'])
      .order('created_at', { ascending: false })
      .limit(50)
    cases = data ?? []
  } catch {}

  return <NetworkMapV2 providers={providers} clients={clients} cases={cases} />
}
