export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import Link from 'next/link'

async function getStats() {
  const db = createServiceClient()
  try {
    const [
      {count:totalProviders},{count:activeProviders},{count:totalClients},
      {count:openCases},{count:matchedCases},{data:recentCases},
    ] = await Promise.all([
      db.from('providers').select('*',{count:'exact',head:true}),
      db.from('providers').select('*',{count:'exact',head:true}).eq('status','active').eq('available',true),
      db.from('clients').select('*',{count:'exact',head:true}).eq('status','active'),
      db.from('cases').select('*',{count:'exact',head:true}).eq('status','open'),
      db.from('cases').select('*',{count:'exact',head:true}).eq('status','matched'),
      db.from('cases').select('id,title,status,urgency,created_at,clients(name)').order('created_at',{ascending:false}).limit(6),
    ])
    return {totalProviders:totalProviders??0,activeProviders:activeProviders??0,totalClients:totalClients??0,openCases:openCases??0,matchedCases:matchedCases??0,recentCases:recentCases??[]}
  } catch { return {totalProviders:0,activeProviders:0,totalClients:0,openCases:0,matchedCases:0,recentCases:[]} }
}

export default async function DashboardPage() {
  const s = await getStats()
  const cards = [
    {label:'Active Providers',value:s.activeProviders,sub:`${s.totalProviders} total`,color:'var(--teal)',href:'/providers'},
    {label:'Active Clients',value:s.totalClients,sub:'in database',color:'var(--purple)',href:'/clients'},
    {label:'Open Cases',value:s.openCases,sub:'awaiting match',color:'var(--amber)',href:'/cases'},
    {label:'Matched Cases',value:s.matchedCases,sub:'provider assigned',color:'var(--green)',href:'/cases'},
  ]
  return (
    <>
      <PageHeader title="Dashboard" subtitle="CareMatch360 — Provider-Client Matching Platform"
        actions={<Link href="/cases/new"><button className="btn-primary">+ New Case</button></Link>}/>
      <div className="page-body">
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:28}}>
          {cards.map(card=>(
            <Link key={card.label} href={card.href}>
              <div className="card" style={{padding:'20px 24px',cursor:'pointer'}}>
                <div style={{fontSize:11,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:10}}>{card.label}</div>
                <div style={{fontSize:36,fontWeight:600,color:card.color,fontFamily:'var(--mono)',lineHeight:1,marginBottom:6}}>{card.value}</div>
                <div style={{fontSize:12,color:'var(--muted)'}}>{card.sub}</div>
              </div>
            </Link>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:20}}>
          <div className="card">
            <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:600,fontSize:14}}>Recent Cases</div>
              <Link href="/cases"><span style={{fontSize:12,color:'var(--teal)',fontWeight:500}}>View all →</span></Link>
            </div>
            {s.recentCases.length===0?(
              <div style={{padding:'32px 20px',textAlign:'center',color:'var(--muted)',fontSize:13}}>
                No cases yet. <Link href="/cases/new" style={{color:'var(--teal)'}}>Create the first one.</Link>
              </div>
            ):(
              s.recentCases.map((c:any)=>(
                <Link key={c.id} href={`/cases/${c.id}`}>
                  <div style={{padding:'12px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:500,fontSize:13.5,marginBottom:2}}>{c.title}</div>
                      <div style={{fontSize:12,color:'var(--muted)'}}>{Array.isArray(c.clients)?c.clients[0]?.name:c.clients?.name||'No client'}</div>
                    </div>
                    <StatusBadge label={c.urgency} status={c.urgency} size="sm"/>
                    <StatusBadge label={c.status} status={c.status} size="sm"/>
                  </div>
                </Link>
              ))
            )}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div className="card" style={{padding:'20px'}}>
              <div style={{fontWeight:600,fontSize:14,marginBottom:14}}>Quick Actions</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <Link href="/providers/new"><button className="btn-primary" style={{width:'100%',justifyContent:'center'}}>+ Add Provider</button></Link>
                <Link href="/clients/new"><button className="btn-secondary" style={{width:'100%',justifyContent:'center'}}>+ Add Client</button></Link>
                <Link href="/cases/new"><button className="btn-teal" style={{width:'100%',justifyContent:'center'}}>⌖ Open New Case</button></Link>
              </div>
            </div>
            <div className="card" style={{padding:'20px'}}>
              <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>Stage Progress</div>
              {[{s:'1 — Foundation',done:true},{s:'2 — Notifications',done:false},{s:'3 — Bidding',done:false},{s:'4 — Reporting',done:false},{s:'5 — Mobile + SaaS',done:false}].map(row=>(
                <div key={row.s} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8,fontSize:12.5,color:row.done?'var(--text)':'var(--subtle)'}}>
                  <div style={{width:20,height:20,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,background:row.done?'var(--green)':'var(--border)',color:row.done?'#fff':'var(--muted)',flexShrink:0}}>{row.done?'✓':'·'}</div>
                  Stage {row.s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
