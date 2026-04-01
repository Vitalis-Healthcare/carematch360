"use client"
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function sendLink() {
    if (!email.includes('@')) { setError('Please enter a valid email.'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/auth/staff-login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    if (res.ok) setSent(true)
    else setError('Something went wrong. Please try again.')
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0B2D45 0%,#0D3A55 50%,#083350 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Segoe UI',sans-serif", position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(14,159,163,0.13) 0%,transparent 70%)', top:-200, right:-100, pointerEvents:'none' }}/>
      <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(14,159,163,0.08) 0%,transparent 70%)', bottom:-100, left:-50, pointerEvents:'none' }}/>

      <div style={{ background:'#fff', borderRadius:20, padding:'48px 44px', maxWidth:440, width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.25)', position:'relative' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#0B3D5C,#0E9FA3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 14px', boxShadow:'0 8px 20px rgba(11,61,92,0.3)' }}>⌖</div>
          <div style={{ fontWeight:700, fontSize:22, color:'#0B2D45', letterSpacing:'-0.02em' }}>CareMatch<span style={{ color:'#0E9FA3' }}>360</span></div>
          <div style={{ fontSize:13, color:'#64748B', marginTop:4 }}>Vitalis Healthcare Services</div>
        </div>

        {!sent ? (<>
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:20, fontWeight:700, color:'#0B2D45', marginBottom:6 }}>Staff Sign In</div>
            <div style={{ fontSize:13.5, color:'#64748B', lineHeight:1.6 }}>Enter your work email and we'll send a secure sign-in link. No password needed.</div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:600, color:'#0B2D45', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Work Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendLink()}
              placeholder="you@vitalishealthcare.com" autoFocus
              style={{ width:'100%', padding:'12px 16px', fontSize:14.5, border:'1.5px solid #E2E8F0', borderRadius:10, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
            />
          </div>
          {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#DC2626', marginBottom:14 }}>{error}</div>}
          <button onClick={sendLink} disabled={loading}
            style={{ width:'100%', padding:13, fontSize:15, fontWeight:600, background:loading?'#94A3B8':'linear-gradient(135deg,#0B3D5C,#0E9FA3)', color:'#fff', border:'none', borderRadius:10, cursor:loading?'not-allowed':'pointer', boxShadow:loading?'none':'0 4px 14px rgba(11,61,92,0.3)', fontFamily:'inherit' }}>
            {loading ? 'Sending…' : '✉️ Send Sign-In Link'}
          </button>
          <div style={{ textAlign:'center', marginTop:20, fontSize:12, color:'#94A3B8' }}>
            Only authorised staff can sign in here.<br/>
            <a href="/provider/login" style={{ color:'#0E9FA3', textDecoration:'none', fontWeight:500 }}>Provider? Sign in here →</a>
          </div>
        </>) : (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>📬</div>
            <div style={{ fontSize:20, fontWeight:700, color:'#0B2D45', marginBottom:10 }}>Check your email</div>
            <div style={{ fontSize:14, color:'#64748B', lineHeight:1.7, marginBottom:24 }}>We sent a sign-in link to<br/><strong style={{ color:'#0B2D45' }}>{email}</strong></div>
            <div style={{ background:'#F0F9FF', border:'1px solid #BAE6FD', borderRadius:10, padding:'14px 18px', fontSize:13, color:'#0369A1' }}>Link expires in 1 hour. Check spam if you don't see it.</div>
            <button onClick={() => { setSent(false); setEmail('') }} style={{ marginTop:20, background:'none', border:'none', color:'#0E9FA3', cursor:'pointer', fontSize:13, fontWeight:500 }}>← Use a different email</button>
          </div>
        )}
      </div>
    </div>
  )
}
