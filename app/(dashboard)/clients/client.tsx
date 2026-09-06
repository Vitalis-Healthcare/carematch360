"use client"
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/StatusBadge'

// v2.7.28 — max clients per combined print/download face sheet batch.
// Enforced here (buttons disable) AND server-side in
// app/api/clients/facesheet-pdf/route.ts. Keep the two in sync.
const PDF_BATCH_CAP = 25

// Source label + color config — kept in one place so badges and dropdowns
// stay in sync. Vita uses purple to match the new Leads tab on Cases.
const SOURCE_CONFIG: Record<string, { label: string; short: string; color: string; bg: string; border: string }> = {
  vita:     { label: 'Vita Lead',         short: 'Vita',     color: '#7E22CE', bg: '#FAF5FF', border: '#E9D5FF' },
  axiscare: { label: 'AxisCare Import',   short: 'AxisCare', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  inquiry:  { label: 'Online Inquiry',    short: 'Inquiry',  color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0' },
  manual:   { label: 'Manually Added',    short: 'Manual',   color: '#475569', bg: '#F1F5F9', border: '#CBD5E1' },
}

interface Props {
  clients: any[]
  params: any
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

export default function ClientsClient({ clients, params }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  // v2.7.28 — face sheet print/download selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const toggleSelect = (id: string) => setSelected(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s
  })
  // Same form-POST mechanism as the Provider Directory (v2.7.25):
  // target=_blank inline for print (no popup blockers), attachment
  // variant downloads in place.
  function submitFacesheetPdf(download: boolean) {
    const ids = [...selected]
    if (ids.length === 0 || ids.length > PDF_BATCH_CAP) return
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/api/clients/facesheet-pdf'
    if (!download) form.target = '_blank'
    const idsInput = document.createElement('input')
    idsInput.type = 'hidden'
    idsInput.name = 'ids'
    idsInput.value = ids.join(',')
    form.appendChild(idsInput)
    if (download) {
      const dl = document.createElement('input')
      dl.type = 'hidden'
      dl.name = 'download'
      dl.value = '1'
      form.appendChild(dl)
    }
    document.body.appendChild(form)
    form.submit()
    form.remove()
  }

  // Counts for the source dropdown — these reflect the result set BEFORE
  // the source filter is applied (so each option shows how many would
  // appear if you picked it).
  // Since the parent component already filtered by source, we approximate
  // counts by recomputing across the visible set per derived _source.
  // For an exact count regardless of current filter we'd have to pass the
  // pre-filter array — fine to do later if it matters.
  const sourceCounts = {
    vita:     clients.filter(c => c._source === 'vita').length,
    axiscare: clients.filter(c => c._source === 'axiscare').length,
    inquiry:  clients.filter(c => c._source === 'inquiry').length,
    manual:   clients.filter(c => c._source === 'manual').length,
  }

  // Submit filter changes by updating the URL
  function applyFilters(next: { search?: string; urgency?: string; source?: string; sort?: string }) {
    const sp = new URLSearchParams()
    const search  = next.search  ?? params.search  ?? ''
    const urgency = next.urgency ?? params.urgency ?? ''
    const source  = next.source  ?? params.source  ?? ''
    const sort    = next.sort    ?? params.sort    ?? ''
    if (search)  sp.set('search', search)
    if (urgency) sp.set('urgency', urgency)
    if (source)  sp.set('source', source)
    if (sort)    sp.set('sort', sort)
    const qs = sp.toString()
    startTransition(() => router.push(`/clients${qs ? `?${qs}` : ''}`))
  }

  return (
    <div className="page-body">
      {/* Filter bar */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 16 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            applyFilters({
              search:  (fd.get('search')  as string) || '',
              urgency: (fd.get('urgency') as string) || '',
              source:  (fd.get('source')  as string) || '',
              sort:    (fd.get('sort')    as string) || '',
            })
          }}
          style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}
        >
          <input
            className="form-input"
            name="search"
            placeholder="Search by name, city, contact, payer..."
            defaultValue={params.search ?? ''}
            style={{ maxWidth: 280 }}
          />

          <select
            className="form-select"
            name="urgency"
            defaultValue={params.urgency ?? ''}
            style={{ maxWidth: 160 }}
            onChange={(e) => applyFilters({ urgency: e.currentTarget.value })}
          >
            <option value="">All urgency levels</option>
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="emergency">Emergency</option>
          </select>

          <select
            className="form-select"
            name="source"
            defaultValue={params.source ?? ''}
            style={{ maxWidth: 200 }}
            onChange={(e) => applyFilters({ source: e.currentTarget.value })}
          >
            <option value="">All sources ({clients.length})</option>
            <option value="vita">Vita Lead ({sourceCounts.vita})</option>
            <option value="axiscare">AxisCare Import ({sourceCounts.axiscare})</option>
            <option value="inquiry">Online Inquiry ({sourceCounts.inquiry})</option>
            <option value="manual">Manually Added ({sourceCounts.manual})</option>
          </select>

          <select
            className="form-select"
            name="sort"
            defaultValue={params.sort ?? 'newest'}
            style={{ maxWidth: 160 }}
            onChange={(e) => applyFilters({ sort: e.currentTarget.value })}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
          </select>

          <button type="submit" className="btn-secondary">Filter</button>
          <Link href="/clients">
            <button type="button" className="btn-secondary" style={{ color: 'var(--muted)' }}>Clear</button>
          </Link>
        </form>
      </div>

      {/* Active filter chips */}
      {(params.source || params.urgency || params.search) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748B' }}>Showing:</span>
          {params.source && SOURCE_CONFIG[params.source] && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600,
              padding: '4px 10px', borderRadius: 16,
              color: SOURCE_CONFIG[params.source].color,
              background: SOURCE_CONFIG[params.source].bg,
              border: `1px solid ${SOURCE_CONFIG[params.source].border}`,
            }}>
              {SOURCE_CONFIG[params.source].label}
              <button
                onClick={() => applyFilters({ source: '' })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, fontSize: 14, lineHeight: 1 }}
                aria-label="Clear source filter"
              >×</button>
            </span>
          )}
          {params.urgency && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 16, color: '#475569', background: '#F1F5F9', border: '1px solid #CBD5E1', textTransform: 'capitalize' }}>
              Urgency: {params.urgency}
              <button onClick={() => applyFilters({ urgency: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, fontSize: 14, lineHeight: 1 }} aria-label="Clear urgency filter">×</button>
            </span>
          )}
          {params.search && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 16, color: '#475569', background: '#F1F5F9', border: '1px solid #CBD5E1' }}>
              "{params.search}"
              <button onClick={() => applyFilters({ search: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, fontSize: 14, lineHeight: 1 }} aria-label="Clear search">×</button>
            </span>
          )}
        </div>
      )}

      {/* Bulk action bar — shown when any clients are selected (v2.7.28) */}
      {selected.size > 0 && (
        <div style={{ background: '#0B3D5C', borderRadius: 10, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ color: '#fff', fontSize: 13.5, fontWeight: 500 }}>
            {selected.size} client{selected.size !== 1 ? 's' : ''} selected
            {selected.size > PDF_BATCH_CAP && (
              <span style={{ marginLeft: 10, fontSize: 12, color: '#FCD34D', fontWeight: 400 }}>
                Print/download is limited to {PDF_BATCH_CAP} at a time
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setSelected(new Set())} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 12.5, fontWeight: 500 }}>✕ Clear</button>
            <button onClick={() => submitFacesheetPdf(false)} disabled={selected.size > PDF_BATCH_CAP}
              title="Open combined face sheets as one print-ready PDF"
              style={{ background: 'none', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 7, padding: '6px 12px', fontSize: 12.5, fontWeight: 500, opacity: selected.size > PDF_BATCH_CAP ? 0.4 : 1, cursor: selected.size > PDF_BATCH_CAP ? 'not-allowed' : 'pointer' }}>
              🖨 Print face sheets
            </button>
            <button onClick={() => submitFacesheetPdf(true)} disabled={selected.size > PDF_BATCH_CAP}
              title="Download combined face sheets as one PDF"
              style={{ background: 'none', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 7, padding: '6px 12px', fontSize: 12.5, fontWeight: 500, opacity: selected.size > PDF_BATCH_CAP ? 0.4 : 1, cursor: selected.size > PDF_BATCH_CAP ? 'not-allowed' : 'pointer' }}>
              ⬇ Download PDF
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {clients.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⊙</div>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>No clients found</div>
            <Link href="/clients/new"><button className="btn-primary" style={{ marginTop: 16 }}>+ Add Client</button></Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" aria-label="Select all clients"
                    checked={clients.length > 0 && clients.every(c => selected.has(c.id))}
                    onChange={() => {
                      const ids = clients.map(c => c.id)
                      const all = ids.every(id => selected.has(id))
                      setSelected(all ? new Set() : new Set(ids))
                    }}
                    style={{ accentColor: '#10B981' }}/>
                </th>
                <th>Client</th>
                <th>Location</th>
                <th>Required Credential</th>
                <th>Payer</th>
                <th>Joined</th>
                <th>Urgency</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => {
                const sourceCfg = SOURCE_CONFIG[c._source] ?? SOURCE_CONFIG.manual
                const joined = formatJoined(c.created_at)
                // Pre-existing display bug fix: schema has payer_types (array)
                // not payer_type (singular) — original page always rendered '—'.
                const payerDisplay = Array.isArray(c.payer_types) && c.payer_types.length > 0
                  ? c.payer_types.map((p: string) => p.replace(/_/g, ' ')).join(', ')
                  : '—'
                return (
                  <tr key={c.id} style={{ background: selected.has(c.id) ? '#F0FDF4' : undefined }}>
                    <td>
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} style={{ accentColor: '#10B981' }}/>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.contact_name || c.contact_phone || '—'}</div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--muted)' }}>
                      {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td>
                      {c.required_credential
                        ? <span style={{ background: 'var(--teal-light)', color: 'var(--navy)', border: '1px solid #BAE6FD', borderRadius: 6, padding: '2px 9px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)', display: 'inline-block' }}>{c.required_credential}</span>
                        : <span style={{ color: 'var(--subtle)', fontSize: 12 }}>Any</span>}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'capitalize' }}>{payerDisplay}</td>
                    <td>
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
                    <td><StatusBadge label={c.urgency_level} status={c.urgency_level} size="sm" /></td>
                    <td><StatusBadge label={c.status} status={c.status} size="sm" /></td>
                    <td><Link href={`/clients/${c.id}`}><button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}>View →</button></Link></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 12, textAlign: 'center' }}>
        {clients.length} client{clients.length !== 1 ? 's' : ''} shown
      </div>
    </div>
  )
}
