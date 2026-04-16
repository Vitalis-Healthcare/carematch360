"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface FailureRow {
  id: string
  created_at: string
  recipient: string
  subject: string
  error_message: string
  related_provider_id: string | null
  retry_count: number
  last_retry_at: string | null
  kind: string | null
  applicant_name: string | null
  applicant_email: string | null
  credential: string | null
}

export default function EmailFailuresClient({ failures }: { failures: FailureRow[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  async function act(id: string, action: 'retry' | 'resolve') {
    setBusyId(id)
    setRowErrors(prev => {
      const { [id]: _, ...rest } = prev
      return rest
    })
    try {
      const res = await fetch(`/api/admin/email-failures/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (res.ok && data.resolved) {
        // Optimistic fade — then refresh to reflect server state
        setDismissed(prev => new Set(prev).add(id))
        setTimeout(() => router.refresh(), 300)
      } else {
        setRowErrors(prev => ({
          ...prev,
          [id]: data.error || 'Action failed',
        }))
      }
    } catch (err: any) {
      setRowErrors(prev => ({
        ...prev,
        [id]: err?.message || 'Network error',
      }))
    } finally {
      setBusyId(null)
    }
  }

  const visible = failures.filter(f => !dismissed.has(f.id))

  const S: any = {
    wrap: { minHeight:'100vh', background:'#F8FAFC', fontFamily:"'Segoe UI',sans-serif" },
    header: { background:'#fff', borderBottom:'1px solid #E2E8F0', padding:'20px 28px', display:'flex', alignItems:'center', justifyContent:'space-between' },
    title: { fontSize:20, fontWeight:700, color:'#0F172A' },
    subtitle: { fontSize:13, color:'#64748B', marginTop:2 },
    countPill: { padding:'5px 12px', borderRadius:12, fontSize:12, fontWeight:700, background:'#FEF2F2', color:'#DC2626', letterSpacing:'0.01em' },
    countPillEmpty: { padding:'5px 12px', borderRadius:12, fontSize:12, fontWeight:600, background:'#ECFDF5', color:'#065F46' },
    body: { maxWidth:900, margin:'0 auto', padding:'28px 24px' },
    card: { background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:'20px 22px', marginBottom:14, transition:'opacity 0.3s' },
    cardFading: { opacity:0.3 },
    cardTop: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap' as const, gap:8 },
    status: { display:'flex', alignItems:'center', gap:10, fontSize:11.5, color:'#64748B' },
    statusBadge: { padding:'3px 9px', borderRadius:6, fontSize:10.5, fontWeight:700, background:'#FEF2F2', color:'#DC2626', letterSpacing:'0.06em' },
    retryCount: { fontSize:11.5, color:'#94A3B8', fontWeight:500 },
    applicant: { fontSize:15, fontWeight:600, color:'#0F172A', marginBottom:3 },
    applicantMeta: { fontSize:12.5, color:'#64748B', marginBottom:8 },
    providerLink: { fontSize:12.5, color:'#0B3D5C', textDecoration:'none', fontWeight:500 },
    divider: { height:1, background:'#F1F5F9', margin:'12px 0' },
    metaRow: { display:'flex', gap:8, fontSize:12.5, marginBottom:4, lineHeight:1.5 },
    metaLabel: { color:'#94A3B8', minWidth:64, fontWeight:500 },
    metaValue: { color:'#334155', wordBreak:'break-word' as const, flex:1 },
    errorLabel: { fontSize:10.5, fontWeight:700, color:'#DC2626', textTransform:'uppercase' as const, letterSpacing:'0.08em', marginTop:12, marginBottom:6 },
    errorBox: { background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 12px', fontFamily:"'SF Mono',Menlo,Consolas,monospace", fontSize:12, color:'#991B1B', whiteSpace:'pre-wrap' as const, wordBreak:'break-word' as const, lineHeight:1.5 },
    lastRetry: { fontSize:11.5, color:'#94A3B8', marginTop:10 },
    actions: { display:'flex', gap:10, marginTop:14, flexWrap:'wrap' as const },
    btnRetry: (disabled: boolean) => ({ padding:'8px 16px', borderRadius:7, fontSize:12.5, fontWeight:600, background: disabled ? '#94A3B8' : '#0B3D5C', color:'#fff', border:'none', cursor: disabled ? 'not-allowed' : 'pointer' }),
    btnResolve: (disabled: boolean) => ({ padding:'8px 16px', borderRadius:7, fontSize:12.5, fontWeight:600, background:'transparent', color: disabled ? '#CBD5E1' : '#64748B', border: disabled ? '1px solid #E2E8F0' : '1px solid #CBD5E1', cursor: disabled ? 'not-allowed' : 'pointer' }),
    actionError: { marginTop:10, padding:'8px 12px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:7, fontSize:12.5, color:'#991B1B' },
    empty: { background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:'48px 28px', textAlign:'center' as const },
    emptyIcon: { fontSize:40, marginBottom:10 },
    emptyTitle: { fontSize:17, fontWeight:600, color:'#0F172A', marginBottom:6 },
    emptySub: { fontSize:13.5, color:'#64748B', maxWidth:400, margin:'0 auto', lineHeight:1.55 },
    kindBadge: (kind: string | null) => {
      if (kind === 'apply_notification') return { padding:'2px 8px', borderRadius:6, fontSize:10.5, fontWeight:600, background:'#EFF6FF', color:'#1D4ED8', letterSpacing:'0.02em' }
      if (kind === 'applicant_confirmation') return { padding:'2px 8px', borderRadius:6, fontSize:10.5, fontWeight:600, background:'#ECFDF5', color:'#065F46', letterSpacing:'0.02em' }
      return { padding:'2px 8px', borderRadius:6, fontSize:10.5, fontWeight:600, background:'#F1F5F9', color:'#64748B', letterSpacing:'0.02em' }
    },
  }

  function formatTimestamp(iso: string): string {
    try {
      return new Date(iso).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
        timeZone: 'America/New_York', timeZoneName: 'short',
      })
    } catch {
      return iso
    }
  }

  function kindLabel(kind: string | null): string {
    if (kind === 'apply_notification') return 'Coordinator notification'
    if (kind === 'applicant_confirmation') return 'Applicant confirmation'
    return kind || 'Unknown'
  }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div>
          <div style={S.title}>Email failures</div>
          <div style={S.subtitle}>Transactional emails that didn&apos;t send. Retry or mark resolved after manual follow-up.</div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <a href="/dashboard" style={{ padding:'9px 18px', borderRadius:8, fontSize:13, fontWeight:500, color:'#64748B', background:'#F1F5F9', textDecoration:'none' }}>← Dashboard</a>
          {visible.length > 0 ? (
            <div style={S.countPill}>{visible.length} unresolved</div>
          ) : (
            <div style={S.countPillEmpty}>All clear</div>
          )}
        </div>
      </div>

      <div style={S.body}>
        {visible.length === 0 ? (
          <div style={S.empty}>
            <div style={S.emptyIcon}>✓</div>
            <div style={S.emptyTitle}>No unresolved email failures</div>
            <div style={S.emptySub}>Coordinator notifications and applicant confirmations are all delivering.</div>
          </div>
        ) : (
          visible.map(f => {
            const isBusy = busyId === f.id
            const isFading = dismissed.has(f.id)
            const rowErr = rowErrors[f.id]
            return (
              <div key={f.id} style={{ ...S.card, ...(isFading ? S.cardFading : {}) }}>
                <div style={S.cardTop}>
                  <div style={S.status}>
                    <span style={S.statusBadge}>FAILED</span>
                    <span>{formatTimestamp(f.created_at)}</span>
                    <span style={S.kindBadge(f.kind)}>{kindLabel(f.kind)}</span>
                  </div>
                  {f.retry_count > 0 && (
                    <div style={S.retryCount}>Retry #{f.retry_count}</div>
                  )}
                </div>

                {f.applicant_name && (
                  <>
                    <div style={S.applicant}>
                      {f.applicant_name}
                      {f.credential && (
                        <span style={{ fontSize:12.5, fontWeight:500, color:'#64748B', marginLeft:8 }}>({f.credential})</span>
                      )}
                    </div>
                    {f.applicant_email && (
                      <div style={S.applicantMeta}>{f.applicant_email}</div>
                    )}
                    {f.related_provider_id && (
                      <a href={`/providers/${f.related_provider_id}`} style={S.providerLink}>
                        View applicant →
                      </a>
                    )}
                  </>
                )}

                <div style={S.divider}></div>

                <div style={S.metaRow}>
                  <div style={S.metaLabel}>To:</div>
                  <div style={S.metaValue}>{f.recipient}</div>
                </div>
                <div style={S.metaRow}>
                  <div style={S.metaLabel}>Subject:</div>
                  <div style={S.metaValue}>{f.subject}</div>
                </div>

                <div style={S.errorLabel}>Error</div>
                <div style={S.errorBox}>{f.error_message}</div>

                {f.last_retry_at && (
                  <div style={S.lastRetry}>Last retry: {formatTimestamp(f.last_retry_at)}</div>
                )}

                <div style={S.actions}>
                  <button
                    onClick={() => act(f.id, 'retry')}
                    disabled={isBusy}
                    style={S.btnRetry(isBusy)}>
                    {isBusy ? 'Working…' : 'Retry send'}
                  </button>
                  <button
                    onClick={() => act(f.id, 'resolve')}
                    disabled={isBusy}
                    style={S.btnResolve(isBusy)}>
                    Mark resolved
                  </button>
                </div>

                {rowErr && (
                  <div style={S.actionError}>{rowErr}</div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
