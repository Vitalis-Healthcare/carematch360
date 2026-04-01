"use client"
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  accepted:   { label: 'Accepted',    color: '#065F46', bg: '#ECFDF5', icon: '✓' },
  declined:   { label: 'Declined',    color: '#991B1B', bg: '#FEF2F2', icon: '✗' },
  interested: { label: 'Has questions', color: '#92400E', bg: '#FEF9C3', icon: '💬' },
  notified:   { label: 'Awaiting',    color: '#92400E', bg: '#FFFBEB', icon: '⏳' },
  pending:    { label: 'Not sent',    color: '#64748B', bg: '#F1F5F9', icon: '—' },
  matched:    { label: 'Matched',     color: '#065F46', bg: '#ECFDF5', icon: '✓' },
  assigned:   { label: 'Assigned',    color: '#1D4ED8', bg: '#EFF6FF', icon: '⭐' },
}

interface Props {
  caseId: string
  initialMatches: any[]
  caseStatus: string
  assignedProviderId: string | null
  onAssign: (providerId: string) => void
}

export default function ResponseDashboard({ caseId, initialMatches, caseStatus, assignedProviderId, onAssign }: Props) {
  const [matches, setMatches] = useState<any[]>(initialMatches)
  const [summary, setSummary] = useState({ total: 0, notified: 0, accepted: 0, declined: 0, interested: 0, pending: 0 })
  const [assigning, setAssigning] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [log, setLog] = useState<any[]>([])
  const [showLog, setShowLog] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const [respRes, logRes] = await Promise.all([
        fetch(`/api/cases/${caseId}/responses`),
        fetch(`/api/cases/${caseId}/dispatch-log`),
      ])
      const json = await respRes.json()
      if (respRes.ok) {
        setMatches(json.matches || [])
        setSummary(json.summary || {})
        setLastRefresh(new Date())
      }
      if (logRes.ok) {
        const logJson = await logRes.json()
        setLog(logJson.log || [])
      }
    } catch {}
  }, [caseId])

  // Poll every 15 seconds while there are outstanding notifications
  useEffect(() => {
    refresh()
    const hasOutstanding = matches.some(m => m.status === 'notified')
    if (!hasOutstanding) return
    const interval = setInterval(refresh, 15000)
    return () => clearInterval(interval)
  }, [refresh])

  async function handleAssign(providerId: string) {
    setAssigning(providerId)
    try {
      await onAssign(providerId)
    } finally {
      setAssigning(null)
      refresh()
    }
  }

  const notifiedMatches = matches.filter(m => m.notified_at)
  if (notifiedMatches.length === 0) return null

  return (
    <div className="card fade-in" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--navy)' }}>Response Dashboard</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--subtle)' }}>
            Updated {lastRefresh.toLocaleTimeString()}
          </div>
          <button onClick={() => setShowLog(v => !v)}
            style={{ fontSize: 11, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 9px', cursor: 'pointer' }}>
            {showLog ? '▲ Hide log' : '📋 Delivery log'}
          </button>
          <button onClick={refresh} style={{ fontSize: 11, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {[
          { label: 'Notified',   value: summary.notified,   color: '#0EA5E9' },
          { label: 'Accepted',   value: summary.accepted,   color: '#10B981' },
          { label: 'Questions',  value: summary.interested, color: '#D97706' },
          { label: 'Declined',   value: summary.declined,   color: '#EF4444' },
          { label: 'Awaiting',   value: summary.pending,    color: '#F59E0B' },
        ].map(stat => (
          <div key={stat.label} style={{ flex: 1, padding: '14px 16px', textAlign: 'center', borderRight: '1px solid var(--border)' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color, fontFamily: 'var(--mono)' }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Interested callout */}
      {summary.interested > 0 && (
        <div style={{ padding: '10px 20px', background: '#FEF9C3', borderBottom: '1px solid #FDE68A', fontSize: 13, color: '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>💬</span>
          <strong>{summary.interested} provider{summary.interested !== 1 ? 's' : ''} ha{summary.interested !== 1 ? 've' : 's'} questions.</strong>
          <span>Your coordinator has been emailed — follow up directly to answer and confirm.</span>
        </div>
      )}

      {/* Dispatch delivery log */}
      {showLog && (
        <div style={{ borderBottom: '1px solid var(--border)', background: '#F8FAFC' }}>
          <div style={{ padding: '10px 20px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Delivery Log
          </div>
          {log.length === 0 ? (
            <div style={{ padding: '12px 20px', fontSize: 12, color: 'var(--subtle)' }}>No log entries yet</div>
          ) : log.map((entry: any) => (
            <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 20px', borderTop: '1px solid var(--border)', fontSize: 12 }}>
              <span style={{ fontSize: 14 }}>{entry.channel === 'email' ? '✉️' : '📱'}</span>
              <span style={{ fontWeight: 500, minWidth: 120 }}>{entry.providers?.name ?? '—'}</span>
              <span style={{ color: 'var(--muted)', flex: 1 }}>{entry.channel?.toUpperCase()}</span>
              <span style={{
                fontWeight: 600, padding: '1px 7px', borderRadius: 10, fontSize: 11,
                background: entry.status === 'sent' ? '#ECFDF5' : '#FEF2F2',
                color: entry.status === 'sent' ? '#065F46' : '#DC2626',
              }}>
                {entry.status === 'sent' ? '✓ Sent' : '✗ Failed'}
              </span>
              {entry.external_id && (
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--subtle)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  ID: {entry.external_id}
                </span>
              )}
              {entry.error && (
                <span style={{ fontSize: 11, color: '#DC2626', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {entry.error}
                </span>
              )}
              <span style={{ fontSize: 11, color: 'var(--subtle)', flexShrink: 0 }}>
                {new Date(entry.sent_at).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Match rows */}
      <div>
        {notifiedMatches.map(m => {
          const p = Array.isArray(m.providers) ? m.providers[0] : m.providers
          const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.pending
          const isAccepted = m.status === 'accepted'
          const isAssigned = assignedProviderId === m.provider_id

          return (
            <div key={m.provider_id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              background: isAssigned ? '#EFF6FF' : isAccepted ? '#F0FDF4' : 'var(--surface)',
            }}>
              {/* Status badge */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: cfg.bg, color: cfg.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
              }}>{cfg.icon}</div>

              {/* Provider info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{p?.name}</span>
                  {isAssigned && <span style={{ fontSize: 10, background: '#DBEAFE', color: '#1D4ED8', padding: '1px 7px', borderRadius: 10, fontWeight: 600 }}>ASSIGNED</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {p?.credential_type}
                  {p?.city && ` · ${p.city}`}
                  {m.notified_at && ` · Notified ${new Date(m.notified_at).toLocaleDateString()}`}
                  {m.notified_channels?.length > 0 && ` via ${m.notified_channels.join('/')}`}
                  {m.response_at && ` · Responded ${new Date(m.response_at).toLocaleDateString()}`}
                </div>
              </div>

              {/* Score */}
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', flexShrink: 0 }}>
                {m.match_score > 0 ? `${m.match_score} pts` : ''}
              </div>

              {/* Status pill */}
              <div style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33`, borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                {cfg.label}
              </div>

              {/* Action */}
              {(isAccepted || m.status === 'interested') && !isAssigned && caseStatus !== 'assigned' && (
                <button
                  className="btn-teal"
                  style={{ fontSize: 12, padding: '6px 14px', flexShrink: 0 }}
                  onClick={() => handleAssign(m.provider_id)}
                  disabled={assigning === m.provider_id}>
                  {assigning === m.provider_id ? '...' : '⭐ Assign'}
                </button>
              )}
              {!isAccepted && p?.phone && (
                <a href={`tel:${p.phone}`} style={{ fontSize: 11, color: 'var(--teal)', flexShrink: 0, textDecoration: 'none' }}>
                  📞
                </a>
              )}
              <Link href={`/providers/${m.provider_id}`} style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>→</Link>
            </div>
          )
        })}
      </div>

      {summary.accepted > 0 && caseStatus !== 'assigned' && (
        <div style={{ padding: '12px 20px', background: '#F0FDF4', borderTop: '1px solid #A7F3D0', fontSize: 13, color: '#065F46', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>✓</span>
          <strong>{summary.accepted} provider{summary.accepted !== 1 ? 's' : ''} accepted.</strong>
          <span>Click ⭐ Assign above to confirm.</span>
        </div>
      )}
    </div>
  )
}
