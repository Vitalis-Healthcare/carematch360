"use client"
import { useState } from 'react'

interface StaffUser { id: string; email: string; full_name: string; role: string; active: boolean; last_login: string }
interface ProviderUser { id: string; name: string; email: string; phone: string; credential_type: string; city: string; status: string }

export default function UserManagementClient({ staffUsers, providerUsers }: { staffUsers: StaffUser[], providerUsers: ProviderUser[] }) {
  const [tab, setTab] = useState<'staff'|'providers'>('staff')
  const [showInviteStaff, setShowInviteStaff] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('coordinator')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')

  async function inviteStaff() {
    if (!inviteEmail || !inviteName) { setMessage('Name and email required.'); return }
    setSending(true); setMessage('')
    const res = await fetch('/api/admin/invite-staff', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, full_name: inviteName, role: inviteRole }),
    })
    const data = await res.json()
    setSending(false)
    if (res.ok) {
      setMessage(`✅ Invite sent to ${inviteEmail}`)
      setInviteEmail(''); setInviteName(''); setShowInviteStaff(false)
    } else {
      setMessage(`❌ ${data.error}`)
    }
  }

  async function sendProviderInvite(provider: ProviderUser) {
    const res = await fetch('/api/admin/invite-provider', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider_id: provider.id }),
    })
    if (res.ok) alert(`✅ Portal invite sent to ${provider.name}`)
    else alert('Failed to send invite')
  }

  const S: any = {
    wrap: { minHeight:'100vh', background:'#F8FAFC', fontFamily:"'Segoe UI',sans-serif" },
    header: { background:'#fff', borderBottom:'1px solid #E2E8F0', padding:'20px 28px', display:'flex', alignItems:'center', justifyContent:'space-between' },
    title: { fontSize:20, fontWeight:700, color:'#0F172A' },
    body: { maxWidth:1000, margin:'0 auto', padding:'28px 24px' },
    tabs: { display:'flex', gap:4, background:'#F1F5F9', borderRadius:10, padding:4, marginBottom:24, width:'fit-content' },
    tab: (active: boolean) => ({ padding:'8px 20px', borderRadius:8, fontSize:13.5, fontWeight:active?600:400, background:active?'#fff':'transparent', color:active?'#0F172A':'#64748B', border:'none', cursor:'pointer', boxShadow:active?'0 1px 4px rgba(0,0,0,0.08)':'none' }),
    table: { width:'100%', borderCollapse:'collapse' as const, background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, overflow:'hidden' },
    th: { padding:'12px 16px', textAlign:'left' as const, fontSize:11.5, fontWeight:600, color:'#64748B', textTransform:'uppercase' as const, letterSpacing:'0.05em', background:'#F8FAFC', borderBottom:'1px solid #E2E8F0' },
    td: { padding:'13px 16px', fontSize:13.5, color:'#334155', borderBottom:'1px solid #F1F5F9' },
    btn: (color: string) => ({ padding:'6px 14px', borderRadius:7, fontSize:12, fontWeight:600, background:color, color:'#fff', border:'none', cursor:'pointer' }),
    badge: (color: string, bg: string) => ({ padding:'3px 10px', borderRadius:10, fontSize:11.5, fontWeight:600, color, background:bg }),
    modal: { position:'fixed' as const, inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 },
    modalBox: { background:'#fff', borderRadius:16, padding:'32px', maxWidth:440, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
  }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div>
          <div style={S.title}>User Management</div>
          <div style={{ fontSize:13, color:'#64748B', marginTop:2 }}>Manage staff and provider portal access</div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <a href="/dashboard" style={{ padding:'9px 18px', borderRadius:8, fontSize:13, fontWeight:500, color:'#64748B', background:'#F1F5F9', textDecoration:'none' }}>← Dashboard</a>
          {tab === 'staff' && (
            <button onClick={() => setShowInviteStaff(true)} style={S.btn('#0B3D5C')}>+ Invite Staff</button>
          )}
        </div>
      </div>

      <div style={S.body}>
        {message && (
          <div style={{ background: message.startsWith('✅') ? '#ECFDF5' : '#FEF2F2', border:`1px solid ${message.startsWith('✅')?'#A7F3D0':'#FECACA'}`, borderRadius:9, padding:'11px 16px', fontSize:13.5, marginBottom:18, color: message.startsWith('✅')?'#065F46':'#DC2626' }}>
            {message}
          </div>
        )}

        <div style={S.tabs}>
          <button style={S.tab(tab==='staff')} onClick={() => setTab('staff')}>Staff ({staffUsers.length})</button>
          <button style={S.tab(tab==='providers')} onClick={() => setTab('providers')}>Providers ({providerUsers.length})</button>
        </div>

        {tab === 'staff' && (
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Name</th>
              <th style={S.th}>Email</th>
              <th style={S.th}>Role</th>
              <th style={S.th}>Status</th>
              <th style={S.th}>Last Login</th>
            </tr></thead>
            <tbody>
              {staffUsers.map(u => (
                <tr key={u.id}>
                  <td style={S.td}><strong>{u.full_name}</strong></td>
                  <td style={S.td}>{u.email}</td>
                  <td style={S.td}>
                    <span style={S.badge(u.role==='admin'?'#92400E':'#1D4ED8', u.role==='admin'?'#FEF3C7':'#EFF6FF')}>
                      {u.role === 'admin' ? '👑 Admin' : '🗂️ Coordinator'}
                    </span>
                  </td>
                  <td style={S.td}>
                    <span style={S.badge(u.active?'#065F46':'#991B1B', u.active?'#ECFDF5':'#FEF2F2')}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ ...S.td, color:'#94A3B8', fontSize:12.5 }}>
                    {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'providers' && (
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Name</th>
              <th style={S.th}>Credential</th>
              <th style={S.th}>Email</th>
              <th style={S.th}>Phone</th>
              <th style={S.th}>Status</th>
              <th style={S.th}>Portal Access</th>
            </tr></thead>
            <tbody>
              {providerUsers.map(p => (
                <tr key={p.id}>
                  <td style={S.td}><strong>{p.name}</strong></td>
                  <td style={S.td}><span style={{ fontSize:12, background:'#EFF6FF', color:'#1D4ED8', padding:'2px 8px', borderRadius:6, fontWeight:600 }}>{p.credential_type}</span></td>
                  <td style={{ ...S.td, color:'#64748B', fontSize:12.5 }}>{p.email || '—'}</td>
                  <td style={{ ...S.td, color:'#64748B', fontSize:12.5 }}>{p.phone || '—'}</td>
                  <td style={S.td}>
                    <span style={S.badge(p.status==='active'?'#065F46':'#92400E', p.status==='active'?'#ECFDF5':'#FEF3C7')}>
                      {p.status}
                    </span>
                  </td>
                  <td style={S.td}>
                    <button onClick={() => sendProviderInvite(p)}
                      disabled={!p.email && !p.phone}
                      style={{ ...S.btn('#4A7C2F'), opacity:(!p.email && !p.phone)?0.4:1, cursor:(!p.email && !p.phone)?'not-allowed':'pointer' }}>
                      Send Invite
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showInviteStaff && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setShowInviteStaff(false)}>
          <div style={S.modalBox}>
            <div style={{ fontSize:18, fontWeight:700, color:'#0F172A', marginBottom:20 }}>Invite Staff Member</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:5 }}>Full Name</label>
                <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Marie Epah"
                  style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:14, fontFamily:'inherit', boxSizing:'border-box' as const, outline:'none' }}/>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:5 }}>Email</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="marie@vitalishealthcare.com"
                  style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:14, fontFamily:'inherit', boxSizing:'border-box' as const, outline:'none' }}/>
              </div>
              <div>
                <label style={{ fontSize:11.5, fontWeight:600, color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:5 }}>Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                  style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:14, fontFamily:'inherit', outline:'none' }}>
                  <option value="coordinator">Coordinator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            {message && <div style={{ marginTop:12, fontSize:13, color: message.startsWith('✅')?'#065F46':'#DC2626' }}>{message}</div>}
            <div style={{ display:'flex', gap:10, marginTop:24 }}>
              <button onClick={() => setShowInviteStaff(false)} style={{ flex:1, padding:'11px', background:'#F1F5F9', border:'none', borderRadius:9, cursor:'pointer', fontSize:14, fontWeight:500, color:'#475569' }}>Cancel</button>
              <button onClick={inviteStaff} disabled={sending} style={{ flex:2, padding:'11px', background:sending?'#94A3B8':'linear-gradient(135deg,#0B3D5C,#0E9FA3)', color:'#fff', border:'none', borderRadius:9, cursor:sending?'not-allowed':'pointer', fontSize:14, fontWeight:600 }}>
                {sending ? 'Sending…' : '✉️ Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
