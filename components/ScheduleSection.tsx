"use client"
import { useState } from 'react'
import { ScheduleType } from '@/types'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

interface Props {
  scheduleType?: ScheduleType
  visitDate?: string|null
  visitTime?: string|null
  durationHours?: number
  recurringDays?: string[]
  recurringStart?: string|null
  recurringEnd?: string|null
  flexHoursDay?: number|null
  flexDaysWeek?: number|null
  flexAnyTime?: boolean
}

export default function ScheduleSection(props: Props) {
  const [type, setType] = useState<ScheduleType>(props.scheduleType ?? 'one_time')
  const [recurDays, setRecurDays] = useState<string[]>(props.recurringDays ?? [])
  const toggleDay = (d:string) => setRecurDays(p=>p.includes(d)?p.filter(x=>x!==d):[...p,d])

  return (
    <div>
      {/* Schedule type selector */}
      <div style={{display:'flex',gap:0,border:'1px solid var(--border)',borderRadius:8,overflow:'hidden',marginBottom:16}}>
        {([
          {v:'one_time',  label:'One-time visit',        icon:'📅'},
          {v:'recurring', label:'Recurring schedule',    icon:'🔄'},
          {v:'flexible',  label:'Flexible',              icon:'⚡'},
        ] as {v:ScheduleType;label:string;icon:string}[]).map(opt=>(
          <button key={opt.v} type="button"
            onClick={()=>setType(opt.v)}
            style={{
              flex:1,padding:'10px 8px',border:'none',cursor:'pointer',
              background:type===opt.v?'var(--navy)':'var(--surface)',
              color:type===opt.v?'#fff':'var(--muted)',
              fontSize:12.5,fontWeight:type===opt.v?600:400,
              borderRight:'1px solid var(--border)',transition:'all 0.15s',
              display:'flex',flexDirection:'column',alignItems:'center',gap:3,
            }}>
            <span style={{fontSize:16}}>{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Hidden field for schedule_type */}
      <input type="hidden" name="schedule_type" value={type}/>

      {/* ONE-TIME */}
      {type==='one_time'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
          <div className="form-group">
            <label className="form-label">Visit Date</label>
            <input className="form-input" type="date" name="visit_date" defaultValue={props.visitDate?.slice(0,10)??''}/>
          </div>
          <div className="form-group">
            <label className="form-label">Visit Time</label>
            <input className="form-input" type="time" name="visit_time" defaultValue={props.visitTime??''}/>
          </div>
          <div className="form-group">
            <label className="form-label">Duration (hours)</label>
            <input className="form-input" type="number" name="duration_hours" defaultValue={props.durationHours??2} min={0.5} max={24} step={0.5}/>
          </div>
        </div>
      )}

      {/* RECURRING */}
      {type==='recurring'&&(
        <div>
          <div style={{fontWeight:500,fontSize:13,marginBottom:8}}>Days of Week <span style={{color:'var(--muted)',fontSize:11,fontWeight:400}}>({recurDays.length} selected)</span></div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
            {DAYS.map(d=>(
              <button key={d} type="button"
                className={`skill-chip${recurDays.includes(d)?' selected':''}`}
                onClick={()=>toggleDay(d)}>
                {d.slice(0,3)}
              </button>
            ))}
          </div>
          {/* Hidden field for recurring_days */}
          <input type="hidden" name="recurring_days" value={JSON.stringify(recurDays)}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input className="form-input" type="time" name="recurring_start" defaultValue={props.recurringStart?.slice(0,5)??''}/>
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input className="form-input" type="time" name="recurring_end" defaultValue={props.recurringEnd?.slice(0,5)??''}/>
            </div>
            <div className="form-group">
              <label className="form-label">Hours per visit</label>
              <input className="form-input" type="number" name="duration_hours" defaultValue={props.durationHours??4} min={0.5} max={24} step={0.5}/>
            </div>
          </div>
          {recurDays.length>0&&(
            <div style={{marginTop:10,background:'var(--teal-light)',border:'1px solid #BAE6FD',borderRadius:7,padding:'8px 12px',fontSize:12.5,color:'var(--navy)'}}>
              Schedule: <strong>{recurDays.join(', ')}</strong>
              {props.recurringStart&&props.recurringEnd&&<> · {props.recurringStart} – {props.recurringEnd}</>}
            </div>
          )}
        </div>
      )}

      {/* FLEXIBLE */}
      {type==='flexible'&&(
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:12}}>
            <div className="form-group">
              <label className="form-label">Hours per day needed</label>
              <input className="form-input" type="number" name="flexible_hours_day" defaultValue={props.flexHoursDay??4} min={1} max={24} step={0.5}/>
              <span className="form-hint">How many hours of care per visit day</span>
            </div>
            <div className="form-group">
              <label className="form-label">Days per week needed</label>
              <input className="form-input" type="number" name="flexible_days_week" defaultValue={props.flexDaysWeek??3} min={1} max={7}/>
              <span className="form-hint">How many days per week required</span>
            </div>
          </div>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,padding:'10px 12px',border:'1px solid var(--border)',borderRadius:7,background:'var(--bg)'}}>
            <input type="checkbox" name="flexible_any_time" defaultChecked={props.flexAnyTime??true}/>
            <div>
              <div style={{fontWeight:500}}>Fully flexible timing</div>
              <div style={{fontSize:11,color:'var(--muted)'}}>Client has no preference on time of day — provider can choose</div>
            </div>
          </label>
          <div style={{marginTop:10,background:'var(--amber-bg)',border:'1px solid #FDE68A',borderRadius:7,padding:'8px 12px',fontSize:12.5,color:'#92400E'}}>
            Flexible: provider needed for <strong>{props.flexHoursDay??4} hrs/day</strong>, <strong>{props.flexDaysWeek??3} days/week</strong> — schedule to be agreed with provider
          </div>
          {/* Hidden defaults for unused fields */}
          <input type="hidden" name="duration_hours" value={String(props.flexHoursDay??4)}/>
        </div>
      )}
    </div>
  )
}
