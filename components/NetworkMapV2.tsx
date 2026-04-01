"use client"
import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

const CRED_COLORS: Record<string,string> = {
  RN:'#0EA5E9', LPN:'#8B5CF6', CNA:'#10B981', GNA:'#14B8A6',
  CMT:'#F59E0B', PT:'#EF4444', OT:'#EC4899', ST:'#6366F1', UA:'#84CC16',
}
const CRED_LABELS: Record<string,string> = {
  RN:'Registered Nurse', LPN:'Licensed Practical Nurse', CNA:'Certified Nursing Assistant',
  GNA:'Geriatric Nursing Assistant', CMT:'Cert. Medication Technician',
  PT:'Physical Therapist', OT:'Occupational Therapist', ST:'Speech Therapist', UA:'Unlicensed Aide',
}

function haversine(lat1:number,lng1:number,lat2:number,lng2:number):number {
  const R=3958.8,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}
function urgencyColor(u:string):string {
  if(u==='emergency') return '#EF4444'
  if(u==='urgent') return '#F59E0B'
  return '#0B3D5C'
}

type FocusItem = { id:string; type:'client'|'case'; label:string; sublabel:string; lat:number; lng:number; required_credential:string|null; required_skills:string[] }

interface Props { providers:any[]; clients:any[]; cases:any[] }

export default function NetworkMapV2({ providers, clients, cases }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const popupRef = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)

  // ── State (mirrors original exactly) ──────────────────────────
  const [focusIds, setFocusIds] = useState<string[]>([])
  const [searchQ, setSearchQ] = useState('')
  const [tab, setTab] = useState<'clients'|'cases'>('clients')
  const [proximityMiles, setProximityMiles] = useState(15)
  const [showAllProviders, setShowAllProviders] = useState(false)
  const [credFilter, setCredFilter] = useState<string[]>([])

  // ── Derived data ───────────────────────────────────────────────
  const focusItems = useMemo(():FocusItem[] => {
    const items:FocusItem[] = []
    clients.forEach(c => {
      if(c.lat==null||c.lng==null) return
      items.push({ id:c.id, type:'client', label:c.name,
        sublabel:`${c.required_credential??'Any'} · ${c.city??''} · ${(c.urgency_level||'routine').toUpperCase()}`,
        lat:c.lat, lng:c.lng, required_credential:c.required_credential, required_skills:c.required_skills??[] })
    })
    cases.forEach(cs => {
      const cl = Array.isArray(cs.clients)?cs.clients[0]:cs.clients
      if(cl?.lat==null||cl?.lng==null) return
      items.push({ id:cs.id, type:'case', label:cs.title,
        sublabel:`${cs.required_credential} · ${cl?.city??''} · ${(cs.urgency||'routine').toUpperCase()}`,
        lat:cl.lat, lng:cl.lng, required_credential:cs.required_credential, required_skills:cs.required_skills??[] })
    })
    return items
  }, [clients, cases])

  const filtered = useMemo(() => focusItems.filter(item => {
    if(tab==='clients'&&item.type!=='client') return false
    if(tab==='cases'&&item.type!=='case') return false
    if(searchQ&&!item.label.toLowerCase().includes(searchQ.toLowerCase())&&!item.sublabel.toLowerCase().includes(searchQ.toLowerCase())) return false
    return true
  }), [focusItems, tab, searchQ])

  const toggleFocus = useCallback((id:string) => {
    setFocusIds(prev => {
      if(prev.includes(id)) return prev.filter(x=>x!==id)
      if(prev.length>=3) return [...prev.slice(1),id]
      return [...prev,id]
    })
  }, [])

  const selectedItems = useMemo(() => focusItems.filter(i=>focusIds.includes(i.id)), [focusIds, focusItems])

  const nearbyProviders = useMemo(() => {
    if(selectedItems.length===0) return []
    const seen = new Set<string>()
    const result:any[] = []
    selectedItems.forEach(item => {
      providers.forEach(p => {
        if(p.lat==null||p.lng==null) return
        if(seen.has(p.id)) return
        const dist = haversine(item.lat, item.lng, p.lat, p.lng)
        if(dist>proximityMiles) return
        if(credFilter.length>0&&!credFilter.includes(p.credential_type)) return
        if(!showAllProviders&&item.required_credential&&p.credential_type!==item.required_credential) return
        seen.add(p.id)
        result.push({...p, _dist:dist, _forItem:item.id})
      })
    })
    return result.sort((a,b)=>a._dist-b._dist)
  }, [selectedItems, providers, proximityMiles, showAllProviders, credFilter])

  const allCredsPresent = useMemo(() => [...new Set(providers.map(p=>p.credential_type))].sort(), [providers])

  // ── Load Mapbox GL JS ──────────────────────────────────────────
  useEffect(() => {
    if(typeof window==='undefined') return
    if((window as any).mapboxgl) { setLoaded(true); return }
    const link = document.createElement('link')
    link.rel='stylesheet'; link.href='https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css'
    document.head.appendChild(link)
    const script = document.createElement('script')
    script.src='https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js'
    script.onload=()=>setLoaded(true)
    document.head.appendChild(script)
  }, [])

  // ── Init map ───────────────────────────────────────────────────
  useEffect(() => {
    if(!loaded||!containerRef.current||mapRef.current) return
    const mapboxgl = (window as any).mapboxgl
    mapboxgl.accessToken = TOKEN
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-77.05, 39.05],
      zoom: 9,
    })
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.addControl(new mapboxgl.ScaleControl(), 'bottom-right')
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [loaded])

  // ── Render markers whenever data changes ───────────────────────
  useEffect(() => {
    if(!mapRef.current||!loaded) return
    const mapboxgl = (window as any).mapboxgl
    const map = mapRef.current

    // Clear old markers + popup
    markersRef.current.forEach(m=>m.remove())
    markersRef.current=[]
    if(popupRef.current) { popupRef.current.remove(); popupRef.current=null }

    function makePopup(html:string, lat:number, lng:number) {
      if(popupRef.current) popupRef.current.remove()
      popupRef.current = new mapboxgl.Popup({ closeButton:true, maxWidth:'260px', offset:12 })
        .setLngLat([lng, lat])
        .setHTML(html)
        .addTo(map)
    }

    if(selectedItems.length===0) {
      // ── OVERVIEW MODE ──
      // Clients as teardrop pins
      clients.filter(c=>c.lat!=null&&c.lng!=null).forEach(c => {
        const uc = urgencyColor(c.urgency_level||'routine')
        const el = document.createElement('div')
        el.innerHTML = `<svg width="22" height="30" viewBox="0 0 22 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 0C4.925 0 0 4.925 0 11c0 8.25 11 19 11 19s11-10.75 11-19C22 4.925 17.075 0 11 0z" fill="${uc}"/>
          <circle cx="11" cy="11" r="5" fill="white" fill-opacity="0.9"/>
        </svg>`
        el.style.cssText='cursor:pointer;'
        el.addEventListener('click', e => {
          e.stopPropagation()
          makePopup(`<div style="font-family:sans-serif;min-width:170px">
            <strong style="font-size:13px">📍 ${c.name}</strong>
            ${c.required_credential?`<div style="font-size:11px;color:#0369A1;margin-top:3px">${c.required_credential} — ${CRED_LABELS[c.required_credential]??''}</div>`:''}
            <div style="font-size:11px;color:#64748B;margin-top:2px">${c.city??''} · ${c.urgency_level||'routine'}</div>
            <div style="margin-top:6px"><a href="/clients/${c.id}" style="font-size:11px;color:#0EA5E9;font-weight:600">View client →</a></div>
          </div>`, c.lat, c.lng)
        })
        const m = new mapboxgl.Marker({element:el, anchor:'bottom'}).setLngLat([c.lng,c.lat]).addTo(map)
        markersRef.current.push(m)
      })
      // Providers as coloured circles
      providers.filter(p=>p.lat!=null&&p.lng!=null).slice(0,150).forEach(p => {
        const color = CRED_COLORS[p.credential_type]??'#64748B'
        const el = document.createElement('div')
        el.style.cssText=`width:28px;height:28px;border-radius:50%;background:${p.available?color:'#94A3B8'};border:2px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;
          font-size:9px;font-weight:800;color:white;font-family:sans-serif;`
        el.textContent = p.credential_type?.slice(0,3)??'?'
        el.addEventListener('click', e => {
          e.stopPropagation()
          makePopup(`<div style="font-family:sans-serif;min-width:170px">
            <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px">
              <div style="width:9px;height:9px;border-radius:50%;background:${color}"></div>
              <strong style="font-size:13px">${p.name}</strong>
            </div>
            <div style="font-size:11px;font-weight:600;color:${color}">${p.credential_type} — ${CRED_LABELS[p.credential_type]??''}</div>
            <div style="font-size:11px;color:#64748B;margin-top:2px">${p.city??''} · ${p.service_radius_miles}mi radius</div>
            <div style="font-size:11px;color:${p.available?'#10B981':'#EF4444'};margin-top:2px">${p.available?'✓ Available':'✗ Unavailable'}</div>
          </div>`, p.lat, p.lng)
        })
        const m = new mapboxgl.Marker({element:el, anchor:'center'}).setLngLat([p.lng,p.lat]).addTo(map)
        markersRef.current.push(m)
      })

    } else {
      // ── FOCUS MODE ──
      // Selected clients/cases as large lettered teardrops
      selectedItems.forEach((item, idx) => {
        const uc = item.type==='client'
          ? urgencyColor(clients.find(c=>c.id===item.id)?.urgency_level||'routine')
          : urgencyColor(cases.find(c=>c.id===item.id)?.urgency||'routine')
        const letter = idx===0?'A':idx===1?'B':'C'
        const el = document.createElement('div')
        el.innerHTML = `<svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26S32 28 32 16C32 7.163 24.837 0 16 0z" fill="${uc}"/>
          <text x="16" y="21" text-anchor="middle" fill="white" font-size="13" font-weight="800" font-family="sans-serif">${letter}</text>
        </svg>`
        el.style.cssText='cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));'
        el.addEventListener('click', e => {
          e.stopPropagation()
          makePopup(`<div style="font-family:sans-serif;min-width:180px">
            <div style="font-size:11px;font-weight:700;color:white;background:${uc};padding:2px 8px;border-radius:4px;display:inline-block;margin-bottom:6px">${item.type==='case'?'CASE':'CLIENT'} ${letter}</div>
            <strong style="font-size:13px;display:block;margin-bottom:3px">${item.label}</strong>
            <div style="font-size:11px;color:#64748B">${item.sublabel}</div>
            ${item.required_credential?`<div style="font-size:11px;margin-top:4px;color:#0369A1;font-weight:600">Needs: ${item.required_credential}</div>`:''}
            <div style="margin-top:6px"><a href="/${item.type==='case'?'cases':'clients'}/${item.id}" style="font-size:11px;color:#0EA5E9;font-weight:600">View ${item.type} →</a></div>
          </div>`, item.lat, item.lng)
        })
        const m = new mapboxgl.Marker({element:el, anchor:'bottom'}).setLngLat([item.lng,item.lat]).addTo(map)
        markersRef.current.push(m)
      })

      // Nearby providers as numbered circles
      nearbyProviders.forEach((p, i) => {
        const color = CRED_COLORS[p.credential_type]??'#64748B'
        const credMatch = selectedItems.some(it=>it.required_credential===p.credential_type)
        const skills = (p.skills||[]).slice(0,5)
        const el = document.createElement('div')
        el.style.cssText=`width:${credMatch?34:28}px;height:${credMatch?34:28}px;border-radius:50%;background:${p.available?color:'#94A3B8'};
          border:${credMatch?'3px solid white':'2px solid white'};
          box-shadow:${credMatch?`0 0 0 2px ${color}88,`:''}0 3px 10px rgba(0,0,0,0.25);
          cursor:pointer;display:flex;align-items:center;justify-content:center;
          font-size:11px;font-weight:800;color:white;font-family:sans-serif;`
        el.textContent = String(i+1)
        el.addEventListener('click', e => {
          e.stopPropagation()
          makePopup(`<div style="font-family:sans-serif;min-width:200px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
              <div style="width:22px;height:22px;border-radius:50%;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${i+1}</div>
              <strong style="font-size:13px">${p.name}</strong>
            </div>
            <div style="font-size:11px;font-weight:700;color:${color};margin-bottom:4px">${p.credential_type} — ${CRED_LABELS[p.credential_type]??''}</div>
            ${credMatch?`<div style="font-size:10px;background:#ECFDF5;color:#065F46;padding:1px 7px;border-radius:10px;display:inline-block;margin-bottom:5px">✓ Credential match</div>`:''}
            <div style="font-size:11px;color:#64748B;margin-bottom:2px">📍 ${p.city??''} · <strong>${p._dist.toFixed(1)} mi away</strong></div>
            <div style="font-size:11px;color:#64748B;margin-bottom:4px">⊙ Serves up to ${p.service_radius_miles} mi</div>
            <div style="font-size:11px;color:${p.available?'#10B981':'#EF4444'};margin-bottom:5px">${p.available?'✓ Available':'✗ Unavailable'}</div>
            ${skills.length>0?`<div>${skills.map((s:string)=>`<span style="font-size:10px;padding:1px 5px;background:#F1F5F9;border-radius:8px;margin:1px;display:inline-block">${s}</span>`).join('')}</div>`:''}
            <div style="margin-top:7px;border-top:1px solid #E2E8F0;padding-top:6px;display:flex;gap:8px">
              <a href="/providers/${p.id}" style="font-size:11px;color:#0EA5E9;font-weight:600">View profile →</a>
              <a href="/cases/new" style="font-size:11px;color:#10B981;font-weight:600">Open case</a>
            </div>
          </div>`, p.lat, p.lng)
        })
        const m = new mapboxgl.Marker({element:el, anchor:'center'}).setLngLat([p.lng,p.lat]).addTo(map)
        markersRef.current.push(m)
      })

      // Fly to fit all visible pins
      const allPoints = [
        ...selectedItems.map(i => [i.lng, i.lat]),
        ...nearbyProviders.slice(0, 30).map((p:any) => [p.lng, p.lat]),
      ]
      if(allPoints.length>0) {
        const lngs = allPoints.map(p=>p[0])
        const lats = allPoints.map(p=>p[1])
        const bounds: [[number,number],[number,number]] = [
          [Math.min(...lngs)-0.05, Math.min(...lats)-0.05],
          [Math.max(...lngs)+0.05, Math.max(...lats)+0.05],
        ]
        map.fitBounds(bounds, { padding:{top:60,bottom:60,left:60,right:60}, maxZoom:13, duration:800 })
      }
    }
  }, [loaded, selectedItems, nearbyProviders, clients, cases, providers])

  // ── Styles ────────────────────────────────────────────────────
  const S: any = {
    card: { background:'#fff', border:'1px solid #E2E8F0', borderRadius:10, padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
    sectionLabel: { fontWeight:600, fontSize:13, color:'#0B2D45', marginBottom:8 },
    muted: { color:'#64748B' },
    chip: (on:boolean, color:string) => ({ padding:'2px 9px', borderRadius:12, fontSize:11, fontWeight:700, cursor:'pointer', border:`1.5px solid ${on?color:'#E2E8F0'}`, background:on?color+'22':'transparent', color:on?color:'#64748B' }),
    tealBtn: { background:'#0B3D5C', color:'#fff', border:'none', borderRadius:6, padding:'3px 10px', fontSize:11, cursor:'pointer' },
  }

  return (
    <div style={{display:'grid', gridTemplateColumns:'300px 1fr', gap:16, alignItems:'start', fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif'}}>

      {/* ── LEFT PANEL (identical logic to original) ── */}
      <div style={{display:'flex', flexDirection:'column', gap:12}}>

        {/* Select Focus */}
        <div style={S.card}>
          <div style={S.sectionLabel}>
            Select Focus
            <span style={{fontSize:11, color:'#64748B', fontWeight:400, marginLeft:6}}>up to 3 clients or cases</span>
          </div>
          {/* Tabs */}
          <div style={{display:'flex', border:'1px solid #E2E8F0', borderRadius:7, overflow:'hidden', marginBottom:10}}>
            {(['clients','cases'] as const).map(t => (
              <button key={t} onClick={()=>setTab(t)} style={{
                flex:1, padding:'6px', fontSize:12, fontWeight:500, border:'none', cursor:'pointer',
                background:tab===t?'#0B3D5C':'#F8FAFC', color:tab===t?'#fff':'#64748B',
              }}>
                {t==='clients'?`Clients (${clients.filter(c=>c.lat!=null).length})`:`Cases (${cases.length})`}
              </button>
            ))}
          </div>
          {/* Search */}
          <input placeholder={`Search ${tab}...`} value={searchQ} onChange={e=>setSearchQ(e.target.value)}
            style={{width:'100%', padding:'7px 10px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:12, outline:'none', boxSizing:'border-box', marginBottom:8}}
          />
          {/* List */}
          <div style={{maxHeight:280, overflowY:'auto', display:'flex', flexDirection:'column', gap:4}}>
            {filtered.length===0 && (
              <div style={{padding:'16px', textAlign:'center', color:'#94A3B8', fontSize:12}}>
                {tab==='clients'?'No mapped clients found':'No open cases found'}
              </div>
            )}
            {filtered.map(item => {
              const isSelected = focusIds.includes(item.id)
              const idx = focusIds.indexOf(item.id)
              const letter = idx===-1?'':(idx===0?'A':idx===1?'B':'C')
              return (
                <div key={item.id} onClick={()=>toggleFocus(item.id)} style={{
                  padding:'8px 10px', borderRadius:7, cursor:'pointer',
                  border:`1.5px solid ${isSelected?'#0E9FA3':'#E2E8F0'}`,
                  background:isSelected?'#F0FDFF':'#F8FAFC', transition:'all 0.12s',
                }}>
                  <div style={{display:'flex', alignItems:'center', gap:7}}>
                    <div style={{width:20, height:20, borderRadius:'50%', flexShrink:0,
                      background:isSelected?'#0E9FA3':'#E2E8F0', color:isSelected?'#fff':'#94A3B8',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700,
                    }}>{isSelected?letter:'+'}</div>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontSize:12.5, fontWeight:500, color:isSelected?'#0B2D45':'#334155', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{item.label}</div>
                      <div style={{fontSize:10.5, color:'#64748B', marginTop:1}}>{item.sublabel}</div>
                    </div>
                    {item.required_credential && (
                      <span style={{fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:4, flexShrink:0,
                        background:(CRED_COLORS[item.required_credential]??'#64748B')+'22',
                        color:CRED_COLORS[item.required_credential]??'#64748B',
                      }}>{item.required_credential}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected items */}
        {selectedItems.length>0 && (
          <div style={S.card}>
            <div style={{...S.sectionLabel, marginBottom:8}}>Selected ({selectedItems.length}/3)</div>
            {selectedItems.map((item,idx) => (
              <div key={item.id} style={{display:'flex', alignItems:'center', gap:7, marginBottom:6}}>
                <div style={{width:20, height:20, borderRadius:'50%', background:'#0E9FA3', color:'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0}}>
                  {idx===0?'A':idx===1?'B':'C'}
                </div>
                <div style={{flex:1, minWidth:0, fontSize:12, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{item.label}</div>
                <button onClick={()=>toggleFocus(item.id)} style={{background:'none', border:'none', color:'#94A3B8', cursor:'pointer', fontSize:14, padding:'0 2px'}}>✕</button>
              </div>
            ))}
            <button onClick={()=>setFocusIds([])} style={{width:'100%', marginTop:4, padding:'5px', fontSize:11, color:'#64748B', background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:6, cursor:'pointer'}}>
              Clear selection
            </button>
          </div>
        )}

        {/* Proximity controls */}
        {selectedItems.length>0 && (
          <div style={S.card}>
            <div style={S.sectionLabel}>Proximity Filter</div>
            <div style={{marginBottom:12}}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6}}>
                <span style={S.muted}>Search radius</span>
                <span style={{fontFamily:'monospace', fontWeight:600, color:'#0B2D45'}}>{proximityMiles} mi</span>
              </div>
              <input type="range" min={5} max={50} step={5} value={proximityMiles}
                onChange={e=>setProximityMiles(Number(e.target.value))}
                style={{width:'100%', accentColor:'#0E9FA3'}}/>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:10, color:'#94A3B8', marginTop:2}}>
                <span>5 mi</span><span>50 mi</span>
              </div>
            </div>
            <label style={{display:'flex', alignItems:'center', gap:7, cursor:'pointer', fontSize:12, marginBottom:8}}>
              <input type="checkbox" checked={showAllProviders} onChange={e=>setShowAllProviders(e.target.checked)} style={{accentColor:'#0E9FA3'}}/>
              <span>Show all credentials <span style={S.muted}>(not just required)</span></span>
            </label>
            <div style={{fontSize:11, color:'#64748B', marginBottom:6}}>Filter by credential:</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:4}}>
              {allCredsPresent.map(cred => {
                const on = credFilter.includes(cred)
                return (
                  <button key={cred} onClick={()=>setCredFilter(p=>p.includes(cred)?p.filter(x=>x!==cred):[...p,cred])}
                    style={S.chip(on, CRED_COLORS[cred]??'#64748B')}>{cred}</button>
                )
              })}
              {credFilter.length>0 && (
                <button onClick={()=>setCredFilter([])} style={{padding:'2px 9px', borderRadius:12, fontSize:11, cursor:'pointer', border:'1px solid #E2E8F0', background:'transparent', color:'#94A3B8'}}>✕ clear</button>
              )}
            </div>
          </div>
        )}

        {/* Nearby providers list */}
        {selectedItems.length>0 && (
          <div style={S.card}>
            <div style={S.sectionLabel}>
              Nearby Providers
              <span style={{fontFamily:'monospace', marginLeft:6, fontWeight:400, color:'#64748B'}}>{nearbyProviders.length}</span>
            </div>
            {nearbyProviders.length===0 ? (
              <div style={{fontSize:12, color:'#94A3B8', textAlign:'center', padding:'8px 0'}}>
                None found within {proximityMiles} mi
                {!showAllProviders&&selectedItems.some(i=>i.required_credential)&&
                  <div style={{marginTop:4, fontSize:11}}>Try "Show all credentials" above</div>}
              </div>
            ) : (
              <div style={{maxHeight:220, overflowY:'auto', display:'flex', flexDirection:'column', gap:6}}>
                {nearbyProviders.slice(0,20).map((p:any,i:number) => {
                  const color = CRED_COLORS[p.credential_type]??'#64748B'
                  return (
                    <div key={p.id} style={{display:'flex', alignItems:'center', gap:8, padding:'6px 8px', background:'#F8FAFC', borderRadius:7}}>
                      <div style={{width:22, height:22, borderRadius:'50%', background:color, color:'#fff',
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0}}>{i+1}</div>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontSize:12, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.name}</div>
                        <div style={{fontSize:10.5, color:'#64748B'}}>
                          <span style={{fontWeight:700, color}}>{p.credential_type}</span>
                          {' · '}{p._dist.toFixed(1)} mi
                          {p.available&&<span style={{color:'#10B981'}}> · ✓</span>}
                        </div>
                      </div>
                      <Link href={`/providers/${p.id}`}>
                        <span style={{fontSize:11, color:'#0EA5E9', fontWeight:600}}>→</span>
                      </Link>
                    </div>
                  )
                })}
                {nearbyProviders.length>20 && (
                  <div style={{fontSize:11, color:'#94A3B8', textAlign:'center', padding:'4px 0'}}>+{nearbyProviders.length-20} more · zoom into map to explore</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Hint */}
        {selectedItems.length===0 && (
          <div style={{background:'#F0FDFF', border:'1px solid #BAE6FD', borderRadius:8, padding:'12px 14px', fontSize:12, color:'#0B2D45'}}>
            <div style={{fontWeight:600, marginBottom:4}}>How to use</div>
            <div style={{color:'#0369A1', lineHeight:1.6}}>
              Select up to 3 clients or cases from the list above. The map will zoom in and show providers within your chosen radius — colour-coded by credential type, ranked by distance.
            </div>
          </div>
        )}

        {/* Legend */}
        <div style={S.card}>
          <div style={{fontSize:11, fontWeight:600, color:'#0B2D45', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em'}}>Credential Legend</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 8px'}}>
            {Object.entries(CRED_COLORS).map(([cred,color]) => (
              <div key={cred} style={{display:'flex', alignItems:'center', gap:5, fontSize:11}}>
                <div style={{width:8, height:8, borderRadius:'50%', background:color, flexShrink:0}}/>
                <strong>{cred}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAP ── */}
      <div style={{position:'sticky', top:20}}>
        <div style={{...S.card, overflow:'hidden', padding:0}}>
          {/* Header bar */}
          <div style={{padding:'10px 16px', borderBottom:'1px solid #E2E8F0', background:'#fff',
            display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div style={{fontSize:13, fontWeight:600, color:'#0B2D45'}}>
              {selectedItems.length===0
                ? `Overview — ${providers.filter(p=>p.lat!=null).length} providers · ${clients.filter(c=>c.lat!=null).length} clients`
                : `Focus: ${selectedItems.map((_,i)=>i===0?'A':i===1?'B':'C').join(' + ')} · ${nearbyProviders.length} providers within ${proximityMiles} mi`}
            </div>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              {selectedItems.length>0 && (
                <button onClick={()=>setFocusIds([])} style={{fontSize:11, color:'#64748B', background:'none', border:'1px solid #E2E8F0', borderRadius:5, padding:'3px 10px', cursor:'pointer'}}>
                  ← Back to overview
                </button>
              )}
              <a href="/map" style={{fontSize:11, color:'#0EA5E9', textDecoration:'none', fontWeight:500, padding:'3px 10px', border:'1px solid #BAE6FD', borderRadius:5, background:'#F0F9FF'}}>Map v1</a>
            </div>
          </div>

          {!loaded && (
            <div style={{height:580, display:'flex', alignItems:'center', justifyContent:'center', background:'#F8FAFC', flexDirection:'column', gap:12}}>
              <div style={{fontSize:32}}>🗺️</div>
              <div style={{fontSize:14, color:'#64748B'}}>Loading Mapbox...</div>
            </div>
          )}
          <div ref={containerRef} style={{width:'100%', height:580, display:loaded?'block':'none'}}/>
        </div>

        {/* Stats row */}
        {selectedItems.length===0 && (
          <div style={{display:'flex', gap:10, marginTop:10, flexWrap:'wrap'}}>
            {Object.entries(CRED_COLORS).map(([cred,color]) => {
              const count = providers.filter(p=>p.credential_type===cred&&p.lat!=null).length
              if(!count) return null
              return (
                <div key={cred} style={{background:'#fff', border:'1px solid #E2E8F0', borderRadius:7, padding:'6px 12px', display:'flex', alignItems:'center', gap:5, fontSize:12}}>
                  <div style={{width:8, height:8, borderRadius:'50%', background:color}}/>
                  <strong>{cred}</strong>
                  <span style={{color:'#64748B', fontFamily:'monospace'}}>{count}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
