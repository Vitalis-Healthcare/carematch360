"use client"
import { useState } from 'react'

export default function ProviderProfileClient({ provider }: { provider: any }) {
  const [available, setAvailable] = useState(provider?.available ?? false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function toggleAvailability() {
    setSaving(true)
    const res = await fetch('/api/provider/availability', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available: !available }),
    })
    if (res.ok) { setAvailable(!available); setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  const S: any = {
    wrap: { minHeight:'100vh', background:'#F4FAF0', fontFamily:"'Segoe UI',sans-serif" },
    nav: { background:'linear-gradient(135deg,#1A3A0A,#2D5A1B)', padding:'14px 28px', display:'flex', alignItems:'center', justifyContent:'space-between' },
    body: { maxWidth:680, margin:'0 auto', padding:'28px 24px' },
    card: { background:'#fff', border:'1px solid #C8DDB8', borderRadius:14, padding:'28px', marginBottom:18, boxShadow:'0 2px 10px rgba(45,90,27,0.06)' },
    label: { fontSize:11.5, fontWeight:600, color:'#5A7050', textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:4, display:'block' },
    value: { fontSize:15, color:'#1A3A0A', fontWeight:500 },
  }

  return (
    <div style={S.wrap}>
      <nav style={S.nav}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, background:'linear-gradient(135deg,#7AB52A,#9DCF3A)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>⌖</div>
          <div style={{ color:'#fff', fontWeight:600, fontSize:15 }}>Vitalis Provider Portal</div>
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <a href="/provider/dashboard" style={{ color:'rgba(255,255,255,0.7)', fontSize:13, textDecoration:'none' }}>← Dashboard</a>
          <form action="/api/auth/signout" method="POST">
            <button style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', padding:'7px 16px', borderRadius:7, cursor:'pointer', fontSize:13 }}>Sign Out</button>
          </form>
        </div>
      </nav>

      <div style={S.body}>
        <div style={{ fontSize:22, fontWeight:700, color:'#1A3A0A', marginBottom:20 }}>My Profile</div>

        {/* Availability toggle */}
        <div style={{ ...S.card, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:16, fontWeight:600, color:'#1A3A0A', marginBottom:4 }}>Availability Status</div>
            <div style={{ fontSize:13.5, color:'#5A7050' }}>Tell us if you're currently available for new cases</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {saved && <span style={{ fontSize:12, color:'#065F46' }}>✓ Saved</span>}
            <button onClick={toggleAvailability} disabled={saving}
              style={{ padding:'10px 22px', borderRadius:10, fontWeight:600, fontSize:14, border:`1.5px solid ${available?'#A7F3D0':'#FECACA'}`, cursor:saving?'not-allowed':'pointer', background: available ? '#ECFDF5' : '#FEF2F2', color: available ? '#065F46' : '#991B1B' }}>
              {saving ? '…' : available ? '✓ Available' : '✗ Unavailable'}
            </button>
          </div>
        </div>

        {/* Profile info */}
        <div style={S.card}>
          <div style={{ fontSize:15, fontWeight:600, color:'#1A3A0A', marginBottom:18 }}>Profile Information</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
            {[
              { label:'Full Name', value: provider?.name },
              { label:'Credential', value: provider?.credential_type },
              { label:'Email', value: provider?.email || '—' },
              { label:'Phone', value: provider?.phone || '—' },
              { label:'City', value: provider?.city },
              { label:'State', value: provider?.state },
              { label:'Service Radius', value: provider?.service_radius_miles ? `${provider.service_radius_miles} miles` : '—' },
              { label:'Status', value: provider?.status },
            ].map(f => (
              <div key={f.label}>
                <span style={S.label}>{f.label}</span>
                <span style={S.value}>{f.value}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:18, padding:'12px 16px', background:'#F4FAF0', borderRadius:8, fontSize:13, color:'#5A7050' }}>
            To update your profile details, contact your care coordinator at <strong>240.716.6874</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
