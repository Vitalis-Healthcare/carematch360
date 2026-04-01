import Link from 'next/link'
interface Breadcrumb { label:string; href?:string }
interface Props { title:string; subtitle?:string; breadcrumbs?:Breadcrumb[]; actions?:React.ReactNode }
export default function PageHeader({title,subtitle,breadcrumbs,actions}:Props) {
  return (
    <div style={{background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'20px 32px'}}>
      {breadcrumbs&&breadcrumbs.length>0&&(
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8,fontSize:12,color:'var(--muted)'}}>
          {breadcrumbs.map((b,i)=>(
            <span key={i} style={{display:'flex',alignItems:'center',gap:6}}>
              {b.href?<Link href={b.href} style={{color:'var(--teal)',fontWeight:500}}>{b.label}</Link>:<span>{b.label}</span>}
              {i<breadcrumbs.length-1&&<span style={{color:'var(--subtle)'}}>›</span>}
            </span>
          ))}
        </div>
      )}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:600,color:'var(--text)',lineHeight:1.2}}>{title}</h1>
          {subtitle&&<p style={{fontSize:13.5,color:'var(--muted)',marginTop:4}}>{subtitle}</p>}
        </div>
        {actions&&<div style={{display:'flex',gap:8,flexShrink:0}}>{actions}</div>}
      </div>
    </div>
  )
}
