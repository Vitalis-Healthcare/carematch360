"use client"
import { useState } from 'react'

interface Match {
  provider_id: string
  match_score: number
  notified_at: string | null
  status: string
  providers: any
}

interface Props {
  caseId: string
  matches: Match[]
  onDispatched: () => void
  caseStatus?: string
  allowPreDispatch?: boolean
}

const CHANNELS = [
  { key: 'email', label: 'Email', icon: '✉️', desc: 'Full case details + YES/NO buttons' },
  { key: 'sms',   label: 'SMS',   icon: '📱', desc: 'Short message + response link' },
]

// Confirm before dispatching to more than this many providers at once.
const CONFIRM_THRESHOLD = 5

export default function DispatchPanel({ caseId, matches, onDispatched, caseStatus, allowPreDispatch: initialAllow }: Props) {
  // IMPORTANT: default selection is EMPTY. The previous default of "all
  // un-notified providers" caused accidental mass dispatches when
  // operators clicked rows thinking they were *adding* providers when
  // they were actually *removing* them from the all-checked state.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [channels, setChannels] = useState<Set<string>>(new Set(['email']))
  const [dispatching, setDispatching] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)

  // Lead-gate state — silent dispatch by default for cases imported from
  // Vita (status='lead'). Coordinator can flip the per-case toggle to
  // enable dispatch on high-confidence leads.
  const [allowPreDispatch, setAllowPreDispatch] = useState<boolean>(initialAllow ?? false)
  const [togglingPreDispatch, setTogglingPreDispatch] = useState(false)
  const isLead = caseStatus === 'lead'
  const dispatchLocked = isLead && !allowPreDispatch

  async function togglePreDispatch() {
    const next = !allowPreDispatch
    if (next) {
      const ok = window.confirm(
        'Enable pre-dispatch on this lead?\n\n' +
        'This will let you notify providers about a case that hasn\'t closed yet in Vita. ' +
        'Use only for high-confidence leads — dispatched providers may be disappointed if the deal falls through.\n\n' +
        'Continue?'
      )
      if (!ok) return
    }
    setTogglingPreDispatch(true)
    try {
      const res = await fetch(`/api/cases/${caseId}/pre-dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allow: next }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error || 'Failed to update pre-dispatch flag')
        return
      }
      setAllowPreDispatch(next)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setTogglingPreDispatch(false)
    }
  }

  const toggleProvider = (id: string) => setSelectedIds(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s
  })
  const toggleChannel = (c: string) => setChannels(prev => {
    const s = new Set(prev); s.has(c) ? s.delete(c) : s.add(c); return s
  })

  const unnotified = matches.filter(m => !m.notified_at)
  const notified   = matches.filter(m => m.notified_at)

  // Quick-select helpers — operate on the un-notified pool, sorted by score.
  // (matches arrive pre-sorted by match_score desc from the API.)
  const selectTopN = (n: number) => {
    setSelectedIds(new Set(unnotified.slice(0, n).map(m => m.provider_id)))
  }
  const selectAll = () => setSelectedIds(new Set(unnotified.map(m => m.provider_id)))
  const clearAll = () => setSelectedIds(new Set())

  async function handleDispatch() {
    if (dispatchLocked) {
      setError('Dispatch is locked on lead-status cases. Enable pre-dispatch above to override.')
      return
    }
    if (!selectedIds.size)  { setError('Select at least one provider'); return }
    if (!channels.size)     { setError('Select at least one channel'); return }

    // Confirmation gate — anything beyond a small batch needs explicit
    // acknowledgement of the count and channels.
    if (selectedIds.size > CONFIRM_THRESHOLD) {
      const channelList = [...channels].map(c => c.toUpperCase()).join(' + ')
      const msg = `You are about to send ${selectedIds.size} ${channelList} notification${selectedIds.size === 1 ? '' : 's'} to ${selectedIds.size} provider${selectedIds.size === 1 ? '' : 's'}.\n\nThis cannot be undone. Continue?`
      if (!window.confirm(msg)) return
    }

    setDispatching(true); setError('')
    try {
      const res = await fetch(`/api/cases/${caseId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerIds: [...selectedIds],
          channels: [...channels],
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Dispatch failed')
      setResult(json)
      setSelectedIds(new Set()) // clear after successful send
      onDispatched()
    } catch (err: any) { setError(err.message) } finally { setDispatching(false) }
  }

  // Style helper for the quick-select buttons.
  const quickBtn = (active = false): React.CSSProperties => ({
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: 6,
    border: `1px solid ${active ? 'var(--teal)' : 'var(--border)'}`,
    background: active ? 'var(--teal-light)' : 'var(--surface)',
    color: active ? 'var(--navy)' : 'var(--text)',
    cursor: 'pointer',
    transition: 'all 0.1s',
  })

  // Color the count display based on how many are selected.
  const countColor =
    selectedIds.size === 0 ? 'var(--muted)' :
    selectedIds.size > 10  ? 'var(--amber)' :
    'var(--teal)'

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--navy)' }}>Dispatch to Providers</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            Notify matched providers — they respond via email or SMS, no login needed
          </div>
        </div>
        {notified.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--teal-light)', border: '1px solid #BAE6FD', borderRadius: 6, padding: '4px 10px' }}>
            {notified.length} already notified
          </div>
        )}
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* Lead-gate banner — shown when this case is a draft from Vita */}
        {isLead && (
          <div style={{
            border: `1px solid ${dispatchLocked ? '#E9D5FF' : '#FED7AA'}`,
            background: dispatchLocked ? '#FAF5FF' : '#FFF7ED',
            borderRadius: 10,
            padding: '14px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>{dispatchLocked ? '🔒' : '🔓'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: dispatchLocked ? '#6B21A8' : '#9A3412' }}>
                {dispatchLocked ? 'Dispatch is locked' : 'Pre-dispatch enabled'}
              </div>
              <div style={{ fontSize: 12, color: dispatchLocked ? '#7E22CE' : '#C2410C', marginTop: 4, lineHeight: 1.5 }}>
                {dispatchLocked
                  ? <>This case is a lead from Vita. You can run matching to identify candidate providers, but you can't notify them until the lead is closed (won) in Vita — or you enable pre-dispatch below.</>
                  : <>Notifications will be sent to providers even though this lead hasn't closed in Vita. Use sparingly — providers may be disappointed if the deal falls through.</>
                }
              </div>
              <button
                type="button"
                onClick={togglePreDispatch}
                disabled={togglingPreDispatch}
                style={{
                  marginTop: 10,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  border: `1.5px solid ${dispatchLocked ? '#A855F7' : '#EA580C'}`,
                  background: '#fff',
                  color: dispatchLocked ? '#A855F7' : '#EA580C',
                  borderRadius: 7,
                  cursor: togglingPreDispatch ? 'wait' : 'pointer',
                  opacity: togglingPreDispatch ? 0.6 : 1,
                }}
              >
                {togglingPreDispatch
                  ? '…'
                  : dispatchLocked
                    ? '🔓 Enable pre-dispatch on this case'
                    : '🔒 Disable pre-dispatch (return to silent mode)'}
              </button>
            </div>
          </div>
        )}

        {/* Success banner with per-provider breakdown */}
        {result && (
          <div style={{ border: '1px solid #A7F3D0', borderRadius: 8, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ background: 'var(--green-bg)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontWeight: 600, color: '#065F46', fontSize: 13 }}>✓ Dispatch complete</span>
              <span style={{ fontSize: 12, color: '#065F46' }}>
                {result.sent} sent
                {result.failed > 0 && <span style={{ color: '#DC2626', fontWeight: 600 }}> · {result.failed} failed</span>}
              </span>
            </div>
            {(result.results || []).map((r: any) => (
              <div key={r.providerId} style={{ borderTop: '1px solid #D1FAE5', padding: '8px 14px', background: '#fff' }}>
                <div style={{ fontWeight: 500, fontSize: 12, marginBottom: 4 }}>{r.providerName}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(r.channels || []).map((ch: any) => (
                    <span key={ch.channel} style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 500,
                      background: ch.status === 'sent' ? '#ECFDF5' : '#FEF2F2',
                      color: ch.status === 'sent' ? '#065F46' : '#DC2626',
                      border: `1px solid ${ch.status === 'sent' ? '#A7F3D0' : '#FECACA'}`,
                    }}>
                      {ch.channel === 'email' ? '✉️' : '📱'} {ch.channel.toUpperCase()}
                      {' '}{ch.status === 'sent' ? '✓ sent' : `✗ failed${ch.error ? ': ' + ch.error : ''}`}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {error && (
          <div style={{ background: 'var(--red-bg)', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--red)' }}>
            {error}
          </div>
        )}

        {/* Channel selector */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Notification Channels
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {CHANNELS.map(ch => {
              const on = channels.has(ch.key)
              return (
                <button key={ch.key} type="button" onClick={() => toggleChannel(ch.key)}
                  style={{
                    flex: 1, padding: '12px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${on ? 'var(--teal)' : 'var(--border)'}`,
                    background: on ? 'var(--teal-light)' : 'var(--surface)',
                    transition: 'all 0.12s',
                  }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{ch.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: on ? 'var(--navy)' : 'var(--text)' }}>{ch.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{ch.desc}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Provider list */}
        {unnotified.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {/* Quick-select toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 12, padding: '12px 14px', borderRadius: 8,
              background: 'var(--bg)', border: '1px solid var(--border)',
              flexWrap: 'wrap', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{
                  fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)',
                  color: countColor, lineHeight: 1,
                }}>
                  {selectedIds.size}
                </span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                  of {unnotified.length} selected
                </span>
                {selectedIds.size > 10 && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: 'var(--amber)',
                    background: '#FEF3C7', border: '1px solid #FDE68A',
                    borderRadius: 10, padding: '2px 8px', marginLeft: 4,
                  }}>
                    ⚠ large batch
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => selectTopN(5)}
                  style={quickBtn()} disabled={unnotified.length === 0}>Top 5</button>
                <button type="button" onClick={() => selectTopN(10)}
                  style={quickBtn()} disabled={unnotified.length === 0}>Top 10</button>
                <button type="button" onClick={selectAll}
                  style={quickBtn()} disabled={unnotified.length === 0}>All</button>
                <button type="button" onClick={clearAll}
                  style={quickBtn()} disabled={selectedIds.size === 0}>Clear</button>
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Available Providers
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {unnotified.map((m, i) => {
                const p = m.providers
                const on = selectedIds.has(m.provider_id)
                const hasEmail = !!p?.email
                const hasPhone = !!p?.phone
                return (
                  <div key={m.provider_id} onClick={() => toggleProvider(m.provider_id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      borderRadius: 8, cursor: 'pointer',
                      border: `1.5px solid ${on ? 'var(--teal)' : 'var(--border)'}`,
                      background: on ? 'var(--teal-light)' : 'var(--surface)',
                      transition: 'all 0.1s',
                    }}>
                    <input type="checkbox" checked={on} onChange={() => {}} style={{ flexShrink: 0 }} />
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{p?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {p?.credential_type} · Score {m.match_score}
                        {p?.city && ` · ${p.city}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {hasEmail && <span style={{ fontSize: 10, padding: '1px 6px', background: '#ECFDF5', color: '#065F46', borderRadius: 4 }}>✉</span>}
                      {hasPhone && <span style={{ fontSize: 10, padding: '1px 6px', background: '#EFF6FF', color: '#1D4ED8', borderRadius: 4 }}>📱</span>}
                      {!hasEmail && channels.has('email') && <span style={{ fontSize: 10, color: 'var(--red)', padding: '1px 6px' }}>no email</span>}
                      {!hasPhone && channels.has('sms') && <span style={{ fontSize: 10, color: 'var(--amber)', padding: '1px 6px' }}>no phone</span>}
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: 'var(--teal)', flexShrink: 0 }}>{m.match_score}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {unnotified.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)', fontSize: 13 }}>
            All matched providers have been notified.
          </div>
        )}

        {/* Dispatch button */}
        <button type="button" onClick={handleDispatch}
          disabled={dispatching || !selectedIds.size || !channels.size || dispatchLocked}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14, marginTop: 4, opacity: dispatchLocked ? 0.5 : 1 }}>
          {dispatching
            ? 'Sending...'
            : dispatchLocked
              ? '🔒 Dispatch locked — case is in lead status'
              : selectedIds.size === 0
                ? 'Select providers above to dispatch'
                : `Send to ${selectedIds.size} Provider${selectedIds.size !== 1 ? 's' : ''} via ${[...channels].join(' + ').toUpperCase()}`}
        </button>
      </div>
    </div>
  )
}
