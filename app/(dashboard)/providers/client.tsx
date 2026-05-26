"use client"
import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SkillsModal from './skills-modal'

const CRED_COLORS: Record<string, string> = {
  RN: '#0EA5E9', LPN: '#8B5CF6', CNA: '#10B981', GNA: '#14B8A6',
  CMT: '#F59E0B', PT: '#EF4444', OT: '#EC4899', ST: '#6366F1', UA: '#84CC16',
}

// Source label + color config — kept in one place so badges and dropdowns
// stay in sync.
const SOURCE_CONFIG: Record<string, { label: string; short: string; color: string; bg: string; border: string }> = {
  axiscare:    { label: 'AxisCare Import',     short: 'AxisCare',    color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  application: { label: 'Online Application',  short: 'Application', color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0' },
  manual:      { label: 'Manually Added',      short: 'Manual',      color: '#475569', bg: '#F1F5F9', border: '#CBD5E1' },
}

// v2.7.18 — filter option lists, kept aligned with the providers schema
// CHECK constraints / enum value sets. See carematch360-schema.md.
const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: 'male',         label: 'Male' },
  { value: 'female',       label: 'Female' },
  { value: 'non_binary',   label: 'Non-binary' },
  { value: 'unspecified',  label: 'Unspecified' },
]

const SHIFT_OPTIONS: { value: string; label: string }[] = [
  { value: 'morning',   label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening',   label: 'Evening' },
  { value: 'overnight', label: 'Overnight' },
]

const DAY_OPTIONS: { value: string; short: string }[] = [
  { value: 'Monday',    short: 'Mon' },
  { value: 'Tuesday',   short: 'Tue' },
  { value: 'Wednesday', short: 'Wed' },
  { value: 'Thursday',  short: 'Thu' },
  { value: 'Friday',    short: 'Fri' },
  { value: 'Saturday',  short: 'Sat' },
  { value: 'Sunday',    short: 'Sun' },
]

interface Props {
  providers: any[]
  inactiveCount: number
  activeCount: number
  params: any
  credentialTypes: string[]
  credentialLabels: Record<string, string>
  cities: string[]
}

// Friendly relative date for the Joined column. Falls back to a short
// absolute date for anything older than ~30 days.
function formatJoined(iso?: string): { rel: string; abs: string } {
  if (!iso) return { rel: '—', abs: '' }
  const d = new Date(iso)
  if (isNaN(d.getTime())) return { rel: '—', abs: '' }
  const now = Date.now()
  const diffMs = now - d.getTime()
  const days = Math.floor(diffMs / 86400000)
  const abs = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  let rel: string
  if (days < 1) rel = 'Today'
  else if (days === 1) rel = 'Yesterday'
  else if (days < 7) rel = `${days}d ago`
  else if (days < 30) rel = `${Math.floor(days / 7)}w ago`
  else rel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return { rel, abs }
}

// CSV utilities for multi-select URL params (v2.7.18)
function splitCsv(v?: string): string[] {
  if (!v) return []
  return v.split(',').map(s => s.trim()).filter(Boolean)
}
function toggleCsv(csv: string, value: string): string {
  const arr = splitCsv(csv)
  const idx = arr.indexOf(value)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(value)
  return arr.join(',')
}

export default function ProvidersClient({ providers, inactiveCount, activeCount, params, credentialTypes, credentialLabels, cities }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activating, setActivating] = useState(false)
  const [toast, setToast] = useState('')
  const [viewMode, setViewMode] = useState<'all' | 'inactive' | 'active'>('all')

  // v2.7.18 — "More filters" disclosure + skills modal local state
  const [moreOpen, setMoreOpen] = useState(false)
  const [skillsOpen, setSkillsOpen] = useState(false)

  const inactiveProviders = providers.filter(p => p.status === 'inactive')
  const displayedProviders = viewMode === 'inactive'
    ? providers.filter(p => p.status === 'inactive')
    : viewMode === 'active'
    ? providers.filter(p => p.status === 'active')
    : providers

  const inactiveSelected = [...selected].filter(id =>
    providers.find(p => p.id === id)?.status === 'inactive'
  )

  function toggleSelect(id: string) {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function toggleSelectAllInactive() {
    const inactiveIds = inactiveProviders.map(p => p.id)
    const allSelected = inactiveIds.every(id => selected.has(id))
    setSelected(allSelected ? new Set() : new Set(inactiveIds))
  }

  async function activateSelected(ids: string[]) {
    if (!ids.length) return
    setActivating(true)
    try {
      const res = await fetch('/api/providers/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'activate' }),
      })
      const data = await res.json()
      if (res.ok) {
        setToast(`✅ ${data.updated} provider${data.updated !== 1 ? 's' : ''} activated successfully`)
        setSelected(new Set())
        startTransition(() => router.refresh())
      } else {
        setToast(`❌ ${data.error}`)
      }
    } catch {
      setToast('❌ Something went wrong')
    }
    setActivating(false)
    setTimeout(() => setToast(''), 4000)
  }

  async function deactivate(id: string) {
    setActivating(true)
    try {
      const res = await fetch('/api/providers/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id], action: 'deactivate' }),
      })
      const data = await res.json()
      if (res.ok) {
        setToast('Provider deactivated')
        startTransition(() => router.refresh())
      } else {
        setToast(`❌ ${data.error}`)
      }
    } catch {}
    setActivating(false)
    setTimeout(() => setToast(''), 3000)
  }

  // Submit the filter form by updating the URL — this triggers a server
  // re-fetch with the new searchParams. Any param not passed in `next`
  // falls back to the current value in `params`, so existing filters
  // survive when another filter changes.
  function applyFilters(next: {
    search?: string; credential?: string; source?: string; sort?: string;
    gender?: string; city?: string; skills?: string; shifts?: string; days?: string;
  }) {
    const sp = new URLSearchParams()
    const search     = next.search     ?? params.search     ?? ''
    const credential = next.credential ?? params.credential ?? ''
    const source     = next.source     ?? params.source     ?? ''
    const sort       = next.sort       ?? params.sort       ?? ''
    const gender     = next.gender     ?? params.gender     ?? ''
    const city       = next.city       ?? params.city       ?? ''
    const skills     = next.skills     ?? params.skills     ?? ''
    const shifts     = next.shifts     ?? params.shifts     ?? ''
    const days       = next.days       ?? params.days       ?? ''
    if (search)     sp.set('search', search)
    if (credential) sp.set('credential', credential)
    if (source)     sp.set('source', source)
    if (sort)       sp.set('sort', sort)
    if (gender)     sp.set('gender', gender)
    if (city)       sp.set('city', city)
    if (skills)     sp.set('skills', skills)
    if (shifts)     sp.set('shifts', shifts)
    if (days)       sp.set('days', days)
    const qs = sp.toString()
    startTransition(() => router.push(`/providers${qs ? `?${qs}` : ''}`))
  }

  // Parsed multi-select selections (memoized — derive once per render)
  const genderSel = useMemo(() => new Set(splitCsv(params.gender)), [params.gender])
  const shiftSel  = useMemo(() => new Set(splitCsv(params.shifts)), [params.shifts])
  const daySel    = useMemo(() => new Set(splitCsv(params.days)),   [params.days])
  const skillSel  = useMemo(() => splitCsv(params.skills),          [params.skills])

  // Count of "more filters" currently active — shown on the disclosure button
  const moreFilterCount =
    genderSel.size +
    (params.city ? 1 : 0) +
    skillSel.length +
    shiftSel.size +
    daySel.size

  // True iff any filter (old or new) is active — drives the empty-state hint
  const anyFilterActive =
    !!params.search || !!params.credential || !!params.source ||
    moreFilterCount > 0

  // Counts for the active source filter chip
  const sourceCounts = {
    axiscare:    providers.filter(p => p._source === 'axiscare').length,
    application: providers.filter(p => p._source === 'application').length,
    manual:      providers.filter(p => p._source === 'manual').length,
  }

  const S: any = {
    card: { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    badge: (color: string, bg: string) => ({ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, color, background: bg }),
    btnActivate: { background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const },
    btnSecondary: { background: '#fff', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' },
    btnGhost: { background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 12, padding: '4px 8px' },
    select: { padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff', cursor: 'pointer' },
    // v2.7.18 — pill chip used by gender / shift / day / skills filters
    pillOn:  { padding: '6px 12px', borderRadius: 16, border: '1px solid #10B981', background: '#10B981', color: '#fff',   fontSize: 12.5, fontWeight: 600, cursor: 'pointer' },
    pillOff: { padding: '6px 12px', borderRadius: 16, border: '1px solid #CBD5E1', background: '#fff',    color: '#334155', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' },
    // v2.7.18 — active filter chip in the chip strip (with × button)
    activeChip: { display: 'inline-flex' as const, alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 16, color: '#475569', background: '#F1F5F9', border: '1px solid #CBD5E1' },
    activeChipX: { background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, fontSize: 14, lineHeight: 1 },
  }

  // Helper renderers for the active filter chip strip
  function ActiveChip({ label, onClear }: { label: string; onClear: () => void }) {
    return (
      <span style={S.activeChip}>
        {label}
        <button onClick={onClear} style={S.activeChipX} aria-label={`Clear ${label}`}>×</button>
      </span>
    )
  }

  return (
    <div style={{ padding: '24px 28px', fontFamily: "'Segoe UI', sans-serif", minHeight: '100vh', background: '#F8FAFC' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 100, background: toast.startsWith('✅') ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${toast.startsWith('✅') ? '#A7F3D0' : '#FECACA'}`, borderRadius: 10, padding: '12px 18px', fontSize: 13.5, fontWeight: 500, color: toast.startsWith('✅') ? '#065F46' : '#DC2626', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Provider Directory</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>
            {activeCount} active · <span style={{ color: inactiveCount > 0 ? '#F59E0B' : '#64748B', fontWeight: inactiveCount > 0 ? 600 : 400 }}>{inactiveCount} pending activation</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/providers/new">
            <button style={S.btnSecondary}>+ Add Provider</button>
          </Link>
          <Link href="/axiscare">
            <button style={S.btnSecondary}>↓ AxisCare Import</button>
          </Link>
        </div>
      </div>

      {/* Pending Activation Banner */}
      {inactiveCount > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>⏳</span>
            <div>
              <div style={{ fontWeight: 600, color: '#92400E', fontSize: 14 }}>{inactiveCount} provider{inactiveCount !== 1 ? 's' : ''} pending activation</div>
              <div style={{ fontSize: 12.5, color: '#92400E', marginTop: 2 }}>These providers were imported but need to be activated before they appear in matching.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setViewMode(viewMode === 'inactive' ? 'all' : 'inactive')}
              style={{ ...S.btnSecondary, borderColor: viewMode === 'inactive' ? '#F59E0B' : '#E2E8F0', color: viewMode === 'inactive' ? '#92400E' : '#475569' }}>
              {viewMode === 'inactive' ? 'Show all' : 'Show pending only'}
            </button>
            <button onClick={() => activateSelected(inactiveProviders.map(p => p.id))} disabled={activating}
              style={{ ...S.btnActivate, opacity: activating ? 0.6 : 1 }}>
              {activating ? '⏳ Activating…' : `✓ Activate All ${inactiveCount}`}
            </button>
          </div>
        </div>
      )}

      {/* Bulk action bar — shown when inactive providers are selected */}
      {inactiveSelected.length > 0 && (
        <div style={{ background: '#0B3D5C', borderRadius: 10, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: '#fff', fontSize: 13.5, fontWeight: 500 }}>
            {inactiveSelected.length} inactive provider{inactiveSelected.length !== 1 ? 's' : ''} selected
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setSelected(new Set())} style={{ ...S.btnGhost, color: 'rgba(255,255,255,0.6)' }}>✕ Clear</button>
            <button onClick={() => activateSelected(inactiveSelected)} disabled={activating}
              style={{ ...S.btnActivate, opacity: activating ? 0.6 : 1 }}>
              ✓ Activate {inactiveSelected.length} selected
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ ...S.card, padding: '14px 18px', marginBottom: 16 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            applyFilters({
              search:     (fd.get('search')     as string) || '',
              credential: (fd.get('credential') as string) || '',
              source:     (fd.get('source')     as string) || '',
              sort:       (fd.get('sort')       as string) || '',
            })
          }}
          style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' as const }}
        >
          <input
            name="search"
            defaultValue={params.search ?? ''}
            placeholder="Search by name, email, city..."
            style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, outline: 'none', minWidth: 240 }}
          />
          <select name="credential" defaultValue={params.credential ?? ''} style={S.select}>
            <option value="">All credentials</option>
            {credentialTypes.map(c => <option key={c} value={c}>{c} — {credentialLabels[c]}</option>)}
          </select>

          <select
            name="source"
            defaultValue={params.source ?? ''}
            style={S.select}
            onChange={(e) => applyFilters({ source: e.currentTarget.value })}
          >
            <option value="">All sources ({providers.length})</option>
            <option value="axiscare">AxisCare Import ({sourceCounts.axiscare})</option>
            <option value="application">Online Application ({sourceCounts.application})</option>
            <option value="manual">Manually Added ({sourceCounts.manual})</option>
          </select>

          <select
            name="sort"
            defaultValue={params.sort ?? 'newest'}
            style={S.select}
            onChange={(e) => applyFilters({ sort: e.currentTarget.value })}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
          </select>

          {/* v2.7.18 — More filters disclosure button */}
          <button
            type="button"
            onClick={() => setMoreOpen(o => !o)}
            style={{
              ...S.btnSecondary,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              borderColor: moreFilterCount > 0 ? '#10B981' : '#E2E8F0',
              color: moreFilterCount > 0 ? '#065F46' : '#475569',
              background: moreFilterCount > 0 ? '#ECFDF5' : '#fff',
            }}
            aria-expanded={moreOpen}
          >
            {moreOpen ? '▾' : '▸'} More filters
            {moreFilterCount > 0 && (
              <span style={{
                background: '#10B981', color: '#fff',
                fontSize: 11, fontWeight: 700,
                padding: '1px 7px', borderRadius: 10,
                minWidth: 18, textAlign: 'center',
              }}>{moreFilterCount}</span>
            )}
          </button>

          {/* View mode tabs */}
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 8, padding: 3, gap: 2 }}>
            {[['all', 'All'], ['active', 'Active'], ['inactive', 'Pending']].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setViewMode(v as any)}
                style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: viewMode === v ? 600 : 400,
                  background: viewMode === v ? '#fff' : 'transparent', color: viewMode === v ? '#0F172A' : '#64748B',
                  boxShadow: viewMode === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                {l}
              </button>
            ))}
          </div>

          <button type="submit" style={{ ...S.btnSecondary }}>Filter</button>
          <Link href="/providers"><button type="button" style={{ ...S.btnGhost }}>Clear</button></Link>
        </form>

        {/* v2.7.18 — Collapsible "More filters" panel */}
        {moreOpen && (
          <div style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px solid #F1F5F9',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 18,
          }}>
            {/* Gender */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Gender <span style={{ fontWeight: 500, color: '#94A3B8', textTransform: 'none', letterSpacing: 0 }}>· any of</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {GENDER_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    style={genderSel.has(opt.value) ? S.pillOn : S.pillOff}
                    onClick={() => applyFilters({ gender: toggleCsv(params.gender ?? '', opt.value) })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* City */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                City
              </div>
              <select
                value={params.city ?? ''}
                onChange={(e) => applyFilters({ city: e.currentTarget.value })}
                style={{ ...S.select, width: '100%', maxWidth: 280 }}
              >
                <option value="">All cities ({cities.length})</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Shifts */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Shift availability <span style={{ fontWeight: 500, color: '#94A3B8', textTransform: 'none', letterSpacing: 0 }}>· any of</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {SHIFT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    style={shiftSel.has(opt.value) ? S.pillOn : S.pillOff}
                    onClick={() => applyFilters({ shifts: toggleCsv(params.shifts ?? '', opt.value) })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Days */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Preferred days <span style={{ fontWeight: 500, color: '#94A3B8', textTransform: 'none', letterSpacing: 0 }}>· any of</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {DAY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    style={daySel.has(opt.value) ? S.pillOn : S.pillOff}
                    onClick={() => applyFilters({ days: toggleCsv(params.days ?? '', opt.value) })}
                  >
                    {opt.short}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills & Attributes — opens modal */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Skills &amp; attributes <span style={{ fontWeight: 500, color: '#94A3B8', textTransform: 'none', letterSpacing: 0 }}>· all of</span>
              </div>
              <button
                type="button"
                onClick={() => setSkillsOpen(true)}
                style={{ ...S.btnSecondary, padding: '8px 14px' }}
              >
                {skillSel.length > 0
                  ? `Edit skills (${skillSel.length} selected)`
                  : '+ Add skills'}
              </button>
              {skillSel.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  {skillSel.map(s => (
                    <span key={s} style={{
                      ...S.activeChip,
                      background: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46',
                    }}>
                      {s}
                      <button
                        onClick={() => applyFilters({ skills: toggleCsv(params.skills ?? '', s) })}
                        style={S.activeChipX}
                        aria-label={`Remove ${s}`}
                      >×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active filter chip strip — covers ALL active filters (v2.7.18) */}
      {anyFilterActive && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748B' }}>Active:</span>

          {params.search && (
            <ActiveChip label={`"${params.search}"`} onClear={() => applyFilters({ search: '' })} />
          )}
          {params.credential && (
            <ActiveChip label={`Credential: ${params.credential}`} onClear={() => applyFilters({ credential: '' })} />
          )}
          {params.source && SOURCE_CONFIG[params.source] && (
            <span style={{
              ...S.activeChip,
              color: SOURCE_CONFIG[params.source].color,
              background: SOURCE_CONFIG[params.source].bg,
              border: `1px solid ${SOURCE_CONFIG[params.source].border}`,
            }}>
              {SOURCE_CONFIG[params.source].label}
              <button onClick={() => applyFilters({ source: '' })} style={S.activeChipX} aria-label="Clear source filter">×</button>
            </span>
          )}

          {/* Gender chips (one per selected value) */}
          {[...genderSel].map(g => {
            const opt = GENDER_OPTIONS.find(o => o.value === g)
            const label = opt ? opt.label : g
            return (
              <ActiveChip
                key={`g-${g}`}
                label={`Gender: ${label}`}
                onClear={() => applyFilters({ gender: toggleCsv(params.gender ?? '', g) })}
              />
            )
          })}

          {/* City */}
          {params.city && (
            <ActiveChip label={`City: ${params.city}`} onClear={() => applyFilters({ city: '' })} />
          )}

          {/* Shift chips */}
          {[...shiftSel].map(s => {
            const opt = SHIFT_OPTIONS.find(o => o.value === s)
            const label = opt ? opt.label : s
            return (
              <ActiveChip
                key={`s-${s}`}
                label={`Shift: ${label}`}
                onClear={() => applyFilters({ shifts: toggleCsv(params.shifts ?? '', s) })}
              />
            )
          })}

          {/* Day chips */}
          {[...daySel].map(d => (
            <ActiveChip
              key={`d-${d}`}
              label={d}
              onClear={() => applyFilters({ days: toggleCsv(params.days ?? '', d) })}
            />
          ))}

          {/* Skill chips */}
          {skillSel.map(s => (
            <ActiveChip
              key={`sk-${s}`}
              label={`Skill: ${s}`}
              onClear={() => applyFilters({ skills: toggleCsv(params.skills ?? '', s) })}
            />
          ))}

          {/* Clear all */}
          <Link href="/providers">
            <button type="button" style={{ ...S.btnGhost, fontSize: 12, marginLeft: 4 }}>
              Clear all
            </button>
          </Link>
        </div>
      )}

      {/* Table */}
      <div style={{ ...S.card, overflow: 'hidden' }}>
        {/* Table header with select-all for inactive */}
        {inactiveCount > 0 && viewMode !== 'active' && (
          <div style={{ padding: '10px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10, background: '#FAFAFA' }}>
            <input type="checkbox"
              checked={inactiveProviders.length > 0 && inactiveProviders.every(p => selected.has(p.id))}
              onChange={toggleSelectAllInactive}
              style={{ accentColor: '#10B981' }}/>
            <span style={{ fontSize: 12, color: '#64748B' }}>Select all {inactiveProviders.length} pending providers</span>
          </div>
        )}

        {displayedProviders.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>♥</div>
            <div style={{ fontWeight: 500, marginBottom: 6, color: '#334155' }}>
              No providers {anyFilterActive ? 'match your filters' : 'found'}
            </div>
            {anyFilterActive ? (
              <div style={{ marginBottom: 14, fontSize: 13 }}>
                Try removing one or more filters above.
              </div>
            ) : null}
            {anyFilterActive ? (
              <Link href="/providers"><button style={S.btnSecondary}>Clear all filters</button></Link>
            ) : (
              <Link href="/providers/new"><button style={S.btnActivate}>+ Add Provider</button></Link>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {(inactiveCount > 0 && viewMode !== 'active') && <th style={{ width: 40, padding: '11px 14px', borderBottom: '1px solid #E2E8F0' }}></th>}
                <th style={{ padding: '11px 16px', textAlign: 'left' as const, fontSize: 11.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: '1px solid #E2E8F0' }}>Name</th>
                <th style={{ padding: '11px 16px', textAlign: 'left' as const, fontSize: 11.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: '1px solid #E2E8F0' }}>Credential</th>
                <th style={{ padding: '11px 16px', textAlign: 'left' as const, fontSize: 11.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: '1px solid #E2E8F0' }}>Location</th>
                <th style={{ padding: '11px 16px', textAlign: 'left' as const, fontSize: 11.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: '1px solid #E2E8F0' }}>Joined</th>
                <th style={{ padding: '11px 16px', textAlign: 'left' as const, fontSize: 11.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: '1px solid #E2E8F0' }}>Status</th>
                <th style={{ padding: '11px 16px', textAlign: 'left' as const, fontSize: 11.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: '1px solid #E2E8F0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedProviders.map(p => {
                const isInactive = p.status === 'inactive'
                const isChecked = selected.has(p.id)
                const credColor = CRED_COLORS[p.credential_type] ?? '#64748B'
                const sourceCfg = SOURCE_CONFIG[p._source] ?? SOURCE_CONFIG.manual
                const joined = formatJoined(p.created_at)
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9', background: isChecked ? '#F0FDF4' : isInactive ? '#FEFCE8' : '#fff', transition: 'background 0.1s' }}>
                    {(inactiveCount > 0 && viewMode !== 'active') && (
                      <td style={{ padding: '12px 14px' }}>
                        {isInactive && (
                          <input type="checkbox" checked={isChecked} onChange={() => toggleSelect(p.id)} style={{ accentColor: '#10B981' }}/>
                        )}
                      </td>
                    )}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 500, fontSize: 13.5, color: '#0F172A' }}>{p.name}</div>
                      <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 1 }}>{p.email || p.phone || '—'}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: credColor + '18', color: credColor, border: `1px solid ${credColor}44`, borderRadius: 6, padding: '3px 9px', fontSize: 12, fontWeight: 700 }}>
                        {p.credential_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748B' }}>
                      {[p.city, p.state].filter(Boolean).join(', ') || '—'}
                      {p.service_radius_miles && <div style={{ fontSize: 11, color: '#94A3B8' }}>{p.service_radius_miles}mi radius</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 12.5, color: '#334155', fontWeight: 500 }} title={joined.abs}>{joined.rel}</div>
                      <span style={{
                        display: 'inline-block', marginTop: 3,
                        fontSize: 10.5, fontWeight: 600,
                        padding: '2px 7px', borderRadius: 10,
                        color: sourceCfg.color, background: sourceCfg.bg,
                        border: `1px solid ${sourceCfg.border}`,
                      }}>
                        {sourceCfg.short}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {isInactive ? (
                        <span style={{ background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 20, padding: '3px 10px', fontSize: 11.5, fontWeight: 600 }}>
                          ⏳ Pending
                        </span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', borderRadius: 20, padding: '3px 10px', fontSize: 11.5, fontWeight: 600 }}>
                            ✓ Active
                          </span>
                          {p.available && (
                            <span style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 20, padding: '2px 8px', fontSize: 10.5, fontWeight: 600 }}>
                              Available
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                        {isInactive ? (
                          <button onClick={() => activateSelected([p.id])} disabled={activating}
                            style={{ ...S.btnActivate, padding: '6px 14px', opacity: activating ? 0.6 : 1 }}>
                            ✓ Activate
                          </button>
                        ) : (
                          <button onClick={() => deactivate(p.id)} disabled={activating}
                            style={{ ...S.btnGhost, color: '#94A3B8', fontSize: 11 }}>
                            Deactivate
                          </button>
                        )}
                        <Link href={`/providers/${p.id}`}>
                          <button style={{ ...S.btnSecondary, padding: '6px 12px', fontSize: 12 }}>View →</button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 12, textAlign: 'center' }}>
        {displayedProviders.length} provider{displayedProviders.length !== 1 ? 's' : ''} shown
      </div>

      {/* Skills modal — controlled */}
      <SkillsModal
        open={skillsOpen}
        initialCsv={params.skills ?? ''}
        onClose={() => setSkillsOpen(false)}
        onApply={(list) => {
          setSkillsOpen(false)
          applyFilters({ skills: list.join(',') })
        }}
      />
    </div>
  )
}
