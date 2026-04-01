"use client"
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ThankYouContent() {
  const params = useSearchParams()
  const answer = params.get('answer')

  const config = {
    yes: {
      icon: '✓', iconBg: '#ECFDF5', iconColor: '#065F46',
      title: 'Great — we got your confirmation!',
      body: 'Your coordinator will be in touch shortly with the full case details and schedule confirmation.',
    },
    no: {
      icon: '✗', iconBg: '#F1F5F9', iconColor: '#334155',
      title: "Thanks for letting us know",
      body: "No problem. We'll reach out when another case matches your availability.",
    },
    maybe: {
      icon: '💬', iconBg: '#FEF9C3', iconColor: '#92400E',
      title: 'Got it — your coordinator will call you',
      body: "We've notified your coordinator that you have questions about this case. Expect a call or email shortly to discuss the details before you commit.",
    },
  }[answer ?? 'yes'] ?? {
    icon: '✓', iconBg: '#ECFDF5', iconColor: '#065F46',
    title: 'Response recorded', body: 'Thank you.',
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F0F4F8', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Segoe UI',Arial,sans-serif" }}>
      <div style={{ background:'#fff', borderRadius:16, padding:'48px 40px', maxWidth:480, width:'100%', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:config.iconBg, color:config.iconColor, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:32 }}>
          {config.icon}
        </div>
        <div style={{ fontSize:22, fontWeight:700, color:'#1E293B', marginBottom:12 }}>{config.title}</div>
        <div style={{ fontSize:15, color:'#64748B', lineHeight:1.7, marginBottom:28 }}>{config.body}</div>
        <div style={{ borderTop:'1px solid #E2E8F0', paddingTop:24, fontSize:13, color:'#94A3B8' }}>
          <div style={{ fontWeight:600, color:'#0B3D5C', marginBottom:4 }}>Vitalis Healthcare Services</div>
          Silver Spring, MD
        </div>
      </div>
    </div>
  )
}

export default function ThankYouPage() {
  return <Suspense><ThankYouContent /></Suspense>
}
