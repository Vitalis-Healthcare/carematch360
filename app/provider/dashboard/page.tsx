export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ProviderDashboard() {
  const session = await getSession()
  if (!session) redirect('/provider/login')
  if (session.role !== 'provider') redirect('/dashboard')

  const db = createServiceClient()

  // Get provider info
  const { data: provider } = await db.from('providers')
    .select('id, name, credential_type, city, state, available, status')
    .eq('id', session.userId).single()

  // Get their case matches
  const { data: matches } = await db.from('case_matches')
    .select('*,cases(id,title,care_level,urgency,schedule_type,status,clients(name,city,state))')
    .eq('provider_id', session.userId)
    .order('created_at', { ascending: false })

  const activeCases = (matches ?? []).filter(m =>
    ['notified','interested','accepted'].includes(m.status) &&
    !['completed','cancelled','assigned'].includes((m.cases as any)?.status)
  )
  const assignedCases = (matches ?? []).filter(m =>
    m.status === 'accepted' && (m.cases as any)?.status === 'assigned'
  )

  return (
    <div style={{ minHeight:'100vh', background:'#F4FAF0', fontFamily:"'Segoe UI',sans-serif" }}>
      {/* Nav */}
      <nav style={{ background:'linear-gradient(135deg,#1A3A0A,#2D5A1B)', padding:'14px 28px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, background:'linear-gradient(135deg,#7AB52A,#9DCF3A)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>⌖</div>
          <div style={{ color:'#fff', fontWeight:600, fontSize:15 }}>Vitalis Provider Portal</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ color:'rgba(255,255,255,0.7)', fontSize:13 }}>👤 {provider?.name}</span>
          <form action="/api/auth/signout" method="POST">
            <button style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', padding:'7px 16px', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:500 }}>Sign Out</button>
          </form>
        </div>
      </nav>

      <div style={{ maxWidth:800, margin:'0 auto', padding:'28px 24px' }}>
        {/* Welcome */}
        <div style={{ background:'#fff', borderRadius:14, padding:'24px 28px', marginBottom:20, border:'1px solid #C8DDB8', boxShadow:'0 2px 12px rgba(45,90,27,0.07)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontSize:22, fontWeight:700, color:'#1A3A0A', marginBottom:4 }}>Welcome back, {provider?.name?.split(' ')[0]}!</div>
              <div style={{ fontSize:14, color:'#5A7050' }}>{provider?.credential_type} · {provider?.city}, {provider?.state}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ fontSize:13, color: provider?.available ? '#065F46' : '#991B1B', background: provider?.available ? '#ECFDF5' : '#FEF2F2', border:`1px solid ${provider?.available ? '#A7F3D0' : '#FECACA'}`, padding:'5px 14px', borderRadius:20, fontWeight:600 }}>
                {provider?.available ? '✓ Available' : '✗ Unavailable'}
              </div>
              <Link href="/provider/profile">
                <button style={{ background:'none', border:'1.5px solid #C8DDB8', borderRadius:8, padding:'7px 14px', fontSize:13, cursor:'pointer', color:'#2D5A1B', fontWeight:500 }}>Edit Profile</button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:24 }}>
          {[
            { label:'Open Opportunities', value: activeCases.length, color:'#0EA5E9' },
            { label:'Assigned Cases', value: assignedCases.length, color:'#10B981' },
            { label:'Total Matches', value: (matches ?? []).length, color:'#7AB52A' },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', border:'1px solid #C8DDB8', borderRadius:12, padding:'18px 20px', textAlign:'center', boxShadow:'0 1px 6px rgba(45,90,27,0.05)' }}>
              <div style={{ fontSize:30, fontWeight:700, color:s.color, fontFamily:'monospace' }}>{s.value}</div>
              <div style={{ fontSize:12, color:'#5A7050', marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Open cases */}
        <div style={{ background:'#fff', border:'1px solid #C8DDB8', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(45,90,27,0.07)' }}>
          <div style={{ padding:'18px 24px', borderBottom:'1px solid #C8DDB8', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontWeight:600, fontSize:15, color:'#1A3A0A' }}>Case Opportunities</div>
            <div style={{ fontSize:12, color:'#5A7050' }}>{activeCases.length} open</div>
          </div>
          {activeCases.length === 0 ? (
            <div style={{ padding:'40px', textAlign:'center', color:'#5A7050', fontSize:14 }}>
              No open cases right now. You'll be notified when new cases match your profile.
            </div>
          ) : activeCases.map((m: any) => {
            const c = m.cases
            const client = Array.isArray(c?.clients) ? c.clients[0] : c?.clients
            const CARE: Record<string,string> = { companion_care:'Companion', personal_care:'Personal Care', skilled_nursing:'Skilled Nursing', physical_therapy:'PT', occupational_therapy:'OT', speech_therapy:'ST' }
            return (
              <div key={m.id} style={{ padding:'18px 24px', borderBottom:'1px solid #EBF5DF', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:14, color:'#1A3A0A', marginBottom:3 }}>{c?.title}</div>
                  <div style={{ fontSize:12.5, color:'#5A7050' }}>{CARE[c?.care_level] ?? c?.care_level} · {client?.city}, {client?.state} · {c?.urgency}</div>
                </div>
                <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                  <span style={{ fontSize:11, padding:'3px 10px', borderRadius:10, background: m.status==='accepted'?'#ECFDF5':m.status==='interested'?'#FEF9C3':'#EFF6FF', color:m.status==='accepted'?'#065F46':m.status==='interested'?'#92400E':'#1D4ED8', fontWeight:600 }}>
                    {m.status==='accepted'?'✓ Accepted':m.status==='interested'?'💬 Interested':'⏳ Awaiting'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
