"use client"
import { useState, useCallback } from 'react'
import Link from 'next/link'
import StatusBadge from './StatusBadge'

const CRED_COLORS: Record<string,string> = {
  RN:'#0EA5E9', LPN:'#8B5CF6', CNA:'#10B981', GNA:'#14B8A6',
  CMT:'#F59E0B', PT:'#EF4444', OT:'#EC4899', ST:'#6366F1', UA:'#84CC16',
}

// ── Post-import activation panel ────────────────────────────────
function ImportResultPanel({ importResult, tab, onDismiss }: { importResult: any; tab: string; onDismiss: () => void }) {
  const newProviders: { id: string; name: string; credential_type: string }[] = importResult.newProviders ?? []
  const [activated, setActivated] = useState<Set<string>>(new Set())
  const [activating, setActivating] = useState<Set<string>>(new Set())
  const [activatingAll, setActivatingAll] = useState(false)
  const [error, setError] = useState('')

  async function activateOne(id: string) {
    setActivating(prev => new Set(prev).add(id))
    const res = await fetch('/api/providers/activate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
    if (res.ok) setActivated(prev => new Set(prev).add(id))
    else setError('Failed to activate')
    setActivating(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  async function activateAll() {
    const pending = newProviders.filter(p => !activated.has(p.id)).map(p => p.id)
    if (!pending.length) return
    setActivatingAll(true)
    const res = await fetch('/api/providers/activate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: pending }),
    })
    if (res.ok) setActivated(new Set(newProviders.map(p => p.id)))
    else setError('Failed to activate all')
    setActivatingAll(false)
  }

  const pendingCount = newProviders.filter(p => !activated.has(p.id)).length
  const allDone = newProviders.length > 0 && pendingCount === 0

  return (
    <div style={{ border: '1px solid #A7F3D0', borderRadius: 12, overflow: 'hidden', marginBottom: 20, fontSize: 13 }}>
      {/* Header */}
      <div style={{ background: '#ECFDF5', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, color: '#065F46', fontSize: 14, marginBottom: 2 }}>✓ Import Complete</div>
          <div style={{ display: 'flex', gap: 18, color: '#047857', fontSize: 12.5 }}>
            <span>✓ <strong>{importResult.imported}</strong> imported</span>
            <span>↻ <strong>{importResult.updated}</strong> updated</span>
            <span>— <strong>{importResult.skipped}</strong> skipped</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href={tab === 'caregivers' ? '/providers' : '/clients'}>
            <button style={{ fontSize: 12, padding: '6px 14px', background: '#fff', border: '1px solid #A7F3D0', borderRadius: 7, cursor: 'pointer', color: '#065F46', fontWeight: 500 }}>
              View all →
            </button>
          </Link>
          <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6EE7B7', lineHeight: 1 }}>×</button>
        </div>
      </div>

      {importResult.errors?.length > 0 && (
        <div style={{ padding: '10px 18px', background: '#FEF2F2', borderTop: '1px solid #FECACA', fontSize: 12, color: '#DC2626' }}>
          ⚠ Errors: {importResult.errors.slice(0,3).join(' · ')}
          {importResult.errors.length > 3 && ` +${importResult.errors.length - 3} more`}
        </div>
      )}

      {/* Activation section — only for caregivers */}
      {tab === 'caregivers' && newProviders.length > 0 && (
        <div style={{ background: '#fff', borderTop: '1px solid #D1FAE5' }}>
          {/* Activation header */}
          <div style={{ padding: '14px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F0FDF4' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#0B2D45', fontSize: 13.5 }}>
                {allDone
                  ? `✅ All ${newProviders.length} providers activated!`
                  : `⚡ Activate ${pendingCount} new provider${pendingCount !== 1 ? 's' : ''}`}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                {allDone
                  ? 'They are now active and available for case matching.'
                  : 'Imported providers are inactive by default. Activate to include them in matching.'}
              </div>
            </div>
            {!allDone && (
              <button onClick={activateAll} disabled={activatingAll}
                style={{ padding: '8px 20px', background: activatingAll ? '#94A3B8' : 'linear-gradient(135deg,#0B3D5C,#0E9FA3)', color: '#fff', border: 'none', borderRadius: 8, cursor: activatingAll ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {activatingAll ? 'Activating…' : `⚡ Activate All ${pendingCount}`}
              </button>
            )}
          </div>

          {/* Provider rows */}
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {newProviders.map(p => {
              const isDone = activated.has(p.id)
              const isActivating = activating.has(p.id)
              const color = CRED_COLORS[p.credential_type] ?? '#64748B'
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: '1px solid #F8FAFC', background: isDone ? '#F0FDF4' : '#fff' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: isDone ? '#10B981' : color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {isDone ? '✓' : p.credential_type?.slice(0,3)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: isDone ? '#065F46' : '#0F172A' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                      <span style={{ fontWeight: 700, color }}>{p.credential_type}</span>
                      {isDone && <span style={{ color: '#10B981', marginLeft: 8 }}>● Active</span>}
                      {!isDone && <span style={{ color: '#F59E0B', marginLeft: 8 }}>● Inactive</span>}
                    </div>
                  </div>
                  {!isDone && (
                    <button onClick={() => activateOne(p.id)} disabled={isActivating}
                      style={{ padding: '6px 16px', background: isActivating ? '#94A3B8' : '#F0FDF4', color: isActivating ? '#fff' : '#065F46', border: '1.5px solid #A7F3D0', borderRadius: 7, cursor: isActivating ? 'not-allowed' : 'pointer', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {isActivating ? '…' : 'Activate'}
                    </button>
                  )}
                  {isDone && (
                    <Link href={`/providers/${p.id}`}>
                      <span style={{ fontSize: 12, color: '#0EA5E9', fontWeight: 600 }}>View →</span>
                    </Link>
                  )}
                </div>
              )
            })}
          </div>

          {error && <div style={{ padding: '8px 18px', color: '#DC2626', fontSize: 12, background: '#FEF2F2' }}>{error}</div>}
        </div>
      )}
    </div>
  )
}

const CREDENTIAL_TYPES = ['UA','CNA','GNA','CMT','LPN','RN','PT','OT','ST']

const CLASS_TO_CREDENTIAL: Record<string,string> = {
  'RN':'RN','REGISTERED NURSE':'RN',
  'LPN':'LPN','LICENSED PRACTICAL NURSE':'LPN','LVN':'LPN',
  'CNA':'CNA','CERTIFIED NURSING ASSISTANT':'CNA',
  'GNA':'GNA','GERIATRIC NURSING ASSISTANT':'GNA',
  'CMT':'CMT','CERTIFIED MEDICATION TECHNICIAN':'CMT','MED TECH':'CMT',
  'UA':'UA','UNLICENSED AIDE':'UA','UNLICENSED':'UA',
  'HHA':'UA','HOME HEALTH AIDE':'UA','PCA':'UA','PERSONAL CARE AIDE':'UA','COMPANION':'UA','HCA':'UA',
  'PT':'PT','PHYSICAL THERAPIST':'PT','PHYSICAL THERAPY':'PT',
  'OT':'OT','OCCUPATIONAL THERAPIST':'OT','OCCUPATIONAL THERAPY':'OT',
  'ST':'ST','SPEECH THERAPIST':'ST','SPEECH THERAPY':'ST','SLP':'ST',
}

function autoMapCredential(classes: any[]): string {
  if (classes?.length) {
    for (const cls of classes) {
      const key = (cls.code || cls.label || '').toUpperCase().trim()
      const mapped = CLASS_TO_CREDENTIAL[key]
      if (mapped) return mapped
    }
  }
  return 'CNA'  // default for unknown/blank
}

interface Props { siteFromEnv: string; hasToken: boolean }

export default function AxisCareImport({ siteFromEnv, hasToken }: Props) {
  const [tab, setTab] = useState<'caregivers'|'clients'>('caregivers')
  const [site, setSite] = useState(siteFromEnv)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [records, setRecords] = useState<any[]>([])
  const [nextPage, setNextPage] = useState<string|null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [credOverrides, setCredOverrides] = useState<Record<number,string>>({})
  const [importResult, setImportResult] = useState<any>(null)
  const [totalFetched, setTotalFetched] = useState(0)
  const [existingDbIds, setExistingDbIds] = useState<Set<number>>(new Set())

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }
  const selectAll = () => setSelected(new Set(records.filter(r => !existingDbIds.has(Number(r.id))).map(r => r.id)))
  const selectNone = () => setSelected(new Set())

  const fetchRecords = useCallback(async (startAfterId?: number) => {
    setLoading(true); setError(''); setImportResult(null)
    try {
      // Fetch existing axiscare_ids from our DB (only on first load)
      let existingIds: Set<number> = new Set()
      if (!startAfterId) {
        const existingRes = await fetch('/api/axiscare/existing')
        if (existingRes.ok) {
          const existingData = await existingRes.json()
          const ids = tab === 'caregivers' ? existingData.provider_ids : existingData.client_ids
          existingIds = new Set((ids || []).map((id: string) => Number(id)))
          setExistingDbIds(existingIds)
        }
      }

      const params = new URLSearchParams({
        site: site.trim(),
        ...(token && { token: token.trim() }),
        limit: '200',
        statuses: 'Active',
        ...(startAfterId ? { startAfterId: String(startAfterId) } : {}),
      })
      const res = await fetch(`/api/axiscare/${tab}?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Fetch failed')

      const list = tab === 'caregivers'
        ? (json.results?.caregivers || [])
        : (json.results?.clients || [])

      if (startAfterId) {
        setRecords(prev => [...prev, ...list])
        setTotalFetched(prev => prev + list.length)
      } else {
        setRecords(list)
        setTotalFetched(list.length)
        // Auto-select only NEW records (not already in DB)
        const isNew = (r: any) => !existingIds.has(Number(r.id))
        if (tab === 'caregivers') {
          setSelected(new Set(list.filter((r:any) => isNew(r) && autoMapCredential(r.classes)).map((r:any) => r.id)))
        } else {
          setSelected(new Set(list.filter(isNew).map((r:any) => r.id)))
        }
      }
      setNextPage(json.results?.nextPage || null)
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }, [site, token, tab])

  async function handleImport() {
    const toImport = records.filter(r => selected.has(r.id))
    if (toImport.length === 0) { setError('Select at least one record to import'); return }

    // All caregivers default to CNA if not explicitly mapped — no blocking validation needed

    setImporting(true); setError('')
    try {
      const res = await fetch('/api/axiscare/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: tab, records: toImport, credentialOverrides: credOverrides }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Import failed')
      setImportResult(json)
      setSelected(new Set())
    } catch (err: any) { setError(err.message) } finally { setImporting(false) }
  }

  const unmappedCount = 0  // All caregivers now default to CNA if no explicit credential found

  return (
    <div>
      {/* Connection panel */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--navy)' }}>
          AxisCare Connection
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto', gap: 12, alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label">Site Number</label>
            <input className="form-input" value={site} onChange={e => setSite(e.target.value)}
              placeholder="e.g. 12345" />
            <span className="form-hint">From your AxisCare URL</span>
          </div>
          <div className="form-group">
            <label className="form-label">
              API Token
              {hasToken && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--green)', fontWeight: 400 }}>✓ Env variable set — leave blank to use it</span>}
            </label>
            <input className="form-input" type="password" value={token}
              onChange={e => setToken(e.target.value)}
              placeholder={hasToken ? '(using AXISCARE_API_TOKEN from env)' : 'Paste your Bearer token'} />
          </div>
          <div>
            <button className="btn-primary" onClick={() => fetchRecords()} disabled={loading || (!site && !siteFromEnv)}>
              {loading ? 'Loading...' : `Fetch ${tab === 'caregivers' ? 'Caregivers' : 'Clients'}`}
            </button>
          </div>
        </div>

        {!hasToken && (
          <div style={{ marginTop: 12, background: 'var(--amber-bg)', border: '1px solid #FDE68A', borderRadius: 7, padding: '10px 14px', fontSize: 12.5, color: '#92400E' }}>
            <strong>For production:</strong> add <code>AXISCARE_API_TOKEN</code> and <code>AXISCARE_SITE_NUMBER</code> to your Vercel environment variables so you don't have to paste the token each time.
          </div>
        )}
      </div>

      {/* Tab selector */}
      <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 20, width: 320 }}>
        {(['caregivers','clients'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setRecords([]); setSelected(new Set()); setImportResult(null) }}
            style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
              background: tab === t ? 'var(--navy)' : 'var(--surface)', color: tab === t ? '#fff' : 'var(--muted)' }}>
            {t === 'caregivers' ? '♥ Caregivers' : '⊙ Clients'}
          </button>
        ))}
      </div>

      {/* Import result + activation panel */}
      {importResult && (
        <ImportResultPanel
          importResult={importResult}
          tab={tab}
          onDismiss={() => setImportResult(null)}
        />
      )}

      {error && (
        <div style={{ background: 'var(--red-bg)', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {/* Records table */}
      {records.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {totalFetched} {tab} from AxisCare
              </span>
              <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>
                ✓ {existingDbIds.size} already imported
              </span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                {selected.size} new selected
              </span>
              {unmappedCount > 0 && (
                <span style={{ fontSize: 12, background: 'var(--amber-bg)', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 12, padding: '2px 9px' }}>
                  ⚠ {unmappedCount} need credential
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={selectAll}>Select all</button>
              <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={selectNone}>None</button>
              {nextPage && (
                <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => {
                  const lastId = records[records.length - 1]?.id
                  fetchRecords(lastId)
                }} disabled={loading}>
                  {loading ? 'Loading...' : `Load more`}
                </button>
              )}
              <button className="btn-teal" style={{ fontSize: 13, padding: '7px 18px' }}
                onClick={handleImport} disabled={importing || selected.size === 0}>
                {importing ? 'Importing...' : `Import ${selected.size} selected`}
              </button>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Name</th>
                <th>AxisCare ID</th>
                {tab === 'caregivers' && <th>Classes / Credential</th>}
                {tab === 'clients' && <th>Status</th>}
                <th>Location</th>
                <th>Phone</th>
                {tab === 'clients' && <th>Payer</th>}
              </tr>
            </thead>
            <tbody>
              {records.map(r => {
                const isSelected = selected.has(r.id)
                const alreadyImported = existingDbIds.has(Number(r.id))
                const autoMapped = tab === 'caregivers' ? autoMapCredential(r.classes) : null
                const overrideVal = credOverrides[r.id] || ''
                const finalCred = overrideVal || autoMapped
                const needsCred = false  // CNA is always the default
                const addr = r.residentialAddress || r.mailingAddress || {}
                const city = addr.city || ''
                const state = addr.state || addr.region || ''
                const phone = r.mobilePhone || r.homePhone || r.otherPhone || '—'

                return (
                  <tr key={r.id} style={{ opacity: alreadyImported ? 0.45 : isSelected ? 1 : 0.5, background: alreadyImported ? '#F8FAFC' : undefined }}>
                    <td>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(r.id)} disabled={alreadyImported} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.firstName} {r.lastName}</div>
                      {r.goesBy && <div style={{ fontSize: 11, color: 'var(--muted)' }}>"{r.goesBy}"</div>}
                      {alreadyImported && <div style={{ fontSize: 10, color: '#10B981', fontWeight: 600, marginTop: 2 }}>✓ Already imported</div>}
                    </td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>#{r.id}</td>
                    {tab === 'caregivers' && (
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {/* Show AxisCare classes */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {(r.classes || []).map((cls: any, i: number) => (
                              <span key={i} style={{ fontSize: 10, padding: '1px 6px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--muted)' }}>
                                {cls.code || cls.label}
                              </span>
                            ))}
                            {(!r.classes || r.classes.length === 0) && (
                              <span style={{ fontSize: 11, color: 'var(--subtle)' }}>No classes</span>
                            )}
                          </div>
                          {/* Credential mapping */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {!overrideVal ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 11, background: autoMapped === 'CNA' ? '#F1F5F9' : 'var(--teal-light)', color: autoMapped === 'CNA' ? '#475569' : 'var(--navy)', border: `1px solid ${autoMapped === 'CNA' ? 'var(--border)' : '#BAE6FD'}`, padding: '1px 8px', borderRadius: 4, fontWeight: 700 }}>
                                  → {autoMapped}
                                  {autoMapped === 'CNA' && !(r.classes?.length) && <span style={{ fontWeight: 400, color: 'var(--subtle)', marginLeft: 4 }}>(default)</span>}
                                </span>
                              </div>
                            ) : (
                              <select
                                style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface)' }}
                                value={overrideVal}
                                onChange={e => setCredOverrides(prev => ({ ...prev, [r.id]: e.target.value }))}>
                                <option value="">Override: {autoMapped}</option>
                                {CREDENTIAL_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            )}
                            {(autoMapped || overrideVal) && (
                              <button onClick={() => setCredOverrides(prev => { const n = {...prev}; delete n[r.id]; return n })}
                                style={{ fontSize: 10, color: 'var(--subtle)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                ✎
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    )}
                    {tab === 'clients' && (
                      <td>
                        <StatusBadge label={r.status?.active ? 'Active' : 'Inactive'} status={r.status?.active ? 'active' : 'inactive'} size="sm" />
                      </td>
                    )}
                    <td style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                      {[city, state].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--muted)' }}>{phone}</td>
                    {tab === 'clients' && (
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {r.medicaidNumber ? 'Medicaid' : '—'}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {records.length === 0 && !loading && !error && (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>
            {tab === 'caregivers' ? '♥' : '⊙'}
          </div>
          <div style={{ fontWeight: 500, marginBottom: 6, fontSize: 15 }}>
            Ready to pull from AxisCare
          </div>
          <div style={{ fontSize: 13, maxWidth: 400, margin: '0 auto' }}>
            Enter your site number and API token above, then click Fetch. Active {tab} will appear here for review before import.
          </div>
        </div>
      )}
    </div>
  )
}
