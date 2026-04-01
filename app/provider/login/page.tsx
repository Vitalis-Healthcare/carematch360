"use client"
import { useState } from 'react'

export default function ProviderLoginPage() {
  const [contact, setContact] = useState('')
  const [step, setStep] = useState<'contact'|'otp'|'success'>('contact')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [via, setVia] = useState('')

  const isPhone = contact.replace(/\D/g, '').length >= 10 && !contact.includes('@')

  async function sendCode() {
    if (!contact) { setError('Please enter your email or phone number.'); return }
    setLoading(true); setError('')
    const payload = isPhone ? { phone: contact } : { email: contact }
    const res = await fetch('/api/auth/provider-login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      setVia(data.via || 'email')
      setStep('otp')
    } else {
      setError(data.error || 'Something went wrong.')
    }
  }

  async function verifyOTP() {
    if (otp.length !== 6) { setError('Please enter the 6-digit code.'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/auth/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: otp }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.success) {
      setStep('success')
      setTimeout(() => window.location.href = data.redirect, 1200)
    } else {
      setError(data.error || 'Invalid code. Please try again.')
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0A1A05 0%,#1A3A0A 40%,#2D5A1B 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Segoe UI',sans-serif", position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(122,181,42,0.14) 0%,transparent 65%)', top:-200, right:-100, pointerEvents:'none' }}/>

      <div style={{ background:'#fff', borderRadius:20, padding:'48px 40px', maxWidth:420, width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.25)', position:'relative' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#4A7C2F,#7AB52A)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 12px', boxShadow:'0 8px 20px rgba(74,124,47,0.35)' }}>⌖</div>
          <div style={{ fontWeight:700, fontSize:21, color:'#1A3A0A' }}>Vitalis HealthCare</div>
          <div style={{ fontSize:13, color:'#5A7050', marginTop:3 }}>Provider Portal</div>
        </div>

        {step === 'contact' && (<>
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:19, fontWeight:700, color:'#1A3A0A', marginBottom:5 }}>Sign In</div>
            <div style={{ fontSize:13.5, color:'#5A7050', lineHeight:1.65 }}>Enter your email or phone number and we'll send you a sign-in code.</div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11.5, fontWeight:600, color:'#2D5A1B', letterSpacing:'0.06em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Email or Phone</label>
            <input type="text" value={contact} onChange={e => setContact(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendCode()}
              placeholder="you@email.com or (301) 555-0100" autoFocus
              style={{ width:'100%', padding:'12px 16px', fontSize:14.5, border:'1.5px solid #C8DDB8', borderRadius:10, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
            />
          </div>
          {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#DC2626', marginBottom:14 }}>{error}</div>}
          <button onClick={sendCode} disabled={loading}
            style={{ width:'100%', padding:13, fontSize:15, fontWeight:600, background:loading?'#94A3B8':'linear-gradient(135deg,#2D5A1B,#4A7C2F)', color:'#fff', border:'none', borderRadius:10, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:loading?'none':'0 4px 14px rgba(45,90,27,0.3)' }}>
            {loading ? 'Sending…' : `Send ${isPhone ? 'Text' : 'Email'} Code`}
          </button>
          <div style={{ textAlign:'center', marginTop:16, fontSize:12, color:'#94A3B8' }}>
            <a href="/login" style={{ color:'#4A7C2F', textDecoration:'none' }}>Staff? Sign in here →</a>
          </div>
        </>)}

        {step === 'otp' && (<>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:40, marginBottom:10 }}>{via === 'sms' ? '📱' : '📧'}</div>
            <div style={{ fontSize:19, fontWeight:700, color:'#1A3A0A', marginBottom:6 }}>Enter Your Code</div>
            <div style={{ fontSize:13.5, color:'#5A7050', lineHeight:1.65 }}>We sent a 6-digit code to<br/><strong style={{ color:'#1A3A0A' }}>{contact}</strong></div>
          </div>
          <div style={{ marginBottom:20 }}>
            <input type="text" inputMode="numeric" maxLength={6} value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
              onKeyDown={e => e.key === 'Enter' && verifyOTP()}
              placeholder="000000" autoFocus
              style={{ width:'100%', padding:'16px', fontSize:28, fontWeight:700, textAlign:'center', letterSpacing:12, border:'2px solid #C8DDB8', borderRadius:12, outline:'none', fontFamily:'monospace', boxSizing:'border-box' }}
            />
          </div>
          {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#DC2626', marginBottom:14 }}>{error}</div>}
          <button onClick={verifyOTP} disabled={loading || otp.length !== 6}
            style={{ width:'100%', padding:13, fontSize:15, fontWeight:600, background:(loading||otp.length!==6)?'#94A3B8':'linear-gradient(135deg,#2D5A1B,#4A7C2F)', color:'#fff', border:'none', borderRadius:10, cursor:(loading||otp.length!==6)?'not-allowed':'pointer', fontFamily:'inherit' }}>
            {loading ? 'Verifying…' : 'Sign In →'}
          </button>
          <button onClick={() => { setStep('contact'); setOtp(''); setError('') }}
            style={{ width:'100%', marginTop:10, background:'none', border:'none', color:'#5A7050', cursor:'pointer', fontSize:13, fontWeight:500 }}>
            ← Try a different email or phone
          </button>
          <div style={{ textAlign:'center', marginTop:12, fontSize:12, color:'#94A3B8' }}>Code expires in 15 minutes</div>
        </>)}

        {step === 'success' && (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:14 }}>✅</div>
            <div style={{ fontSize:20, fontWeight:700, color:'#1A3A0A', marginBottom:8 }}>Signed in!</div>
            <div style={{ fontSize:14, color:'#5A7050' }}>Taking you to your portal…</div>
          </div>
        )}
      </div>
    </div>
  )
}
