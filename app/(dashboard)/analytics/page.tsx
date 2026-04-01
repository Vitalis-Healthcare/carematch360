export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import { CASE_STATUS_CONFIG, HOLD_REASONS } from '@/lib/constants'

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24))
}

export default async function AnalyticsPage() {
  const db = createServiceClient()

  const { data: cases } = await db
    .from('cases')
    .select('id,title,status,care_level,urgency,created_at,assigned_at,closed_at,hold_reason,dispatched_at,clients(name,city)')
    .order('created_at', { ascending: false })

  const { data: providers } = await db.from('providers').select('id,credential_type,status,available')
  const { data: clients }   = await db.from('clients').select('id,status,care_needs')
  const { data: matches }   = await db.from('case_matches').select('status,match_score')

  const allCases = cases ?? []
  const total    = allCases.length

  // Status breakdown
  const byStatus: Record<string,number> = {}
  allCases.forEach(c => { byStatus[c.status] = (byStatus[c.status] || 0) + 1 })

  // Fill rate (assigned + completed out of all non-cancelled)
  const nonCancelled = allCases.filter(c => c.status !== 'cancelled').length
  const filled       = allCases.filter(c => ['assigned','completed'].includes(c.status)).length
  const fillRate     = nonCancelled > 0 ? Math.round((filled / nonCancelled) * 100) : 0

  // Avg time to fill (created_at → assigned_at)
  const filledWithDates = allCases.filter(c => c.assigned_at && c.created_at)
  const avgDaysToFill   = filledWithDates.length > 0
    ? Math.round(filledWithDates.reduce((sum, c) => sum + daysBetween(c.created_at, c.assigned_at!), 0) / filledWithDates.length)
    : null

  // By care level
  const byCareLevel: Record<string,number> = {}
  allCases.forEach(c => {
    if (c.care_level) byCareLevel[c.care_level] = (byCareLevel[c.care_level] || 0) + 1
  })

  // Hold reasons breakdown
  const holdCases = allCases.filter(c => c.status === 'on_hold' && c.hold_reason)
  const byHoldReason: Record<string,number> = {}
  holdCases.forEach(c => { byHoldReason[c.hold_reason!] = (byHoldReason[c.hold_reason!] || 0) + 1 })

  // Provider stats
  const totalProviders  = (providers ?? []).length
  const activeProviders = (providers ?? []).filter(p => p.status === 'active').length
  const availProviders  = (providers ?? []).filter(p => p.available).length

  // Match acceptance rate
  const allMatches      = matches ?? []
  const acceptedMatches = allMatches.filter(m => m.status === 'accepted').length
  const notifiedMatches = allMatches.filter(m => ['accepted','declined','notified','interested'].includes(m.status)).length
  const acceptanceRate  = notifiedMatches > 0 ? Math.round((acceptedMatches / notifiedMatches) * 100) : null

  // Last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const recentCases   = allCases.filter(c => c.created_at >= thirtyDaysAgo)

  const CARE_LABELS: Record<string,string> = {
    companion_care:'Companion Care', personal_care:'Personal Care',
    skilled_nursing:'Skilled Nursing', physical_therapy:'Physical Therapy',
    occupational_therapy:'Occupational Therapy', speech_therapy:'Speech Therapy',
  }

  const statCard = (label: string, value: string|number, sub?: string, color = 'var(--navy)') => (
    <div className="card" style={{ padding:'20px 24px' }}>
      <div style={{ fontSize:11, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:32, fontWeight:700, color, fontFamily:'var(--mono)', marginBottom:4 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:'var(--subtle)' }}>{sub}</div>}
    </div>
  )

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Case performance, provider metrics, and operational insights"
        breadcrumbs={[{ label: 'Analytics' }]}
      />
      <div style={{ padding:'0 28px 40px' }}>

        {/* Top KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:24 }}>
          {statCard('Total Cases', total, 'All time')}
          {statCard('Fill Rate', `${fillRate}%`, `${filled} of ${nonCancelled} non-cancelled`, fillRate >= 70 ? '#10B981' : fillRate >= 50 ? '#F59E0B' : '#EF4444')}
          {statCard('Avg Days to Fill', avgDaysToFill ?? '—', avgDaysToFill ? 'From open to assigned' : 'No assignments yet')}
          {statCard('Cases Last 30d', recentCases.length, 'New cases opened')}
          {statCard('Acceptance Rate', acceptanceRate != null ? `${acceptanceRate}%` : '—', 'Providers who said yes')}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>

          {/* Case Status Breakdown */}
          <div className="card" style={{ padding:'20px 24px' }}>
            <div style={{ fontWeight:600, fontSize:14, color:'var(--navy)', marginBottom:16 }}>Cases by Status</div>
            {Object.entries(CASE_STATUS_CONFIG).map(([status, cfg]) => {
              const count = byStatus[status] || 0
              const pct   = total > 0 ? (count / total) * 100 : 0
              return (
                <div key={status} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                    <span style={{ fontWeight:500 }}>{cfg.label}</span>
                    <span style={{ fontFamily:'var(--mono)', color: cfg.color }}>{count}</span>
                  </div>
                  <div style={{ height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:cfg.color, borderRadius:3, transition:'width 0.3s' }}/>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Cases by Care Level */}
          <div className="card" style={{ padding:'20px 24px' }}>
            <div style={{ fontWeight:600, fontSize:14, color:'var(--navy)', marginBottom:16 }}>Cases by Care Level</div>
            {Object.entries(CARE_LABELS).map(([key, label]) => {
              const count = byCareLevel[key] || 0
              const pct   = total > 0 ? (count / total) * 100 : 0
              return (
                <div key={key} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                    <span style={{ fontWeight:500 }}>{label}</span>
                    <span style={{ fontFamily:'var(--mono)', color:'var(--navy)' }}>{count}</span>
                  </div>
                  <div style={{ height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:'var(--teal)', borderRadius:3 }}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20 }}>

          {/* Provider stats */}
          <div className="card" style={{ padding:'20px 24px' }}>
            <div style={{ fontWeight:600, fontSize:14, color:'var(--navy)', marginBottom:16 }}>Provider Pool</div>
            {[
              { label:'Total providers',  value:totalProviders },
              { label:'Active',           value:activeProviders },
              { label:'Available now',    value:availProviders },
              { label:'Unavailable',      value:activeProviders - availProviders },
            ].map(row => (
              <div key={row.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                <span style={{ color:'var(--muted)' }}>{row.label}</span>
                <span style={{ fontFamily:'var(--mono)', fontWeight:600 }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* On hold reasons */}
          <div className="card" style={{ padding:'20px 24px' }}>
            <div style={{ fontWeight:600, fontSize:14, color:'var(--navy)', marginBottom:16 }}>
              Hold Reasons
              <span style={{ fontSize:12, fontWeight:400, color:'var(--muted)', marginLeft:8 }}>{holdCases.length} on hold</span>
            </div>
            {holdCases.length === 0 ? (
              <div style={{ fontSize:13, color:'var(--subtle)', textAlign:'center', padding:'20px 0' }}>No cases on hold</div>
            ) : Object.entries(byHoldReason).sort((a,b) => b[1]-a[1]).map(([reason, count]) => {
              const label = HOLD_REASONS.find(r => r.value === reason)?.label ?? reason
              return (
                <div key={reason} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)', fontSize:12.5 }}>
                  <span style={{ color:'var(--muted)' }}>{label}</span>
                  <span style={{ fontFamily:'var(--mono)', fontWeight:600, color:'#D97706' }}>{count}</span>
                </div>
              )
            })}
          </div>

          {/* Recent cases */}
          <div className="card" style={{ padding:'20px 24px' }}>
            <div style={{ fontWeight:600, fontSize:14, color:'var(--navy)', marginBottom:16 }}>Recent Cases (30d)</div>
            {recentCases.length === 0 ? (
              <div style={{ fontSize:13, color:'var(--subtle)', textAlign:'center', padding:'20px 0' }}>No recent cases</div>
            ) : recentCases.slice(0,8).map(c => {
              const cfg = CASE_STATUS_CONFIG[c.status]
              const cl  = Array.isArray(c.clients) ? c.clients[0] : c.clients
              return (
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:cfg?.color ?? '#64748B', flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12.5, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.title ?? '—'}</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{cl?.city ?? ''}</div>
                  </div>
                  <span style={{ fontSize:10, color:cfg?.color, background:cfg?.bg, padding:'1px 7px', borderRadius:10, flexShrink:0 }}>{cfg?.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
