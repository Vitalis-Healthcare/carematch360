"use client"
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function VerifyContent() {
  const params = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<'verifying'|'success'|'error'>('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Invalid link.'); return }
    fetch('/api/auth/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then(r => r.json()).then(data => {
      if (data.success) {
        setStatus('success')
        setTimeout(() => window.location.href = data.redirect, 1000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Link expired or already used.')
      }
    }).catch(() => { setStatus('error'); setMessage('Something went wrong.') })
  }, [token])

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0B2D45,#0D3A55)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Segoe UI',sans-serif" }}>
      <div style={{ background:'#fff', borderRadius:20, padding:'48px 44px', maxWidth:400, width:'100%', textAlign:'center', boxShadow:'0 24px 64px rgba(0,0,0,0.25)' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>
          {status === 'verifying' ? '⏳' : status === 'success' ? '✅' : '❌'}
        </div>
        <div style={{ fontSize:20, fontWeight:700, color:'#0B2D45', marginBottom:10 }}>
          {status === 'verifying' ? 'Signing you in…' : status === 'success' ? 'Signed in!' : 'Link Invalid'}
        </div>
        <div style={{ fontSize:14, color:'#64748B' }}>
          {status === 'verifying' ? 'Please wait a moment.' : status === 'success' ? 'Redirecting you now…' : message}
        </div>
        {status === 'error' && (
          <a href="/login" style={{ display:'inline-block', marginTop:20, background:'#0B3D5C', color:'#fff', textDecoration:'none', padding:'10px 24px', borderRadius:8, fontWeight:600, fontSize:13 }}>← Back to Login</a>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return <Suspense><VerifyContent /></Suspense>
}
