type BadgeVariant = 'green'|'amber'|'red'|'navy'|'teal'|'gray'|'purple'
const V: Record<BadgeVariant,{bg:string;color:string;border:string}> = {
  green:  {bg:'var(--green-bg)', color:'#065F46',      border:'#A7F3D0'},
  amber:  {bg:'var(--amber-bg)', color:'#92400E',      border:'#FDE68A'},
  red:    {bg:'var(--red-bg)',   color:'#991B1B',      border:'#FECACA'},
  navy:   {bg:'#EFF6FF',        color:'var(--navy)',   border:'#BFDBFE'},
  teal:   {bg:'var(--teal-light)',color:'#0369A1',     border:'#BAE6FD'},
  gray:   {bg:'#F1F5F9',        color:'#475569',       border:'#E2E8F0'},
  purple: {bg:'var(--purple-bg)',color:'#5B21B6',      border:'#DDD6FE'},
}
export function getStatusVariant(status: string): BadgeVariant {
  const s = status?.toLowerCase()
  if (['active','available','completed','accepted','matched','assigned'].includes(s)) return 'green'
  if (['urgent','pending','notified','matching','open'].includes(s)) return 'amber'
  if (['emergency','declined','cancelled','suspended'].includes(s)) return 'red'
  if (['inactive'].includes(s)) return 'gray'
  return 'gray'
}
interface Props { label:string; variant?:BadgeVariant; status?:string; size?:'sm'|'md' }
export default function StatusBadge({label,variant,status,size='md'}:Props) {
  const v = variant||(status?getStatusVariant(status):'gray')
  const st = V[v]
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:size==='sm'?'2px 8px':'3px 10px',borderRadius:20,fontSize:size==='sm'?11:12,fontWeight:600,background:st.bg,color:st.color,border:`1px solid ${st.border}`,whiteSpace:'nowrap'}}>
      <span style={{width:size==='sm'?5:6,height:size==='sm'?5:6,borderRadius:'50%',background:st.color,flexShrink:0}}/>
      {label}
    </span>
  )
}
