"use client"
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function Content() {
  const params = useSearchParams()
  const answer = params.get('answer')
  return (
    <div style={{ minHeight:'100vh', background:'#F0F4F8', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Segoe UI',Arial,sans-serif" }}>
      <div style={{ background:'#fff', borderRadius:16, padding:'48px 40px', maxWidth:440, width:'100%', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize:36, marginBottom:16 }}>🔄</div>
        <div style={{ fontSize:20, fontWeight:700, color:'#334155', marginBottom:12 }}>Already Responded</div>
        <div style={{ fontSize:14, color:'#64748B', lineHeight:1.7 }}>
          You already responded <strong>{answer === 'yes' ? 'Yes' : 'No'}</strong> to this case. Each link can only be used once.
          <br/><br/>If you need to change your response, please contact your coordinator directly.
        </div>
      </div>
    </div>
  )
}
export default function AlreadyRespondedPage() { return <Suspense><Content /></Suspense> }
