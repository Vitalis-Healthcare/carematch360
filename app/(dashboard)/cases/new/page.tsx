export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import CaseForm from '@/components/CaseForm'
export default async function NewCasePage({searchParams}:{searchParams:Promise<{client_id?:string}>}) {
  const params=await searchParams; const db=createServiceClient()
  let clients:any[]=[]
  try { const {data}=await db.from('clients').select('id,name,required_credential,required_skills,urgency_level,city,state').eq('status','active').order('name'); clients=data??[] } catch {}
  const preselectedClient=params.client_id?clients.find(c=>c.id===params.client_id)??null:null
  return (
    <>
      <PageHeader title="New Case" subtitle="Define the case requirements and run the matching engine" breadcrumbs={[{label:'Cases',href:'/cases'},{label:'New Case'}]}/>
      <CaseForm mode="new" clients={clients} preselectedClient={preselectedClient}/>
    </>
  )
}
