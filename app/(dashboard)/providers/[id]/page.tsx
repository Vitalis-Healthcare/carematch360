export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import ProviderForm from '@/components/ProviderForm'
import { CREDENTIAL_LABELS, CredentialType } from '@/types'
export default async function ProviderDetailPage({params}:{params:Promise<{id:string}>}) {
  const {id} = await params
  const db = createServiceClient()
  let provider:any=null, matchHistory:any[]=[]
  try { const {data}=await db.from('providers').select('*').eq('id',id).single(); provider=data } catch {}
  if(!provider) notFound()
  try { const {data}=await db.from('case_matches').select('*,cases(id,title,status,urgency,visit_date)').eq('provider_id',id).order('created_at',{ascending:false}).limit(10); matchHistory=data??[] } catch {}
  return (
    <>
      <PageHeader title={provider.name} subtitle={`${provider.credential_type} · ${CREDENTIAL_LABELS[provider.credential_type as CredentialType]}`}
        breadcrumbs={[{label:'Providers',href:'/providers'},{label:provider.name}]}
        actions={<div style={{display:'flex',gap:8,alignItems:'center'}}><StatusBadge label={provider.status} status={provider.status}/>{provider.available&&provider.status==='active'&&<StatusBadge label="Available" status="active"/>}</div>}/>
      <div style={{padding:'28px 32px'}}>
        <ProviderForm provider={provider} mode="edit"/>
        {matchHistory.length>0&&(
          <div className="card" style={{marginTop:20,padding:'20px 24px'}}>
            <div style={{fontWeight:600,fontSize:14,marginBottom:16}}>Match History</div>
            <table className="data-table"><thead><tr><th>Case</th><th>Score</th><th>Distance</th><th>Response</th></tr></thead>
            <tbody>{matchHistory.map((m:any)=>{const c=Array.isArray(m.cases)?m.cases[0]:m.cases;return(
              <tr key={m.id}>
                <td style={{fontWeight:500}}>{c?.title??'—'}</td>
                <td><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:80,height:6,background:'var(--border)',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${m.match_score}%`,background:m.match_score>=80?'var(--green)':m.match_score>=60?'var(--amber)':'var(--red)',borderRadius:3}}/></div><span style={{fontFamily:'var(--mono)',fontSize:12}}>{m.match_score}</span></div></td>
                <td style={{fontFamily:'var(--mono)',fontSize:13}}>{m.distance_miles?`${Number(m.distance_miles).toFixed(1)} mi`:'—'}</td>
                <td><StatusBadge label={m.status} status={m.status} size="sm"/></td>
              </tr>
            )})}</tbody></table>
          </div>
        )}
      </div>
    </>
  )
}
