export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import ClientForm from '@/components/ClientForm'
import Link from 'next/link'
export default async function ClientDetailPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const db=createServiceClient()
  let client:any=null, cases:any[]=[]
  try { const {data}=await db.from('clients').select('*').eq('id',id).single(); client=data } catch {}
  if(!client) notFound()
  try { const {data}=await db.from('cases').select('id,title,status,urgency,visit_date,assigned_provider_id,providers(name,credential_type)').eq('client_id',id).order('created_at',{ascending:false}); cases=data??[] } catch {}
  return (
    <>
      <PageHeader title={client.name} subtitle={[client.city,client.state].filter(Boolean).join(', ')||'Client record'}
        breadcrumbs={[{label:'Clients',href:'/clients'},{label:client.name}]}
        actions={<div style={{display:'flex',gap:8}}><StatusBadge label={client.urgency_level} status={client.urgency_level}/><Link href={`/cases/new?client_id=${client.id}`}><button className="btn-teal">+ Open Case</button></Link></div>}/>
      <div style={{padding:'28px 32px'}}>
        <ClientForm client={client} mode="edit"/>
        {cases.length>0&&(
          <div className="card" style={{marginTop:20,padding:'20px 24px'}}>
            <div style={{fontWeight:600,fontSize:14,marginBottom:16}}>Case History</div>
            <table className="data-table"><thead><tr><th>Case</th><th>Visit Date</th><th>Assigned Provider</th><th>Urgency</th><th>Status</th><th></th></tr></thead>
            <tbody>{cases.map((c:any)=>{const prov=Array.isArray(c.providers)?c.providers[0]:c.providers;return(
              <tr key={c.id}>
                <td style={{fontWeight:500}}>{c.title}</td>
                <td style={{color:'var(--muted)',fontSize:13}}>{c.visit_date?new Date(c.visit_date).toLocaleDateString():'—'}</td>
                <td style={{fontSize:13}}>{prov?`${prov.name} (${prov.credential_type})`:<span style={{color:'var(--subtle)'}}>Unassigned</span>}</td>
                <td><StatusBadge label={c.urgency} status={c.urgency} size="sm"/></td>
                <td><StatusBadge label={c.status} status={c.status} size="sm"/></td>
                <td><Link href={`/cases/${c.id}`}><button className="btn-secondary" style={{padding:'5px 12px',fontSize:12}}>View →</button></Link></td>
              </tr>
            )})}</tbody></table>
          </div>
        )}
      </div>
    </>
  )
}
