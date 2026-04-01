"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Provider, CREDENTIAL_TYPES, CREDENTIAL_LABELS, CREDENTIAL_GROUPS, ALL_SKILLS, SKILL_TO_FLAG, DAYS_OF_WEEK, SHIFT_OPTIONS } from '@/types'

interface Props { provider?: Provider; mode: 'new'|'edit' }

function flagsFromSkills(skills: string[]): Record<string, boolean> {
  const flags: Record<string, boolean> = {}
  Object.entries(SKILL_TO_FLAG).forEach(([skill, flag]) => {
    flags[flag] = skills.includes(skill)
  })
  return flags
}

function initialSkills(provider?: Provider): string[] {
  if (!provider) return []
  const fromSkills = [...(provider.skills || [])]
  // Re-add capability flags as skill chips
  Object.entries(SKILL_TO_FLAG).forEach(([skill, flag]) => {
    if ((provider as any)[flag] && !fromSkills.includes(skill)) fromSkills.push(skill)
  })
  return fromSkills
}

export default function ProviderForm({ provider, mode }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [skills, setSkills] = useState<string[]>(initialSkills(provider))
  const [days, setDays] = useState<string[]>(provider?.preferred_days ?? [])
  const [shifts, setShifts] = useState<string[]>(provider?.shift_preferences ?? [])
  const [additionalCreds, setAdditionalCreds] = useState<string[]>(provider?.additional_credentials ?? [])

  const toggleSkill = (s: string) => setSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])
  const toggleDay   = (d: string) => setDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])
  const toggleShift = (s: string) => setShifts(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])
  const toggleCred  = (c: string) => setAdditionalCreds(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setError('')
    const fd = new FormData(e.currentTarget)
    const flags = flagsFromSkills(skills)
    // Pure clinical/specialty skills (exclude the capability chips)
    const pureSkills = skills.filter(s => !SKILL_TO_FLAG[s])
    const body = {
      name: fd.get('name'), phone: fd.get('phone'), email: fd.get('email'),
      address: fd.get('address'), city: fd.get('city'), state: fd.get('state'), zip: fd.get('zip'),
      credential_type: fd.get('credential_type'), license_number: fd.get('license_number'),
      additional_credentials: additionalCreds,
      skills: pureSkills, preferred_days: days,
      shift_preferences: shifts,
      service_radius_miles: Number(fd.get('service_radius_miles')) || 15,
      available: fd.get('available') === 'on', status: fd.get('status'),
      gender: fd.get('gender'),
      ...flags, // has_car, meal_prep, total_care, wheelchair_transfer, hoyer_lift, spanish_speaking
      notes: fd.get('notes'),
    }
    try {
      const url = mode === 'edit' ? `/api/providers/${provider!.id}` : '/api/providers'
      const res = await fetch(url, { method: mode === 'edit' ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      router.push(`/providers/${json.id}`); router.refresh()
    } catch (err: any) { setError(err.message) } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirm('Delete this provider?')) return; setDeleting(true)
    try { await fetch(`/api/providers/${provider!.id}`, { method: 'DELETE' }); router.push('/providers'); router.refresh() }
    catch { setError('Delete failed'); setDeleting(false) }
  }

  const primaryCred = provider?.credential_type

  // Group skills for display
  const SKILL_GROUPS = [
    { label: 'Clinical Skills', items: ['Vent Care','Trach Care','Wound Care','G-Tube','IV Therapy','Catheter Care','Colostomy Care','Feeding Tube','Oxygen Therapy','Medication Management','Vital Signs'] },
    { label: 'Specialties', items: ['Pediatrics','Geriatrics','Dementia Care',"Alzheimer's",'Behavioral Health','Autism','Developmental Disabilities','Hospice / Palliative','Oncology','Cardiac Care','Diabetes Management','Stroke Recovery','Post-Surgical','Orthopedic','Spinal care'] },
    { label: 'Mobility & Care Attributes', items: ['Total care','Wheelchair transfer','Hoyer lift','Fall prevention','Ambulation assist','Transfer assist'] },
    { label: 'Languages & Transport', items: ['Spanish speaking','French speaking','Sign language','Has a car'] },
    { label: 'Nutrition', items: ['Meal preparation'] },
  ]

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, padding: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Personal info */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--navy)' }}>Personal Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Full Name *</label><input className="form-input" name="name" defaultValue={provider?.name} required /></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" name="phone" defaultValue={provider?.phone ?? ''} /></div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" name="email" defaultValue={provider?.email ?? ''} /></div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Address</label><input className="form-input" name="address" defaultValue={provider?.address ?? ''} /></div>
              <div className="form-group"><label className="form-label">City</label><input className="form-input" name="city" defaultValue={provider?.city ?? ''} /></div>
              <div className="form-group"><label className="form-label">State</label><input className="form-input" name="state" defaultValue={provider?.state ?? 'MD'} /></div>
              <div className="form-group"><label className="form-label">ZIP</label><input className="form-input" name="zip" defaultValue={provider?.zip ?? ''} /></div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-select" name="gender" defaultValue={provider?.gender ?? 'unspecified'}>
                  <option value="unspecified">Prefer not to say</option>
                  <option value="male">Male</option><option value="female">Female</option><option value="non_binary">Non-binary</option>
                </select>
              </div>
            </div>
          </div>

          {/* Credentials */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--navy)' }}>Credentials</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div className="form-group">
                <label className="form-label">Primary Credential *</label>
                <select className="form-select" name="credential_type" defaultValue={provider?.credential_type} required>
                  <option value="">Select credential</option>
                  <optgroup label="Aides">
                    <option value="UA">UA — Unlicensed Aide</option>
                    <option value="CNA">CNA — Certified Nursing Assistant</option>
                    <option value="GNA">GNA — Geriatric Nursing Assistant</option>
                    <option value="CMT">CMT — Certified Medication Technician</option>
                  </optgroup>
                  <optgroup label="Nursing">
                    <option value="LPN">LPN — Licensed Practical Nurse</option>
                    <option value="RN">RN — Registered Nurse</option>
                  </optgroup>
                  <optgroup label="Therapy">
                    <option value="PT">PT — Physical Therapist</option>
                    <option value="OT">OT — Occupational Therapist</option>
                    <option value="ST">ST — Speech Therapist</option>
                  </optgroup>
                </select>
              </div>
              <div className="form-group"><label className="form-label">License #</label><input className="form-input" name="license_number" defaultValue={provider?.license_number ?? ''} /></div>
            </div>
            <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>Additional Credentials <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 11 }}>(also certified as)</span></div>
            {CREDENTIAL_GROUPS.map(group => (
              <div key={group.label} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{group.label}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {group.creds.map(c => (
                    <button key={c} type="button"
                      className={`skill-chip${additionalCreds.includes(c) ? ' selected' : ''}`}
                      onClick={() => toggleCred(c)}
                      disabled={c === primaryCred}
                      style={{ opacity: c === primaryCred ? 0.4 : 1 }}>
                      {c} — {CREDENTIAL_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Skills, Attributes & Specialties */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: 'var(--navy)' }}>Skills, Attributes & Specialties</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
              {skills.length} selected — includes clinical skills, specialties, languages, and care capabilities
            </div>
            {SKILL_GROUPS.map(group => (
              <div key={group.label} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{group.label}</div>
                <div className="skill-grid">
                  {group.items.map(s => (
                    <button key={s} type="button"
                      className={`skill-chip${skills.includes(s) ? ' selected' : ''}`}
                      onClick={() => toggleSkill(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Availability */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--navy)' }}>Availability & Schedule</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Service Radius (miles)</label>
                <input className="form-input" type="number" name="service_radius_miles" defaultValue={provider?.service_radius_miles ?? 15} min={1} max={100} />
              </div>
            </div>

            <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 10 }}>
              Shift Availability <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 11 }}>(select all that apply)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {SHIFT_OPTIONS.map(opt => {
                const on = shifts.includes(opt.value)
                return (
                  <button key={opt.value} type="button"
                    onClick={() => toggleShift(opt.value)}
                    style={{
                      padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                      border: `2px solid ${on ? 'var(--teal)' : 'var(--border)'}`,
                      background: on ? 'var(--teal-light)' : 'var(--surface)',
                      textAlign: 'left', transition: 'all 0.12s',
                    }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: on ? 'var(--navy)' : 'var(--text)' }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{opt.sub}</div>
                  </button>
                )
              })}
            </div>

            <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 10 }}>Preferred Work Days</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DAYS_OF_WEEK.map(d => (
                <button key={d} type="button"
                  className={`skill-chip${days.includes(d) ? ' selected' : ''}`}
                  onClick={() => toggleDay(d)}>
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" name="notes" defaultValue={provider?.notes ?? ''} /></div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: 'var(--navy)' }}>Status</div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Provider Status</label>
              <select className="form-select" name="status" defaultValue={provider?.status ?? 'active'}>
                <option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option>
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" name="available" defaultChecked={provider?.available ?? true} />
              <div><div style={{ fontWeight: 500 }}>Available for cases</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Included in matching engine</div></div>
            </label>
          </div>

          {/* Shift summary */}
          {shifts.length > 0 && (
            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', marginBottom: 8 }}>Shift Summary</div>
              {shifts.map(s => {
                const opt = SHIFT_OPTIONS.find(o => o.value === s)
                return opt ? (
                  <div key={s} style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                    ✓ <strong>{opt.label}</strong> <span style={{ color: 'var(--subtle)' }}>{opt.sub}</span>
                  </div>
                ) : null
              })}
            </div>
          )}

          {error && <div style={{ background: 'var(--red-bg)', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--red)' }}>{error}</div>}
          <button type="submit" className="btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14 }}>
            {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Provider'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.back()} style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
          {mode === 'edit' && (
            <button type="button" className="btn-danger" onClick={handleDelete} disabled={deleting} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              {deleting ? 'Deleting...' : 'Delete Provider'}
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
