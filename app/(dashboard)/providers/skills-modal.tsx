"use client"
import { useEffect, useState } from 'react'

/**
 * Skills & Attributes filter modal (v2.7.18).
 *
 * The 47 canonical skills grouped exactly the way SKILL_GROUPS is
 * grouped in components/ProviderForm.tsx and lib/email/types.ts.
 *
 * IMPORTANT — keep in sync with the other taxonomy sources:
 *   - types/index.ts → ALL_SKILLS               (canonical flat list)
 *   - components/ProviderForm.tsx → SKILL_GROUPS (admin form)
 *   - app/apply/route.ts → chip data-val attributes (apply form)
 *   - lib/email/types.ts → SKILL_GROUPS         (email + PDF)
 *   - app/(dashboard)/providers/skills-modal.tsx → SKILL_GROUPS (this file)
 *
 * If you add a new skill, update all five. See pitfall #9 in
 * carematch360-pitfalls.md.
 */
const SKILL_GROUPS: { group: string; skills: string[] }[] = [
  {
    group: 'Clinical Skills',
    skills: [
      'Vent Care', 'Trach Care', 'Wound Care', 'G-Tube', 'IV Therapy',
      'Catheter Care', 'Colostomy Care', 'Feeding Tube', 'Oxygen Therapy',
      'Medication Management', 'Vital Signs',
    ],
  },
  {
    group: 'Specialties',
    skills: [
      'Pediatrics', 'Geriatrics', 'Dementia Care', 'Alzheimer\u2019s',
      'Behavioral Health', 'Autism', 'Developmental Disabilities',
      'Hospice / Palliative', 'Oncology', 'Cardiac Care',
      'Diabetes Management', 'Stroke Recovery', 'Post-Surgical',
      'Orthopedic', 'Spinal care',
    ],
  },
  {
    group: 'Personal Care & ADLs',
    skills: [
      'Bathing assistance (tub/shower)', 'Bedpan / commode assistance',
      'Incontinence care', 'Peri care', 'Feeding assistance',
      'Dressing assistance', 'Oral hygiene & grooming',
      'Turn & reposition', 'Range of motion exercises',
      'General ADL assistance',
    ],
  },
  {
    group: 'Mobility & Care Attributes',
    skills: [
      'Total care', 'Wheelchair transfer', 'Hoyer lift',
      'Fall prevention', 'Ambulation assist', 'Transfer assist',
    ],
  },
  {
    group: 'Languages & Transport',
    skills: ['Spanish speaking', 'French speaking', 'Sign language', 'Has a car'],
  },
  {
    group: 'Nutrition',
    skills: ['Meal preparation'],
  },
]

interface Props {
  open: boolean
  initialCsv: string  // current selection as CSV (stable across renders)
  onClose: () => void
  onApply: (skills: string[]) => void
}

export default function SkillsModal({ open, initialCsv, onClose, onApply }: Props) {
  const [selected, setSelected] = useState<Set<string>>(() =>
    new Set(initialCsv ? initialCsv.split(',') : []),
  )
  const [search, setSearch] = useState('')

  // Re-seed selection whenever the modal is opened with a new initial set.
  // `initialCsv` is a primitive string so this is dep-stable.
  useEffect(() => {
    if (open) {
      setSelected(new Set(initialCsv ? initialCsv.split(',') : []))
      setSearch('')
    }
  }, [open, initialCsv])

  // Close on Escape key when open
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const term = search.trim().toLowerCase()

  function toggle(skill: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(skill)) next.delete(skill)
      else next.add(skill)
      return next
    })
  }

  function apply() {
    onApply(Array.from(selected))
  }

  function clearAll() {
    setSelected(new Set())
  }

  const chip = (skill: string) => {
    const on = selected.has(skill)
    return (
      <button
        key={skill}
        type="button"
        onClick={() => toggle(skill)}
        style={{
          padding: '6px 12px',
          borderRadius: 16,
          border: `1px solid ${on ? '#10B981' : '#CBD5E1'}`,
          background: on ? '#10B981' : '#fff',
          color: on ? '#fff' : '#334155',
          fontSize: 12.5,
          fontWeight: on ? 600 : 500,
          cursor: 'pointer',
          transition: 'all 0.1s',
        }}
      >
        {skill}
      </button>
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Select skills and attributes"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 14,
          width: '100%',
          maxWidth: 720,
          maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Skills & Attributes</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              Providers must have <strong>all</strong> selected skills.
              {selected.size > 0 && <> &nbsp;·&nbsp; {selected.size} selected</>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#94A3B8', padding: '0 4px', lineHeight: 1 }}
          >×</button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 22px', borderBottom: '1px solid #F1F5F9' }}>
          <input
            type="text"
            placeholder="Filter skills…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1.5px solid #E2E8F0',
              borderRadius: 8,
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Body */}
        <div style={{ padding: '6px 22px 18px 22px', overflowY: 'auto', flex: 1 }}>
          {SKILL_GROUPS.map(({ group, skills }) => {
            const visible = term
              ? skills.filter(s => s.toLowerCase().includes(term))
              : skills
            if (visible.length === 0) return null
            return (
              <div key={group} style={{ marginTop: 16 }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                }}>
                  {group}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {visible.map(chip)}
                </div>
              </div>
            )
          })}
          {term && SKILL_GROUPS.every(({ skills }) => skills.every(s => !s.toLowerCase().includes(term))) && (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              No skills match &ldquo;{search}&rdquo;
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <button
            type="button"
            onClick={clearAll}
            disabled={selected.size === 0}
            style={{
              background: 'none', border: 'none',
              color: selected.size === 0 ? '#CBD5E1' : '#475569',
              cursor: selected.size === 0 ? 'default' : 'pointer',
              fontSize: 13, padding: '6px 8px',
            }}
          >
            Clear selection
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#fff', color: '#475569',
                border: '1px solid #E2E8F0', borderRadius: 7,
                padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={apply}
              style={{
                background: 'linear-gradient(135deg,#10B981,#059669)',
                color: '#fff', border: 'none', borderRadius: 7,
                padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Apply
              {selected.size > 0 && <> &nbsp;·&nbsp; {selected.size}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
