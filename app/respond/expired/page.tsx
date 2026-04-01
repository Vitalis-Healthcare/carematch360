export default function ExpiredPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#F0F4F8', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Segoe UI',Arial,sans-serif" }}>
      <div style={{ background:'#fff', borderRadius:16, padding:'48px 40px', maxWidth:440, width:'100%', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize:36, marginBottom:16 }}>⏱</div>
        <div style={{ fontSize:20, fontWeight:700, color:'#334155', marginBottom:12 }}>Link Expired</div>
        <div style={{ fontSize:14, color:'#64748B', lineHeight:1.7 }}>
          This response link has expired (links are valid for 48 hours).<br/><br/>
          Please contact your coordinator if you are still interested in this case.
        </div>
      </div>
    </div>
  )
}
