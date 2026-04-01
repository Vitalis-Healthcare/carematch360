"use client"
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function Content() {
  const params = useSearchParams()
  const reason = params.get('reason') ?? ''

  const message = reason === 'db'
    ? 'System configuration error — the response tracking table may not be set up yet. Please contact your coordinator.'
    : reason === 'notfound'
    ? 'This response link was not found. It may be from an earlier test. Please use the link from the most recent email.'
    : 'This response link is invalid or has already been used.'

  return (
    <div style={{ minHeight:'100vh', background:'#F0F4F8', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Segoe UI',Arial,sans-serif" }}>
      <div style={{ background:'#fff', borderRadius:16, padding:'48px 40px', maxWidth:460, width:'100%', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize:36, marginBottom:16 }}>⚠️</div>
        <div style={{ fontSize:20, fontWeight:700, color:'#334155', marginBottom:12 }}>Invalid Link</div>
        <div style={{ fontSize:14, color:'#64748B', lineHeight:1.7 }}>{message}</div>
        <div style={{ marginTop:24, fontSize:12, color:'#94A3B8' }}>Vitalis Healthcare Services · Silver Spring, MD</div>
      </div>
    </div>
  )
}

export default function InvalidPage() {
  return <Suspense><Content /></Suspense>
}
