"use client"
import { useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { type MapPin } from './LeafletMap'

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false, loading: () => (
  <div style={{width:'100%',height:'580px',background:'var(--bg)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)',fontSize:13}}>
    Loading map...
  </div>
) })

const CRED_COLORS: Record<string,string> = {
  RN:'#0EA5E9', LPN:'#8B5CF6', CNA:'#10B981', PT:'#F59E0B', OT:'#EF4444', ST:'#EC4899',
}
const CRED_LABELS: Record<string,string> = {
  RN:'Registered Nurse', LPN:'Licensed Practical Nurse', CNA:'Certified Nursing Assistant',
  PT:'Physical Therapist', OT:'Occupational Therapist', ST:'Speech Therapist',
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

interface Props {
  providers: any[]
  clients: any[]
  cases: any[]
}

type FocusItem = { id:string; type:'client'|'case'; label:string; sublabel:string; lat:number|null; lng:number|null; required_credential:string|null; required_skills:string[] }

export default function NetworkMapClient({ providers, clients, cases }: Props) {
  const [focusIds, setFocusIds] = useState<string[]>([])
  const [searchQ, setSearchQ] = useState('')
  const [tab, setTab] = useState<'clients'|'cases'>('clients')
  const [proximityMiles, setProximityMiles] = useState(15)
  const [showAllProviders, setShowAllProviders] = useState(false)
  const [credFilter, setCredFilter] = useState<string[]>([])

  // Build unified focus items list
  const focusItems = useMemo(():FocusItem[] => {
    const items:FocusItem[] = []
    clients.forEach(c => {
      if(c.lat==null||c.lng==null) return
      items.push({
        id:c.id, type:'client',
        label:c.name,
        sublabel:`${c.required_credential??'Any'} · ${c.city??''} · ${(c.urgency_level||'routine').toUpperCase()}`,
        lat:c.lat, lng:c.lng,
        required_credential:c.required_credential,
        required_skills:c.required_skills??[],
      })
    })
    cases.forEach(cs => {
      const cl = Array.isArray(cs.clients)?cs.clients[0]:cs.clients
      const lat = cl?.lat ?? null
      const lng = cl?.lng ?? null
      if(lat==null||lng==null) return
      items.push({
        id:cs.id, type:'case',
        label:cs.title,
        sublabel:`${cs.required_credential} · ${cl?.city??''} · ${(cs.urgency||'routine').toUpperCase()}`,
        lat, lng,
        required_credential:cs.required_credential,
        required_skills:cs.required_skills??[],
      })
    })
    return items
  }, [clients, cases])

  const filtered = useMemo(()=>focusItems.filter(item=>{
    if(tab==='clients'&&item.type!=='client') return false
    if(tab==='cases'&&item.type!=='case') return false
    if(searchQ&&!item.label.toLowerCase().includes(searchQ.toLowerCase())&&!item.sublabel.toLowerCase().includes(searchQ.toLowerCase())) return false
    return true
  }),[focusItems,tab,searchQ])

  const toggleFocus = useCallback((id:string)=>{
    setFocusIds(prev=>{
      if(prev.includes(id)) return prev.filter(x=>x!==id)
      if(prev.length>=3) return [...prev.slice(1),id] // slide window of 3
      return [...prev,id]
    })
  },[])

  const selectedItems = useMemo(()=>focusItems.filter(i=>focusIds.includes(i.id)),[focusIds,focusItems])

  // For each selected item, find providers in proximity + matching credential
  const nearbyProviders = useMemo(()=>{
    if(selectedItems.length===0) return []
    const seen = new Set<string>()
    const result:any[] = []
    selectedItems.forEach(item=>{
      if(item.lat==null||item.lng==null) return
      providers.forEach(p=>{
        if(p.lat==null||p.lng==null) return
        if(seen.has(p.id)) return
        const dist = haversine(item.lat!,item.lng!,p.lat,p.lng)
        if(dist>proximityMiles) return
        if(credFilter.length>0&&!credFilter.includes(p.credential_type)) return
        // Check credential match if item has a required credential
        if(!showAllProviders&&item.required_credential&&p.credential_type!==item.required_credential) return
        seen.add(p.id)
        result.push({...p, _dist:dist, _forItem:item.id})
      })
    })
    return result.sort((a,b)=>a._dist-b._dist)
  }, [selectedItems, providers, proximityMiles, showAllProviders, credFilter])

  // Build map pins
  const pins = useMemo(():MapPin[]=>{
    const result:MapPin[] = []

    if(selectedItems.length===0) {
      // Overview mode: show all mapped clients/providers lightly
      clients.forEach(c=>{
        if(c.lat==null||c.lng==null) return
        const uc = urgencyColor(c.urgency_level||'routine')
        result.push({
          id:c.id, lat:c.lat, lng:c.lng, type:'client', label:c.name, color:uc,
          popupHtml:`<div style="font-family:sans-serif;min-width:170px">
            <strong style="font-size:13px">📍 ${c.name}</strong>
            ${c.required_credential?`<div style="font-size:11px;color:#0369A1;margin-top:3px">${c.required_credential} — ${CRED_LABELS[c.required_credential]??''}</div>`:''}
            <div style="font-size:11px;color:#64748B;margin-top:2px">${c.city??''}, MD · ${c.urgency_level||'routine'}</div>
            <div style="margin-top:6px"><a href="/clients/${c.id}" style="font-size:11px;color:#0EA5E9;font-weight:600">View client →</a></div>
          </div>`,
        })
      })
      providers.filter(p=>p.lat!=null&&p.lng!=null).slice(0,100).forEach(p=>{
        const color = CRED_COLORS[p.credential_type]??'#64748B'
        result.push({
          id:p.id, lat:p.lat, lng:p.lng, type:'provider', label:p.name, color,
          popupHtml:`<div style="font-family:sans-serif;min-width:170px">
            <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px">
              <div style="width:9px;height:9px;border-radius:50%;background:${color}"></div>
              <strong style="font-size:13px">${p.name}</strong>
            </div>
            <div style="font-size:11px;font-weight:600;color:${color}">${p.credential_type} — ${CRED_LABELS[p.credential_type]??''}</div>
            <div style="font-size:11px;color:#64748B;margin-top:2px">${p.city??''}, MD · ${p.service_radius_miles}mi radius</div>
            <div style="font-size:11px;color:${p.available?'#10B981':'#EF4444'};margin-top:2px">${p.available?'✓ Available':'✗ Unavailable'}</div>
          </div>`,
        })
      })
      return result
    }

    // Focus mode: selected client(s) + nearby providers
    selectedItems.forEach((item,idx)=>{
      if(item.lat==null||item.lng==null) return
      const uc = item.type==='client'
        ? urgencyColor(clients.find(c=>c.id===item.id)?.urgency_level||'routine')
        : urgencyColor(cases.find(c=>c.id===item.id)?.urgency||'routine')
      result.push({
        id:item.id, lat:item.lat!, lng:item.lng!, type:'client', label:item.label,
        color:uc,
        popupHtml:`<div style="font-family:sans-serif;min-width:180px">
          <div style="font-size:11px;font-weight:700;color:#fff;background:${uc};padding:2px 8px;border-radius:4px;display:inline-block;margin-bottom:6px">${item.type==='case'?'CASE':'CLIENT'} ${idx===0?'A':idx===1?'B':'C'}</div>
          <strong style="font-size:13px;display:block;margin-bottom:3px">${item.label}</strong>
          <div style="font-size:11px;color:#64748B">${item.sublabel}</div>
          ${item.required_credential?`<div style="font-size:11px;margin-top:4px;color:#0369A1;font-weight:600">Needs: ${item.required_credential}</div>`:''}
          <div style="margin-top:6px"><a href="/${item.type==='case'?'cases':'clients'}/${item.id}" style="font-size:11px;color:#0EA5E9;font-weight:600">View ${item.type} →</a></div>
        </div>`,
      })
    })

    // Nearby providers with ranking
    nearbyProviders.forEach((p,i)=>{
      const color = CRED_COLORS[p.credential_type]??'#64748B'
      const credMatch = selectedItems.some(it=>it.required_credential===p.credential_type)
      const skills = (p.skills||[]).slice(0,5)
      result.push({
        id:p.id, lat:p.lat, lng:p.lng, type:'provider', label:`${i+1}. ${p.name}`, color,
        popupHtml:`<div style="font-family:sans-serif;min-width:200px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <div style="width:22px;height:22px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${i+1}</div>
            <strong style="font-size:13px">${p.name}</strong>
          </div>
          <div style="font-size:11px;font-weight:700;color:${color};margin-bottom:4px">${p.credential_type} — ${CRED_LABELS[p.credential_type]??''}</div>
          ${credMatch?`<div style="font-size:10px;background:#ECFDF5;color:#065F46;padding:1px 7px;border-radius:10px;display:inline-block;margin-bottom:5px">✓ Credential match</div>`:''}
          <div style="font-size:11px;color:#64748B;margin-bottom:2px">📍 ${p.city??''} · <strong>${p._dist.toFixed(1)} mi away</strong></div>
          <div style="font-size:11px;color:#64748B;margin-bottom:4px">⊙ Serves up to ${p.service_radius_miles} mi</div>
          <div style="font-size:11px;color:${p.available?'#10B981':'#EF4444'};margin-bottom:5px">${p.available?'✓ Available':'✗ Unavailable'}</div>
          ${skills.length>0?`<div style="font-size:10px;color:#64748B;margin-bottom:2px">Skills:</div><div>${skills.map((s:string)=>`<span style="font-size:10px;padding:1px 5px;background:#F1F5F9;border-radius:8px;margin:1px;display:inline-block">${s}</span>`).join('')}</div>`:''}
          <div style="margin-top:7px;border-top:1px solid #E2E8F0;padding-top:6px;display:flex;gap:8px">
            <a href="/providers/${p.id}" style="font-size:11px;color:#0EA5E9;font-weight:600">View profile →</a>
            <a href="/cases/new" style="font-size:11px;color:#10B981;font-weight:600">Open case</a>
          </div>
        </div>`,
      })
    })

    return result
  }, [selectedItems, nearbyProviders, clients, cases])

  const allCredsPresent = [...new Set(providers.map(p=>p.credential_type))].sort()

  return (
    <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:16,alignItems:'start'}}>

      {/* ── LEFT PANEL ── */}
      <div style={{display:'flex',flexDirection:'column',gap:12}}>

        {/* Selection header */}
        <div className="card" style={{padding:'14px 16px'}}>
          <div style={{fontWeight:600,fontSize:13,color:'var(--navy)',marginBottom:8}}>
            Select Focus
            <span style={{fontSize:11,color:'var(--muted)',fontWeight:400,marginLeft:6}}>
              up to 3 clients or cases
            </span>
          </div>

          {/* Tabs */}
          <div style={{display:'flex',border:'1px solid var(--border)',borderRadius:7,overflow:'hidden',marginBottom:10}}>
            {(['clients','cases'] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{
                flex:1,padding:'6px',fontSize:12,fontWeight:500,border:'none',cursor:'pointer',
                background:tab===t?'var(--navy)':'var(--surface)',
                color:tab===t?'#fff':'var(--muted)',transition:'all 0.15s',
              }}>
                {t==='clients'?`Clients (${clients.filter(c=>c.lat!=null).length})`:`Cases (${cases.length})`}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            className="form-input"
            placeholder={`Search ${tab}...`}
            value={searchQ}
            onChange={e=>setSearchQ(e.target.value)}
            style={{fontSize:12,padding:'7px 10px',marginBottom:8}}
          />

          {/* List */}
          <div style={{maxHeight:280,overflowY:'auto',display:'flex',flexDirection:'column',gap:4}}>
            {filtered.length===0&&(
              <div style={{padding:'16px',textAlign:'center',color:'var(--subtle)',fontSize:12}}>
                {tab==='clients'?'No mapped clients found':'No open cases found'}
              </div>
            )}
            {filtered.map(item=>{
              const isSelected = focusIds.includes(item.id)
              const idx = focusIds.indexOf(item.id)
              const label = idx===-1?'':(idx===0?'A':idx===1?'B':'C')
              return (
                <div key={item.id} onClick={()=>toggleFocus(item.id)}
                  style={{
                    padding:'8px 10px',borderRadius:7,cursor:'pointer',
                    border:`1.5px solid ${isSelected?'var(--teal)':'var(--border)'}`,
                    background:isSelected?'var(--teal-light)':'var(--surface)',
                    transition:'all 0.12s',
                  }}>
                  <div style={{display:'flex',alignItems:'center',gap:7}}>
                    {/* Selection badge */}
                    <div style={{
                      width:20,height:20,borderRadius:'50%',flexShrink:0,
                      background:isSelected?'var(--teal)':'var(--border)',
                      color:isSelected?'#fff':'var(--subtle)',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:10,fontWeight:700,
                    }}>{isSelected?label:'+'}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{
                        fontSize:12.5,fontWeight:500,
                        color:isSelected?'var(--navy)':'var(--text)',
                        whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
                      }}>{item.label}</div>
                      <div style={{fontSize:10.5,color:'var(--muted)',marginTop:1}}>{item.sublabel}</div>
                    </div>
                    {item.required_credential&&(
                      <span style={{
                        fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:4,flexShrink:0,
                        background:CRED_COLORS[item.required_credential]+'22',
                        color:CRED_COLORS[item.required_credential],
                      }}>{item.required_credential}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Active selection badges */}
        {selectedItems.length>0&&(
          <div className="card" style={{padding:'12px 14px'}}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--navy)',marginBottom:8}}>
              Selected ({selectedItems.length}/3)
            </div>
            {selectedItems.map((item,idx)=>(
              <div key={item.id} style={{display:'flex',alignItems:'center',gap:7,marginBottom:6}}>
                <div style={{
                  width:20,height:20,borderRadius:'50%',
                  background:'var(--teal)',color:'#fff',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:10,fontWeight:700,flexShrink:0,
                }}>{idx===0?'A':idx===1?'B':'C'}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.label}</div>
                </div>
                <button onClick={()=>toggleFocus(item.id)}
                  style={{background:'none',border:'none',color:'var(--subtle)',cursor:'pointer',fontSize:14,padding:'0 2px'}}>✕</button>
              </div>
            ))}
            <button onClick={()=>setFocusIds([])}
              style={{width:'100%',marginTop:4,padding:'5px',fontSize:11,color:'var(--muted)',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:6,cursor:'pointer'}}>
              Clear selection
            </button>
          </div>
        )}

        {/* Proximity controls — only show when something selected */}
        {selectedItems.length>0&&(
          <div className="card" style={{padding:'14px 16px'}}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--navy)',marginBottom:12}}>Proximity Filter</div>

            <div style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:6}}>
                <span style={{color:'var(--muted)'}}>Search radius</span>
                <span style={{fontFamily:'var(--mono)',fontWeight:600,color:'var(--navy)'}}>{proximityMiles} mi</span>
              </div>
              <input type="range" min={5} max={50} step={5} value={proximityMiles}
                onChange={e=>setProximityMiles(Number(e.target.value))}
                style={{width:'100%',accentColor:'var(--teal)'}}/>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--subtle)',marginTop:2}}>
                <span>5 mi</span><span>50 mi</span>
              </div>
            </div>

            <label style={{display:'flex',alignItems:'center',gap:7,cursor:'pointer',fontSize:12,marginBottom:8}}>
              <input type="checkbox" checked={showAllProviders} onChange={e=>setShowAllProviders(e.target.checked)}/>
              <span>Show all credentials <span style={{color:'var(--subtle)'}}>(not just required)</span></span>
            </label>

            {/* Credential filter chips */}
            <div style={{fontSize:11,color:'var(--muted)',marginBottom:6}}>Filter by credential:</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
              {allCredsPresent.map(cred=>{
                const on = credFilter.includes(cred)
                return (
                  <button key={cred} onClick={()=>setCredFilter(p=>p.includes(cred)?p.filter(x=>x!==cred):[...p,cred])}
                    style={{
                      padding:'2px 9px',borderRadius:12,fontSize:11,fontWeight:700,cursor:'pointer',
                      border:`1.5px solid ${on?CRED_COLORS[cred]:'var(--border)'}`,
                      background:on?CRED_COLORS[cred]+'22':'transparent',
                      color:on?CRED_COLORS[cred]:'var(--muted)',
                    }}>{cred}</button>
                )
              })}
              {credFilter.length>0&&(
                <button onClick={()=>setCredFilter([])} style={{padding:'2px 9px',borderRadius:12,fontSize:11,cursor:'pointer',border:'1px solid var(--border)',background:'transparent',color:'var(--subtle)'}}>✕ clear</button>
              )}
            </div>
          </div>
        )}

        {/* Results summary */}
        {selectedItems.length>0&&(
          <div className="card" style={{padding:'14px 16px'}}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--navy)',marginBottom:10}}>
              Nearby Providers
              <span style={{fontFamily:'var(--mono)',marginLeft:6,fontWeight:400,color:'var(--muted)'}}>{nearbyProviders.length}</span>
            </div>
            {nearbyProviders.length===0?(
              <div style={{fontSize:12,color:'var(--subtle)',textAlign:'center',padding:'8px 0'}}>
                None found within {proximityMiles} mi
                {!showAllProviders&&selectedItems.some(i=>i.required_credential)&&
                  <div style={{marginTop:4,fontSize:11}}>Try "Show all credentials" above</div>}
              </div>
            ):(
              <div style={{maxHeight:220,overflowY:'auto',display:'flex',flexDirection:'column',gap:6}}>
                {nearbyProviders.slice(0,20).map((p,i)=>{
                  const color = CRED_COLORS[p.credential_type]??'#64748B'
                  return (
                    <div key={p.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',background:'var(--bg)',borderRadius:7}}>
                      <div style={{width:22,height:22,borderRadius:'50%',background:color,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0}}>{i+1}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name}</div>
                        <div style={{fontSize:10.5,color:'var(--muted)'}}>
                          <span style={{fontWeight:700,color}}>{p.credential_type}</span>
                          {' · '}{p._dist.toFixed(1)} mi
                          {p.available&&<span style={{color:'var(--green)'}}> · ✓</span>}
                        </div>
                      </div>
                      <Link href={`/providers/${p.id}`}>
                        <span style={{fontSize:11,color:'var(--teal)',fontWeight:600}}>→</span>
                      </Link>
                    </div>
                  )
                })}
                {nearbyProviders.length>20&&(
                  <div style={{fontSize:11,color:'var(--subtle)',textAlign:'center',padding:'4px 0'}}>+{nearbyProviders.length-20} more · zoom into map to explore</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Overview hint */}
        {selectedItems.length===0&&(
          <div style={{background:'var(--teal-light)',border:'1px solid #BAE6FD',borderRadius:8,padding:'12px 14px',fontSize:12,color:'var(--navy)'}}>
            <div style={{fontWeight:600,marginBottom:4}}>How to use</div>
            <div style={{color:'#0369A1',lineHeight:1.6}}>
              Select up to 3 clients or cases from the list above. The map will zoom in and show providers within your chosen radius — colour-coded by credential type, ranked by distance.
            </div>
          </div>
        )}

        {/* Credential legend */}
        <div className="card" style={{padding:'12px 14px'}}>
          <div style={{fontSize:11,fontWeight:600,color:'var(--navy)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Credential Legend</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 8px'}}>
            {Object.entries(CRED_COLORS).map(([cred,color])=>(
              <div key={cred} style={{display:'flex',alignItems:'center',gap:5,fontSize:11}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:color,flexShrink:0}}/>
                <strong>{cred}</strong>
              </div>
            ))}
          </div>
          <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid var(--border)',fontSize:11,color:'var(--muted)'}}>
            <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
              <div style={{width:8,height:8,borderRadius:'50% 50% 50% 0',background:'var(--navy)',transform:'rotate(-45deg)',flexShrink:0}}/>
              Client / case location
            </div>
            <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
              <div style={{width:8,height:8,borderRadius:'50% 50% 50% 0',background:'#F59E0B',transform:'rotate(-45deg)',flexShrink:0}}/>
              Urgent priority
            </div>
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              <div style={{width:8,height:8,borderRadius:'50% 50% 50% 0',background:'#EF4444',transform:'rotate(-45deg)',flexShrink:0}}/>
              Emergency priority
            </div>
          </div>
        </div>
      </div>

      {/* ── MAP ── */}
      <div style={{position:'sticky',top:20}}>
        <div className="card" style={{overflow:'hidden'}}>
          {/* Map header bar */}
          <div style={{
            padding:'10px 16px',
            borderBottom:'1px solid var(--border)',
            background:'var(--bg)',
            display:'flex',alignItems:'center',justifyContent:'space-between',
          }}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--navy)'}}>
              {selectedItems.length===0
                ? `Overview — ${providers.filter(p=>p.lat!=null).length} providers · ${clients.filter(c=>c.lat!=null).length} clients`
                : `Focus: ${selectedItems.map((_,i)=>i===0?'A':i===1?'B':'C').join(' + ')} · ${nearbyProviders.length} providers within ${proximityMiles} mi`}
            </div>
            {selectedItems.length>0&&(
              <button onClick={()=>setFocusIds([])}
                style={{fontSize:11,color:'var(--muted)',background:'none',border:'1px solid var(--border)',borderRadius:5,padding:'3px 10px',cursor:'pointer'}}>
                ← Back to overview
              </button>
            )}
          </div>

          <LeafletMap
            key={`map-${focusIds.join('-')}-${proximityMiles}`}
            pins={pins}
            center={[39.05, -77.05]}
            zoom={selectedItems.length>0?11:9}
            height={580}
          />
        </div>

        {/* Stats row below map */}
        {selectedItems.length===0&&(
          <div style={{display:'flex',gap:10,marginTop:10,flexWrap:'wrap'}}>
            {Object.entries(CRED_COLORS).map(([cred,color])=>{
              const count = providers.filter(p=>p.credential_type===cred&&p.lat!=null).length
              if(!count) return null
              return (
                <div key={cred} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:7,padding:'6px 12px',display:'flex',alignItems:'center',gap:5,fontSize:12}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:color}}/>
                  <strong>{cred}</strong>
                  <span style={{color:'var(--muted)',fontFamily:'var(--mono)'}}>{count}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
