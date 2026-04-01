"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Case, CARE_LEVELS, CARE_LEVEL_LABELS, CARE_LEVEL_DESCRIPTIONS, CARE_LEVEL_POOL, PAYER_TYPES, SKILL_TO_REQ } from '@/types'

const REQ_GROUPS = [
  { label: 'Clinical Skills', items: ['Vent Care','Trach Care','Wound Care','G-Tube','IV Therapy','Catheter Care','Colostomy Care','Feeding Tube','Oxygen Therapy','Medication Management','Vital Signs'] },
  { label: 'Specialties', items: ['Pediatrics','Geriatrics','Dementia Care',"Alzheimer's",'Behavioral Health','Autism','Developmental Disabilities','Hospice / Palliative','Oncology','Cardiac Care','Diabetes Management','Stroke Recovery','Post-Surgical','Orthopedic','Spinal care'] },
  { label: 'Mobility & Care Needs', items: ['Total care','Wheelchair transfer','Hoyer lift','Fall prevention','Ambulation assist','Transfer assist'] },
  { label: 'Provider Attributes Required', items: ['Spanish speaking','Has a car','Meal preparation','French speaking','Sign language'] },
]
import { getScoreColor, getScoreLabel } from '@/lib/matching'
import StatusBadge from './StatusBadge'
import ScheduleSection from './ScheduleSection'
import CaseDocuments from './CaseDocuments'
import DispatchPanel from './DispatchPanel'
import ResponseDashboard from './ResponseDashboard'

const MatchMap = dynamic(() => import('./MatchMap'), { ssr: false })

interface Props {
  mode: 'new'|'edit'
  clients: any[]
  preselectedClient?: any
  caseData?: Case
  matches?: any[]
  documents?: any[]
  assignedProviderId?: string | null
}

export default function CaseForm({ mode, clients, preselectedClient, caseData, matches: initialMatches, documents: initialDocs, assignedProviderId }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [assigning, setAssigning] = useState<string|null>(null)
  const [error, setError] = useState('')
  const [skills, setSkills] = useState<string[]>(caseData?.required_skills??[])
  const [matches, setMatches] = useState<any[]>(initialMatches??[])
  const [selectedClientId, setSelectedClientId] = useState(preselectedClient?.id??caseData?.client_id??'')
  const [savedCaseId, setSavedCaseId] = useState(caseData?.id??'')
  const [expandedRow, setExpandedRow] = useState<string|null>(null)
  const [resultsView, setResultsView] = useState<'table'|'map'>('table')
  const [clientCoords, setClientCoords] = useState<{lat:number|null,lng:number|null}>({lat:null,lng:null})
  const [payerTypes, setPayerTypes] = useState<string[]>(caseData?.payer_types??[])
  const [clientAutoPopulated, setClientAutoPopulated] = useState(false)

  const toggleSkill = (s:string) => setSkills(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s])
  const togglePayer = (p:string) => setPayerTypes(prev=>{
    if(prev.includes(p)) return prev.filter(x=>x!==p)
    if(prev.length>=2) return [prev[1],p]
    return [...prev,p]
  })

  useEffect(() => {
    const c = clients.find(x=>x.id===selectedClientId)
    if(c?.lat&&c?.lng) setClientCoords({lat:c.lat,lng:c.lng})
    else setClientCoords({lat:null,lng:null})

    // Auto-populate requirements from client when first selected
    if(c && !caseData) {
      const clientReqs: string[] = [...(c.required_skills||[])]
      // Re-surface boolean flags as chips
      Object.entries(SKILL_TO_REQ).forEach(([skill, req]) => {
        if(c[req] && !clientReqs.includes(skill)) clientReqs.push(skill)
      })
      if(clientReqs.length > 0) {
        setSkills(clientReqs)
        setClientAutoPopulated(true)
      }
    }
  },[selectedClientId,clients])

  useEffect(() => {
    if((caseData as any)?.clients){
      const c=Array.isArray((caseData as any).clients)?(caseData as any).clients[0]:(caseData as any).clients
      if(c?.lat&&c?.lng) setClientCoords({lat:c.lat,lng:c.lng})
    }
  },[caseData])

  async function handleSave(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setError('')
    const fd = new FormData(e.currentTarget)

    // Parse recurring_days from hidden JSON field
    let recurDays: string[] = []
    try { recurDays = JSON.parse(fd.get('recurring_days') as string||'[]') } catch {}

    const body = {
      title:fd.get('title'), client_id:selectedClientId||null,
      care_level:fd.get('care_level'), required_credential:null, required_skills:skills,
      urgency:fd.get('urgency'),
      schedule_type:fd.get('schedule_type')||'one_time',
      visit_date:fd.get('visit_date')||null, visit_time:fd.get('visit_time')||null,
      duration_hours:Number(fd.get('duration_hours'))||1,
      recurring_days:recurDays,
      recurring_start:fd.get('recurring_start')||null,
      recurring_end:fd.get('recurring_end')||null,
      flexible_hours_day:fd.get('flexible_hours_day')?Number(fd.get('flexible_hours_day')):null,
      flexible_days_week:fd.get('flexible_days_week')?Number(fd.get('flexible_days_week')):null,
      flexible_any_time:fd.get('flexible_any_time')==='on',
      payer_types:payerTypes,
      requires_car:fd.get('requires_car')==='on',
      gender_preference:fd.get('gender_preference')||'any',
      requires_meal_prep:fd.get('requires_meal_prep')==='on',
      requires_total_care:fd.get('requires_total_care')==='on',
      requires_wheelchair:fd.get('requires_wheelchair')==='on',
      requires_hoyer_lift:fd.get('requires_hoyer_lift')==='on',
      requires_spanish:fd.get('requires_spanish')==='on',
      special_instructions:fd.get('special_instructions'),
      status:'open',
    }
    try {
      const url=mode==='edit'?`/api/cases/${caseData!.id}`:'/api/cases'
      const res=await fetch(url,{method:mode==='edit'?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
      const json=await res.json()
      if(!res.ok) throw new Error(json.error||'Save failed')
      setSavedCaseId(json.id)
      if(mode==='new') router.push(`/cases/${json.id}`)
      else router.refresh()
    } catch(err:any){ setError(err.message) } finally { setSaving(false) }
  }

  async function runMatching() {
    const caseId=savedCaseId||caseData?.id
    if(!caseId){ setError('Save the case first.'); return }
    setRunning(true); setError('')
    try {
      const res=await fetch(`/api/cases/${caseId}/match`,{method:'POST'})
      const json=await res.json()
      if(!res.ok) throw new Error(json.error||'Matching failed')
      setMatches(json.matches??[])
    } catch(err:any){ setError(err.message) } finally { setRunning(false) }
  }

  async function assignProvider(providerId:string) {
    const caseId=savedCaseId||caseData?.id
    if(!caseId) return
    setAssigning(providerId)
    try {
      const res=await fetch(`/api/cases/${caseId}/match`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider_id:providerId})})
      if(!res.ok) throw new Error('Assign failed')
      router.push(`/cases/${caseId}`)
    } catch(err:any){ setError(err.message) } finally { setAssigning(null) }
  }

  async function refreshMatches() {
    const caseId=savedCaseId||caseData?.id
    if(!caseId) return
    try {
      const res=await fetch(`/api/cases/${caseId}/responses`)
      const json=await res.json()
      if(res.ok) setMatches(json.matches??[])
    } catch {}
  }

  const selectedClient = clients.find(c=>c.id===selectedClientId)
  const mapProviders = matches.map((m:any)=>{
    const p=m.providers||m.provider
    return {provider_id:m.provider_id,name:p?.name??'',credential_type:p?.credential_type??'',lat:p?.lat??null,lng:p?.lng??null,match_score:m.match_score,distance_miles:m.distance_miles,is_available:m.is_available,match_notes:m.match_notes??''}
  })

  return (
    <div style={{padding:28}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:20}}>
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <form id="case-form" onSubmit={handleSave}>

            {/* Case details */}
            <div className="card" style={{padding:'20px 24px',marginBottom:20}}>
              <div style={{fontWeight:600,fontSize:14,marginBottom:16,color:'var(--navy)'}}>Case Details</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label className="form-label">Case Title *</label>
                  <input className="form-input" name="title" defaultValue={caseData?.title} required placeholder="e.g. Post-surgical wound care – Agnes Mwangi"/>
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label className="form-label">Client</label>
                  <select className="form-select" name="client_id" value={selectedClientId} onChange={e=>setSelectedClientId(e.target.value)}>
                    <option value="">Select client (optional)</option>
                    {clients.map(c=><option key={c.id} value={c.id}>{c.name}{c.city?` — ${c.city}`:''}</option>)}
                  </select>
                </div>
                {selectedClient&&(
                  <div style={{gridColumn:'1/-1',background:'var(--teal-light)',border:'1px solid #BAE6FD',borderRadius:8,padding:'10px 14px',fontSize:12.5,color:'var(--navy)'}}>
                    <strong>{selectedClient.name}</strong>
                    {selectedClient.required_credential&&` · Needs ${selectedClient.required_credential}`}
                    {selectedClient.city&&` · ${selectedClient.city}, ${selectedClient.state}`}
                    {selectedClient.lat&&<span style={{marginLeft:8,fontSize:11,color:'var(--teal)'}}>📍 Location mapped</span>}
                  </div>
                )}
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label className="form-label">Care Level Required *</label>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginTop:4}}>
                    {CARE_LEVELS.map(level=>{
                      const currentLevel = caseData?.care_level || (selectedClient?.care_needs?.[0]) || ''
                      const isSelected = (document?.querySelector?.('[name="care_level"]') as HTMLInputElement)?.value === level
                      return null // rendered below as select for simplicity
                    })}
                  </div>
                  <select className="form-select" name="care_level" defaultValue={caseData?.care_level || selectedClient?.care_needs?.[0] || ''} required>
                    <option value="">Select care level</option>
                    <option value="companion_care">Companion Care — non-hands-on companionship</option>
                    <option value="personal_care">Personal Care — ADLs, bathing, dressing</option>
                    <option value="skilled_nursing">Skilled Nursing — clinical, wound care, IV</option>
                    <option value="physical_therapy">Physical Therapy</option>
                    <option value="occupational_therapy">Occupational Therapy</option>
                    <option value="speech_therapy">Speech Therapy</option>
                  </select>
                  <span className="form-hint" style={{marginTop:4,display:'block'}}>
                    Determines which provider credentials are eligible — Personal Care accepts UA/CNA/GNA/CMT/LPN/RN; Skilled Nursing requires LPN or RN
                  </span>
                </div>
                <div className="form-group">
                  <label className="form-label">Urgency</label>
                  <select className="form-select" name="urgency" defaultValue={caseData?.urgency||selectedClient?.urgency_level||'routine'}>
                    <option value="routine">Routine</option><option value="urgent">Urgent</option><option value="emergency">Emergency</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Gender Preference</label>
                  <select className="form-select" name="gender_preference" defaultValue={caseData?.gender_preference||selectedClient?.gender_preference||'any'}>
                    <option value="any">No preference</option>
                    <option value="male">Male provider</option>
                    <option value="female">Female provider</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="card" style={{padding:'20px 24px',marginBottom:20}}>
              <div style={{fontWeight:600,fontSize:14,marginBottom:16,color:'var(--navy)'}}>Schedule</div>
              <ScheduleSection
                scheduleType={caseData?.schedule_type}
                visitDate={caseData?.visit_date}
                visitTime={caseData?.visit_time}
                durationHours={caseData?.duration_hours}
                recurringDays={caseData?.recurring_days}
                recurringStart={caseData?.recurring_start}
                recurringEnd={caseData?.recurring_end}
                flexHoursDay={caseData?.flexible_hours_day}
                flexDaysWeek={caseData?.flexible_days_week}
                flexAnyTime={caseData?.flexible_any_time}
              />
            </div>

            {/* Payer */}
            <div className="card" style={{padding:'20px 24px',marginBottom:20}}>
              <div style={{fontWeight:600,fontSize:14,marginBottom:8,color:'var(--navy)'}}>Payer <span style={{fontSize:12,color:'var(--muted)',fontWeight:400}}>(select up to 2)</span></div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:payerTypes.length>0?10:0}}>
                {PAYER_TYPES.map(p=>{
                  const on=payerTypes.includes(p)
                  const disabled=!on&&payerTypes.length>=2
                  return <button key={p} type="button" className={`skill-chip${on?' selected':''}`} onClick={()=>togglePayer(p)} style={{opacity:disabled?0.4:1,cursor:disabled?'not-allowed':'pointer'}}>{on&&'✓ '}{p}</button>
                })}
              </div>
              {payerTypes.length>0&&<div style={{background:'var(--teal-light)',border:'1px solid #BAE6FD',borderRadius:7,padding:'7px 12px',fontSize:12.5,color:'var(--navy)'}}><strong>{payerTypes.join(' + ')}</strong></div>}
            </div>

            {/* Requirements — unified, auto-populates from client */}
            <div className="card" style={{padding:'20px 24px',marginBottom:20}}>
              <div style={{fontWeight:600,fontSize:14,marginBottom:4,color:'var(--navy)'}}>Requirements</div>
              <div style={{fontSize:12,color:'var(--muted)',marginBottom:selectedClient?8:16}}>
                {skills.length} selected — clinical skills, specialties, and provider attributes
              </div>
              {selectedClient&&clientAutoPopulated&&(
                <div style={{background:'var(--teal-light)',border:'1px solid #BAE6FD',borderRadius:7,padding:'7px 12px',fontSize:12,color:'var(--navy)',marginBottom:14,display:'flex',alignItems:'center',gap:8}}>
                  <span>📋</span>
                  <span>Auto-populated from <strong>{selectedClient.name}</strong>'s requirements — add more below</span>
                  <button type="button" onClick={()=>setClientAutoPopulated(false)}
                    style={{marginLeft:'auto',background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:13}}>✕</button>
                </div>
              )}
              {REQ_GROUPS.map(group=>(
                <div key={group.label} style={{marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>{group.label}</div>
                  <div className="skill-grid">
                    {group.items.map(s=>(
                      <button key={s} type="button"
                        className={`skill-chip${skills.includes(s)?' selected':''}`}
                        onClick={()=>toggleSkill(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="card" style={{padding:'20px 24px'}}>
              <div className="form-group">
                <label className="form-label">Special Instructions</label>
                <textarea className="form-textarea" name="special_instructions" defaultValue={caseData?.special_instructions??''} style={{minHeight:80}}/>
              </div>
            </div>
          </form>

          {/* Documents */}
          {savedCaseId && (
            <CaseDocuments caseId={savedCaseId} documents={initialDocs??[]}/>
          )}

          {/* Dispatch panel — only shown once matches exist */}
          {matches.length>0&&savedCaseId&&(
            <DispatchPanel
              caseId={savedCaseId||caseData?.id||''}
              matches={matches}
              onDispatched={refreshMatches}
            />
          )}

          {/* Response dashboard — only shown once dispatch has happened */}
          {matches.some(m=>m.notified_at)&&savedCaseId&&(
            <ResponseDashboard
              caseId={savedCaseId||caseData?.id||''}
              initialMatches={matches}
              caseStatus={caseData?.status||'open'}
              assignedProviderId={assignedProviderId??null}
              onAssign={assignProvider}
            />
          )}

          {/* Matching results */}
          {matches.length>0&&(
            <div className="card fade-in" style={{overflow:'hidden'}}>
              <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--bg)'}}>
                <div>
                  <span style={{fontWeight:600,fontSize:14}}>Matching Results</span>
                  <span style={{marginLeft:10,fontSize:12.5,color:'var(--muted)'}}>{matches.length} eligible provider{matches.length!==1?'s':''}</span>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <div style={{display:'flex',border:'1px solid var(--border)',borderRadius:7,overflow:'hidden'}}>
                    {(['table','map'] as const).map(view=>(
                      <button key={view} type="button" onClick={()=>setResultsView(view)}
                        style={{padding:'5px 14px',fontSize:12,fontWeight:500,background:resultsView===view?'var(--navy)':'var(--surface)',color:resultsView===view?'#fff':'var(--muted)',border:'none',cursor:'pointer'}}>
                        {view==='table'?'☰ Table':'🗺 Map'}
                      </button>
                    ))}
                  </div>
                  <button className="btn-secondary" style={{fontSize:12,padding:'5px 12px'}} onClick={runMatching} disabled={running}>{running?'Re-running...':'↻ Re-run'}</button>
                </div>
              </div>

              {resultsView==='map'&&(
                <div style={{padding:16}}>
                  <MatchMap clientLat={clientCoords.lat} clientLng={clientCoords.lng} clientName={selectedClient?.name??'Client'} providers={mapProviders} onAssign={assignProvider} height={400}/>
                </div>
              )}

              {resultsView==='table'&&(
                <table className="data-table">
                  <thead><tr><th>Rank</th><th>Provider</th><th>Score</th><th>Distance</th><th>Skills</th><th>Available</th><th></th></tr></thead>
                  <tbody>
                    {matches.map((m:any,i:number)=>{
                      const p=m.providers||m.provider
                      const scoreColor=getScoreColor(m.match_score)
                      const isExpanded=expandedRow===m.provider_id
                      const proximityScore=m.distance_miles!=null?Math.max(0,Math.round(50*(1-m.distance_miles/(p?.service_radius_miles??15)))):50
                      const skillScore=Math.round((m.skill_match_pct??0)*30)
                      const availScore=m.is_available?20:0
                      return (
                        <>
                          <tr key={m.provider_id}>
                            <td><div style={{width:24,height:24,borderRadius:'50%',background:i===0?'var(--teal)':'var(--bg)',color:i===0?'#fff':'var(--muted)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700}}>{i+1}</div></td>
                            <td>
                              <div style={{fontWeight:500}}>{p?.name}</div>
                              <div style={{fontSize:11,color:'var(--muted)'}}>
                                {p?.credential_type}
                                {(p?.additional_credentials||[]).length>0&&<span style={{color:'var(--subtle)'}}> + {p.additional_credentials.join(', ')}</span>}
                                {p?.city&&` · ${p.city}`}
                              </div>
                            </td>
                            <td>
                              <div className="score-bar-wrap">
                                <div className="score-bar-track" style={{width:80}}><div className="score-bar-fill" style={{width:`${m.match_score}%`,background:scoreColor}}/></div>
                                <span style={{fontSize:12,fontFamily:'var(--mono)',color:scoreColor,fontWeight:600}}>{m.match_score}</span>
                                <span style={{fontSize:11,color:'var(--muted)'}}>{getScoreLabel(m.match_score)}</span>
                              </div>
                            </td>
                            <td style={{fontFamily:'var(--mono)',fontSize:13}}>{m.distance_miles!=null?`${Number(m.distance_miles).toFixed(1)} mi`:'—'}</td>
                            <td><span style={{fontFamily:'var(--mono)',fontSize:13}}>{m.skill_match_count}/{skills.length||0}</span></td>
                            <td><StatusBadge label={m.is_available?'Yes':'No'} status={m.is_available?'active':'inactive'} size="sm"/></td>
                            <td>
                              <div style={{display:'flex',gap:5}}>
                                <button className="btn-secondary" style={{padding:'5px 10px',fontSize:11}} onClick={()=>setExpandedRow(isExpanded?null:m.provider_id)}>{isExpanded?'▲':'▼ Why?'}</button>
                                <button className="btn-teal" style={{padding:'6px 12px',fontSize:12}} onClick={()=>assignProvider(m.provider_id)} disabled={assigning===m.provider_id}>{assigning===m.provider_id?'…':'Assign'}</button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded&&(
                            <tr key={`${m.provider_id}-exp`}>
                              <td colSpan={7} style={{padding:0,background:'var(--bg)'}}>
                                <div style={{padding:'14px 20px 14px 60px',display:'flex',gap:24,flexWrap:'wrap'}}>
                                  <div style={{minWidth:200}}>
                                    <div style={{fontWeight:600,fontSize:11,color:'var(--navy)',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Score Breakdown</div>
                                    {[
                                      {label:'Credential match',score:'✓',max:'required',color:'var(--green)'},
                                      {label:'Proximity',score:proximityScore,max:50,color:proximityScore>=40?'var(--green)':proximityScore>=20?'var(--amber)':'var(--red)'},
                                      {label:'Skill match',score:skillScore,max:30,color:skillScore>=24?'var(--green)':skillScore>=12?'var(--amber)':'var(--red)'},
                                      {label:'Availability',score:availScore,max:20,color:availScore===20?'var(--green)':'var(--red)'},
                                    ].map(row=>(
                                      <div key={row.label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7,fontSize:12.5}}>
                                        <span style={{color:'var(--muted)'}}>{row.label}</span>
                                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                                          {typeof row.score==='number'&&<div style={{width:60,height:5,background:'var(--border)',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${(row.score/Number(row.max))*100}%`,background:row.color,borderRadius:3}}/></div>}
                                          <span style={{fontFamily:'var(--mono)',fontWeight:600,color:row.color,fontSize:12}}>{row.score}{typeof row.max==='number'?`/${row.max}`:''}</span>
                                        </div>
                                      </div>
                                    ))}
                                    <div style={{borderTop:'1px solid var(--border)',paddingTop:7,marginTop:4,display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:600}}>
                                      <span>Total</span>
                                      <span style={{fontFamily:'var(--mono)',color:scoreColor}}>{m.match_score}/100</span>
                                    </div>
                                  </div>
                                  <div style={{minWidth:180}}>
                                    <div style={{fontWeight:600,fontSize:11,color:'var(--navy)',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Provider Details</div>
                                    <div style={{fontSize:12.5,color:'var(--muted)',marginBottom:4}}>📍 {[p?.city,p?.state].filter(Boolean).join(', ')||'Unknown'}</div>
                                    <div style={{fontSize:12.5,color:'var(--muted)',marginBottom:4}}>⊙ {p?.service_radius_miles??'?'} mile radius</div>
                                    {p?.phone&&<div style={{fontSize:12.5,color:'var(--muted)',marginBottom:4}}>📞 {p.phone}</div>}
                                    {p?.has_car&&<div style={{fontSize:12,color:'var(--green)',marginBottom:2}}>✓ Has car</div>}
                                    {p?.spanish_speaking&&<div style={{fontSize:12,color:'var(--green)',marginBottom:2}}>✓ Spanish speaking</div>}
                                    {p?.hoyer_lift&&<div style={{fontSize:12,color:'var(--green)',marginBottom:2}}>✓ Hoyer lift</div>}
                                    {p?.wheelchair_transfer&&<div style={{fontSize:12,color:'var(--green)',marginBottom:2}}>✓ Wheelchair transfer</div>}
                                  </div>
                                  {skills.length>0&&(
                                    <div style={{minWidth:180}}>
                                      <div style={{fontWeight:600,fontSize:11,color:'var(--navy)',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Skills</div>
                                      <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                                        {skills.map(s=>{
                                          const has=(p?.skills||[]).includes(s)
                                          return <span key={s} style={{fontSize:11,padding:'2px 8px',borderRadius:12,background:has?'var(--green-bg)':'var(--red-bg)',color:has?'#065F46':'#991B1B',border:`1px solid ${has?'#A7F3D0':'#FECACA'}`}}>{has?'✓':'✗'} {s}</span>
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {matches.length===0&&savedCaseId&&(
            <div className="card" style={{padding:'28px',textAlign:'center',color:'var(--muted)',border:'2px dashed var(--border)',background:'transparent',boxShadow:'none'}}>
              <div style={{fontSize:28,marginBottom:10}}>⌖</div>
              <div style={{fontWeight:600,marginBottom:6,color:'var(--text)'}}>Matching engine ready</div>
              <div style={{fontSize:13}}>Save case, then click Run Matching Engine.</div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {error&&<div style={{background:'var(--red-bg)',border:'1px solid #FECACA',borderRadius:8,padding:'12px 14px',fontSize:13,color:'var(--red)'}}>{error}</div>}
          <button type="submit" form="case-form" className="btn-primary" disabled={saving} style={{width:'100%',justifyContent:'center',padding:'11px',fontSize:14}}>{saving?'Saving...':mode==='edit'?'Save Changes':'Save Case'}</button>
          <button type="button" className="btn-teal" onClick={runMatching} disabled={running||!savedCaseId} style={{width:'100%',justifyContent:'center',padding:'11px',fontSize:14}}>{running?'Running...':'⌖ Run Matching Engine'}</button>
          <button type="button" className="btn-secondary" onClick={()=>router.back()} style={{width:'100%',justifyContent:'center'}}>Cancel</button>
          <div className="card" style={{padding:'16px 18px'}}>
            <div style={{fontWeight:600,fontSize:12.5,marginBottom:10,color:'var(--navy)'}}>How Scoring Works</div>
            {[{label:'Proximity',pts:50,note:'Closer = higher'},{label:'Skill match',pts:30,note:'% of skills covered'},{label:'Availability',pts:20,note:'Marked available'}].map(row=>(
              <div key={row.label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8,fontSize:12.5}}>
                <div><div style={{fontWeight:500}}>{row.label}</div><div style={{fontSize:11,color:'var(--subtle)'}}>{row.note}</div></div>
                <span style={{fontFamily:'var(--mono)',fontWeight:600,color:'var(--navy)',background:'var(--teal-light)',padding:'2px 8px',borderRadius:4,fontSize:11}}>{row.pts} pts</span>
              </div>
            ))}
            <div style={{borderTop:'1px solid var(--border)',marginTop:8,paddingTop:8,fontSize:11,color:'var(--subtle)'}}>Care level determines the eligible credential pool. Capability flags are hard filters — providers that don't meet them are excluded before scoring.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
