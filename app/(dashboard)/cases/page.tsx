export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import CaseTabs from '@/components/CaseTabs'
import { CASE_STATUS_CONFIG } from '@/lib/constants'

export default async function CasesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = 'active' } = await searchParams
  const db = createServiceClient()

  const { data: allCases } = await db
    .from('cases')
    .select('id,title,care_level,urgency,status,created_at,dispatched_at,assigned_at,closed_at,hold_reason,clients(name,city,state),providers(name)')
    .order('created_at', { ascending: false })

  const cases = allCases ?? []

  // Group by tab
  const tabs = {
    active:   cases.filter(c => ['open','matching','matched'].includes(c.status)),
    assigned: cases.filter(c => c.status === 'assigned'),
    on_hold:  cases.filter(c => c.status === 'on_hold'),
    closed:   cases.filter(c => ['completed','cancelled'].includes(c.status)),
  }

  const currentCases = tabs[tab as keyof typeof tabs] ?? tabs.active

  const CARE_LABELS: Record<string,string> = {
    companion_care:'Companion Care', personal_care:'Personal Care',
    skilled_nursing:'Skilled Nursing', physical_therapy:'Physical Therapy',
    occupational_therapy:'Occupational Therapy', speech_therapy:'Speech Therapy',
  }

  return (
    <>
      <PageHeader
        title="Cases"
        subtitle={`${cases.length} total · ${tabs.active.length} active`}
        breadcrumbs={[{ label: 'Cases' }]}
        actions={
          <Link href="/cases/new">
            <button className="btn-primary" style={{ padding:'8px 18px', fontSize:13 }}>+ New Case</button>
          </Link>
        }
      />
      <div style={{ padding:'0 28px 28px' }}>
        <CaseTabs
          counts={{ active: tabs.active.length, assigned: tabs.assigned.length, on_hold: tabs.on_hold.length, closed: tabs.closed.length }}
          activeTab={tab}
        />

        {currentCases.length === 0 ? (
          <div className="card" style={{ padding:'48px', textAlign:'center', color:'var(--muted)', border:'2px dashed var(--border)', background:'transparent', boxShadow:'none' }}>
            <div style={{ fontSize:28, marginBottom:10 }}>◈</div>
            <div style={{ fontWeight:600, fontSize:15, marginBottom:6, color:'var(--text)' }}>No {tab} cases</div>
            {tab === 'active' && <Link href="/cases/new"><button className="btn-primary" style={{ marginTop:12 }}>Open First Case</button></Link>}
          </div>
        ) : (
          <div className="card" style={{ overflow:'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Care Level</th>
                  <th>Client</th>
                  <th>Status</th>
                  {tab === 'assigned' && <th>Provider</th>}
                  {tab === 'on_hold' && <th>Hold Reason</th>}
                  {tab === 'closed' && <th>Closed</th>}
                  <th>Opened</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {currentCases.map(c => {
                  const client = Array.isArray(c.clients) ? c.clients[0] : c.clients
                  const provider = Array.isArray(c.providers) ? c.providers[0] : c.providers
                  const cfg = CASE_STATUS_CONFIG[c.status]
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight:500 }}>{c.title}</div>
                        <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>
                          {c.urgency?.toUpperCase()}
                          {c.dispatched_at && <span style={{ marginLeft:6, color:'var(--teal)' }}>· 📤 Dispatched</span>}
                        </div>
                      </td>
                      <td style={{ fontSize:12.5, color:'var(--muted)' }}>{CARE_LABELS[c.care_level] ?? c.care_level ?? '—'}</td>
                      <td style={{ fontSize:13 }}>{client?.name ?? '—'}<span style={{ fontSize:11, color:'var(--muted)' }}>{client?.city ? ` · ${client.city}` : ''}</span></td>
                      <td>
                        <span style={{ background:cfg?.bg, color:cfg?.color, border:`1px solid ${cfg?.color}33`, borderRadius:12, padding:'2px 10px', fontSize:11, fontWeight:600 }}>
                          {cfg?.label ?? c.status}
                        </span>
                      </td>
                      {tab === 'assigned' && <td style={{ fontSize:13 }}>{provider?.name ?? '—'}</td>}
                      {tab === 'on_hold' && (
                        <td style={{ fontSize:12, color:'#92400E' }}>{c.hold_reason?.replace(/_/g,' ') ?? '—'}</td>
                      )}
                      {tab === 'closed' && (
                        <td style={{ fontSize:12, color:'var(--muted)' }}>
                          {c.closed_at ? new Date(c.closed_at).toLocaleDateString() : '—'}
                        </td>
                      )}
                      <td style={{ fontSize:12, color:'var(--muted)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                      <td><Link href={`/cases/${c.id}`}><button className="btn-secondary" style={{ fontSize:12, padding:'4px 12px' }}>View →</button></Link></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
