"use client"
import { useRouter } from 'next/navigation'

interface Props {
  counts: { leads: number; active: number; assigned: number; on_hold: number; closed: number }
  activeTab: string
}

const TABS = [
  { key: 'leads',    label: 'Leads',     color: '#A855F7' },
  { key: 'active',   label: 'Active',    color: '#0EA5E9' },
  { key: 'assigned', label: 'Assigned',  color: '#10B981' },
  { key: 'on_hold',  label: 'On Hold',   color: '#F59E0B' },
  { key: 'closed',   label: 'Closed',    color: '#6B7280' },
]

export default function CaseTabs({ counts, activeTab }: Props) {
  const router = useRouter()
  return (
    <div style={{ display:'flex', gap:8, marginBottom:20, borderBottom:'2px solid var(--border)', paddingBottom:0 }}>
      {TABS.map(tab => {
        const count = counts[tab.key as keyof typeof counts]
        const isActive = activeTab === tab.key
        return (
          <button key={tab.key}
            onClick={() => router.push(`/cases?tab=${tab.key}`)}
            style={{
              padding:'10px 20px', border:'none', cursor:'pointer', fontSize:13.5,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? tab.color : 'var(--muted)',
              background:'transparent',
              borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
              marginBottom:'-2px',
              display:'flex', alignItems:'center', gap:8,
              transition:'all 0.15s',
            }}>
            {tab.label}
            <span style={{
              background: isActive ? tab.color : 'var(--border)',
              color: isActive ? '#fff' : 'var(--muted)',
              borderRadius:12, padding:'1px 8px', fontSize:11, fontWeight:600,
              minWidth:22, textAlign:'center',
            }}>{count}</span>
          </button>
        )
      })}
    </div>
  )
}
