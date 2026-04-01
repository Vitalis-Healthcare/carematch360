"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps { role?: string; userName?: string }

export default function Sidebar({ role = 'coordinator', userName = '' }: SidebarProps) {
  const path = usePathname()
  const isActive = (href: string) => path === href || path.startsWith(href + '/')

  const S: any = {
    sidebar: { width:200, minHeight:'100vh', background:'#0B2D45', display:'flex', flexDirection:'column', position:'fixed' as const, left:0, top:0, bottom:0, zIndex:50 },
    logo: { padding:'20px 18px 16px', borderBottom:'1px solid rgba(255,255,255,0.08)' },
    logoMark: { width:36, height:36, background:'linear-gradient(135deg,#0E9FA3,#06B6D4)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:8 },
    logoText: { fontWeight:700, fontSize:15, color:'#fff', letterSpacing:'-0.01em' },
    logoSub: { fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:1 },
    nav: { flex:1, padding:'12px 10px', overflowY:'auto' as const },
    section: { fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'0.1em', textTransform:'uppercase' as const, padding:'14px 8px 6px' },
    link: (active: boolean) => ({
      display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:8, marginBottom:2,
      fontSize:13, fontWeight: active ? 600 : 400,
      color: active ? '#fff' : 'rgba(255,255,255,0.55)',
      background: active ? 'rgba(14,159,163,0.2)' : 'transparent',
      textDecoration:'none', transition:'all 0.15s',
      borderLeft: active ? '2px solid #0E9FA3' : '2px solid transparent',
    }),
    footer: { padding:'14px 14px 18px', borderTop:'1px solid rgba(255,255,255,0.08)' },
    userBox: { fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:10, lineHeight:1.4 },
    userName: { color:'rgba(255,255,255,0.85)', fontWeight:600, fontSize:12.5 },
    roleBadge: { fontSize:10.5, color: role==='admin'?'#FCD34D':'rgba(255,255,255,0.4)', fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.04em' },
  }

  const navItems = [
    { section:'OVERVIEW', items:[
      { href:'/dashboard', icon:'🏠', label:'Dashboard' },
      { href:'/analytics', icon:'📊', label:'Analytics' },
      { href:'/map', icon:'🗺️', label:'Network Map' },
      { href:'/map2', icon:'✨', label:'Map v2 (Beta)' },
    ]},
    { section:'PEOPLE', items:[
      { href:'/providers', icon:'👤', label:'Providers' },
      { href:'/clients', icon:'🏡', label:'Clients' },
    ]},
    { section:'OPERATIONS', items:[
      { href:'/cases', icon:'📋', label:'Cases' },
    ]},
    { section:'INTEGRATIONS', items:[
      { href:'/axiscare', icon:'↓', label:'AxisCare Import' },
    ]},
    ...(role === 'admin' ? [{ section:'ADMIN', items:[
      { href:'/admin/users', icon:'👥', label:'Users' },
      { href:'/admin/geocode', icon:'📍', label:'Geocode Addresses' },
    ]}] : []),
  ]

  return (
    <div style={S.sidebar}>
      <div style={S.logo}>
        <div style={S.logoMark}>⌖</div>
        <div style={S.logoText}>CareMatch<span style={{ color:'#0E9FA3' }}>360</span></div>
        <div style={S.logoSub}>Vitalis Healthcare</div>
      </div>

      <nav style={S.nav}>
        {navItems.map(group => (
          <div key={group.section}>
            <div style={S.section}>{group.section}</div>
            {group.items.map(item => (
              <Link key={item.href} href={item.href} style={S.link(isActive(item.href))}>
                <span style={{ fontSize:14 }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div style={S.footer}>
        <div style={S.userBox}>
          <div style={S.userName}>{userName || 'Staff User'}</div>
          <div style={S.roleBadge}>{role === 'admin' ? '👑 Admin' : '🗂️ Coordinator'}</div>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button style={{ width:'100%', padding:'8px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:12.5, fontWeight:500 }}>
            Sign Out
          </button>
        </form>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.2)', marginTop:10, textAlign:'center' }}>Stage 2 · v2.4.5</div>
      </div>
    </div>
  )
}
