"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Client, CREDENTIAL_TYPES, CREDENTIAL_LABELS, CREDENTIAL_GROUPS, CARE_LEVELS, CARE_LEVEL_LABELS, CARE_LEVEL_DESCRIPTIONS, SKILL_TO_REQ, PAYER_TYPES } from '@/types'

interface Props { client?: Client; mode: 'new'|'edit' }

// Unified requirements pool (same grouping as provider skills)
const REQ_GROUPS = [
  { label: 'Clinical Skills', items: ['Vent Care','Trach Care','Wound Care','G-Tube','IV Therapy','Catheter Care','Colostomy Care','Feeding Tube','Oxygen Therapy','Medication Management','Vital Signs'] },
  { label: 'Specialties', items: ['Pediatrics','Geriatrics','Dementia Care',"Alzheimer's",'Behavioral Health','Autism','Developmental Disabilities','Hospice / Palliative','Oncology','Cardiac Care','Diabetes Management','Stroke Recovery','Post-Surgical','Orthopedic','Spinal care'] },
  { label: 'Mobility & Care Needs', items: ['Total care','Wheelchair transfer','Hoyer lift','Fall prevention','Ambulation assist','Transfer assist'] },
  { label: 'Provider Attributes Required', items: ['Spanish speaking','Has a car','Meal preparation','French speaking','Sign language'] },
]

function initialRequirements(client?: Client): string[] {
  if (!client) return []
  const reqs = [...(client.required_skills || [])]
  // Re-surface capability booleans as requirement chips
  Object.entries(SKILL_TO_REQ).forEach(([skill, req]) => {
    if ((client as any)[req] && !reqs.includes(skill)) reqs.push(skill)
  })
  return reqs
}

export default function ClientForm({ client, mode }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [requirements, setRequirements] = useState<string[]>(initialRequirements(client))
  const [careNeeds, setCareNeeds] = useState<string[]>(client?.care_needs ?? [])
  const [additionalCreds, setAdditionalCreds] = useState<string[]>(client?.additional_credentials ?? [])
  const [payerTypes, setPayerTypes] = useState<string[]>(client?.payer_types ?? [])

  const toggleReq      = (s: string) => setRequirements(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])
  const toggleCareNeed = (v: string) => setCareNeeds(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])
  const toggleCred  = (c: string) => setAdditionalCreds(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])
  const togglePayer = (p: string) => setPayerTypes(prev => {
    if (prev.includes(p)) return prev.filter(x => x !== p)
    if (prev.length >= 2) return [prev[1], p]
    return [...prev, p]
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setError('')
    const fd = new FormData(e.currentTarget)

    // Separate pure skills from capability flags
    const pureSkills = requirements.filter(s => !SKILL_TO_REQ[s])
    const reqFlags: Record<string, boolean> = {}
    Object.entries(SKILL_TO_REQ).forEach(([skill, req]) => { reqFlags[req] = requirements.includes(skill) })

    const body = {
      name: fd.get('name'), address: fd.get('address'), city: fd.get('city'),
      state: fd.get('state'), zip: fd.get('zip'),
      contact_name: fd.get('contact_name'), contact_phone: fd.get('contact_phone'), contact_email: fd.get('contact_email'),
      required_credential: fd.get('required_credential') || null,
      care_needs: careNeeds,
      additional_credentials: additionalCreds,
      required_skills: pureSkills,
      visit_frequency: fd.get('visit_frequency'),
      urgency_level: fd.get('urgency_level'),
      payer_types: payerTypes,
      gender_preference: fd.get('gender_preference'),
      status: fd.get('status'), notes: fd.get('notes'),
      ...reqFlags,
    }
    try {
      const url = mode === 'edit' ? `/api/clients/${client!.id}` : '/api/clients'
      const res = await fetch(url, { method: mode === 'edit' ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      router.push(`/clients/${json.id}`); router.refresh()
    } catch (err: any) { setError(err.message) } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirm('Delete this client?')) return; setDeleting(true)
    try { await fetch(`/api/clients/${client!.id}`, { method: 'DELETE' }); router.push('/clients'); router.refresh() }
    catch { setError('Delete failed'); setDeleting(false) }
  }

  const primaryCred = client?.required_credential

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, padding: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Client info */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--navy)' }}>Client Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Client Full Name *</label><input className="form-input" name="name" defaultValue={client?.name} required /></div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Address</label><input className="form-input" name="address" defaultValue={client?.address ?? ''} /></div>
              <div className="form-group"><label className="form-label">City</label><input className="form-input" name="city" defaultValue={client?.city ?? ''} /></div>
              <div className="form-group"><label className="form-label">State</label><input className="form-input" name="state" defaultValue={client?.state ?? 'MD'} /></div>
              <div className="form-group"><label className="form-label">ZIP</label><input className="form-input" name="zip" defaultValue={client?.zip ?? ''} /></div>
            </div>
          </div>

          {/* Contact */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--navy)' }}>Emergency / Family Contact</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Contact Name</label><input className="form-input" name="contact_name" defaultValue={client?.contact_name ?? ''} /></div>
              <div className="form-group"><label className="form-label">Contact Phone</label><input className="form-input" name="contact_phone" defaultValue={client?.contact_phone ?? ''} /></div>
              <div className="form-group"><label className="form-label">Contact Email</label><input className="form-input" type="email" name="contact_email" defaultValue={client?.contact_email ?? ''} /></div>
            </div>
          </div>

          {/* Care plan */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--navy)' }}>Care Plan</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Visit Frequency</label>
                <select className="form-select" name="visit_frequency" defaultValue={client?.visit_frequency ?? ''}>
                  <option value="">Select</option>
                  <option>Daily</option><option>3x/week</option><option>2x/week</option>
                  <option>Weekly</option><option>PRN (as needed)</option><option>One-time</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Urgency Level</label>
                <select className="form-select" name="urgency_level" defaultValue={client?.urgency_level ?? 'routine'}>
                  <option value="routine">Routine</option><option value="urgent">Urgent</option><option value="emergency">Emergency</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Gender Preference for Provider</label>
                <select className="form-select" name="gender_preference" defaultValue={client?.gender_preference ?? 'any'}>
                  <option value="any">No preference</option>
                  <option value="male">Male provider preferred</option>
                  <option value="female">Female provider preferred</option>
                </select>
              </div>
            </div>

            {/* Payer */}
            <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>
              Payer Type <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 11 }}>(select up to 2)</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: payerTypes.length > 0 ? 10 : 16 }}>
              {PAYER_TYPES.map(p => {
                const on = payerTypes.includes(p)
                const disabled = !on && payerTypes.length >= 2
                return (
                  <button key={p} type="button" className={`skill-chip${on ? ' selected' : ''}`}
                    onClick={() => togglePayer(p)}
                    style={{ opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
                    {on && '✓ '}{p}
                  </button>
                )
              })}
            </div>
            {payerTypes.length > 0 && (
              <div style={{ background: 'var(--teal-light)', border: '1px solid #BAE6FD', borderRadius: 7, padding: '7px 12px', fontSize: 12.5, color: 'var(--navy)', marginBottom: 16 }}>
                <strong>{payerTypes.join(' + ')}</strong>
              </div>
            )}
          </div>

          {/* Care Needs — primary selector */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: 'var(--navy)' }}>Care Needs</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>Select all types of care this client needs — each becomes a separate case</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {CARE_LEVELS.map(level => {
                const on = careNeeds.includes(level)
                return (
                  <button key={level} type="button" onClick={() => toggleCareNeed(level)}
                    style={{
                      padding: '10px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                      border: `2px solid ${on ? 'var(--teal)' : 'var(--border)'}`,
                      background: on ? 'var(--teal-light)' : 'var(--surface)',
                      transition: 'all 0.12s',
                    }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: on ? 'var(--navy)' : 'var(--text)' }}>
                      {on && '✓ '}{CARE_LEVEL_LABELS[level]}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, lineHeight: 1.4 }}>
                      {CARE_LEVEL_DESCRIPTIONS[level]}
                    </div>
                  </button>
                )
              })}
            </div>
            {careNeeds.length > 1 && (
              <div style={{ background: 'var(--teal-light)', border: '1px solid #BAE6FD', borderRadius: 7, padding: '8px 12px', fontSize: 12, color: 'var(--navy)' }}>
                💡 <strong>{careNeeds.length} care needs selected</strong> — open a separate case for each to get dedicated provider pools
              </div>
            )}
          </div>

          {/* Requirements — unified */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: 'var(--navy)' }}>Requirements</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
              {requirements.length} selected — clinical skills, specialties, and provider attributes all in one place
            </div>
            {REQ_GROUPS.map(group => (
              <div key={group.label} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{group.label}</div>
                <div className="skill-grid">
                  {group.items.map(s => (
                    <button key={s} type="button"
                      className={`skill-chip${requirements.includes(s) ? ' selected' : ''}`}
                      onClick={() => toggleReq(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div className="form-group"><label className="form-label">Clinical Notes</label><textarea className="form-textarea" name="notes" defaultValue={client?.notes ?? ''} style={{ minHeight: 100 }} /></div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: 'var(--navy)' }}>Record Status</div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" defaultValue={client?.status ?? 'active'}>
                <option value="active">Active</option><option value="inactive">Inactive</option><option value="discharged">Discharged</option>
              </select>
            </div>
          </div>
          {additionalCreds.length > 0 && (
            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', marginBottom: 8 }}>Also needs</div>
              {additionalCreds.map(c => (
                <div key={c} style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                  ✓ {c} — {CREDENTIAL_LABELS[c as import('@/types').CredentialType]}
                </div>
              ))}
              <div style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                Open a separate case for each
              </div>
            </div>
          )}
          {error && <div style={{ background: 'var(--red-bg)', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--red)' }}>{error}</div>}
          <button type="submit" className="btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14 }}>
            {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Client'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.back()} style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
          {mode === 'edit' && (
            <>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                <a href={`/cases/new?client_id=${client!.id}`}>
                  <button type="button" className="btn-teal" style={{ width: '100%', justifyContent: 'center' }}>+ Open Case for Client</button>
                </a>
              </div>
              <button type="button" className="btn-danger" onClick={handleDelete} disabled={deleting} style={{ width: '100%', justifyContent: 'center' }}>
                {deleting ? 'Deleting...' : 'Delete Client'}
              </button>
            </>
          )}
        </div>
      </div>
    </form>
  )
}
