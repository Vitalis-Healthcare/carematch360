export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import Link from 'next/link'
export default async function ClientsPage({searchParams}:{searchParams:Promise<{search?:string;urgency?:string}>}) {
  const params = await searchParams
  const db = createServiceClient()
  let clients:any[]=[]
  try {
    let q=db.from('clients').select('*').order('name')
    if(params.urgency) q=q.eq('urgency_level',params.urgency)
    const {data}=await q; clients=data??[]
  } catch {}
  if(params.search){const s=params.search.toLowerCase();clients=clients.filter(c=>c.name?.toLowerCase().includes(s)||c.city?.toLowerCase().includes(s)||c.payer_type?.toLowerCase().includes(s))}
  return (
    <>
      <PageHeader title="Client Database" subtitle={`${clients.length} client${clients.length!==1?'s':''} on record`} breadcrumbs={[{label:'Clients'}]}
        actions={<Link href="/clients/new"><button className="btn-primary">+ Add Client</button></Link>}/>
      <div className="page-body">
        <div className="card" style={{padding:'14px 20px',marginBottom:20}}>
          <form style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
            <input className="form-input" name="search" placeholder="Search by name, city, payer..." defaultValue={params.search} style={{maxWidth:280}}/>
            <select className="form-select" name="urgency" defaultValue={params.urgency} style={{maxWidth:180}}>
              <option value="">All urgency levels</option>
              <option value="routine">Routine</option><option value="urgent">Urgent</option><option value="emergency">Emergency</option>
            </select>
            <button type="submit" className="btn-secondary">Filter</button>
            <Link href="/clients"><button type="button" className="btn-secondary" style={{color:'var(--muted)'}}>Clear</button></Link>
          </form>
        </div>
        <div className="card" style={{overflow:'hidden'}}>
          {clients.length===0?(
            <div style={{padding:'48px',textAlign:'center',color:'var(--muted)'}}>
              <div style={{fontSize:32,marginBottom:12}}>⊙</div>
              <div style={{fontWeight:500,marginBottom:6}}>No clients found</div>
              <Link href="/clients/new"><button className="btn-primary" style={{marginTop:16}}>+ Add Client</button></Link>
            </div>
          ):(
            <table className="data-table"><thead><tr><th>Client</th><th>Location</th><th>Required Credential</th><th>Payer</th><th>Urgency</th><th>Status</th><th></th></tr></thead>
            <tbody>{clients.map(c=>(
              <tr key={c.id}>
                <td><div style={{fontWeight:500}}>{c.name}</div><div style={{fontSize:12,color:'var(--muted)'}}>{c.contact_name||c.contact_phone||'—'}</div></td>
                <td style={{fontSize:13,color:'var(--muted)'}}>{[c.city,c.state].filter(Boolean).join(', ')||'—'}</td>
                <td>{c.required_credential?<span style={{background:'var(--teal-light)',color:'var(--navy)',border:'1px solid #BAE6FD',borderRadius:6,padding:'2px 9px',fontSize:12,fontWeight:700,fontFamily:'var(--mono)',display:'inline-block'}}>{c.required_credential}</span>:<span style={{color:'var(--subtle)',fontSize:12}}>Any</span>}</td>
                <td style={{fontSize:13,color:'var(--muted)'}}>{c.payer_type||'—'}</td>
                <td><StatusBadge label={c.urgency_level} status={c.urgency_level} size="sm"/></td>
                <td><StatusBadge label={c.status} status={c.status} size="sm"/></td>
                <td><Link href={`/clients/${c.id}`}><button className="btn-secondary" style={{padding:'6px 14px',fontSize:12}}>View →</button></Link></td>
              </tr>
            ))}</tbody></table>
          )}
        </div>
      </div>
    </>
  )
}
