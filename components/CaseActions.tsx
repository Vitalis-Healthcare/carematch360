"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HOLD_REASONS } from '@/lib/constants'

interface Props {
  caseId: string
  status: string
  title: string
}

export default function CaseActions({ caseId, status, title }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showHoldModal, setShowHoldModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [holdReason, setHoldReason] = useState('')
  const [holdNote, setHoldNote] = useState('')
  const [cancelNote, setCancelNote] = useState('')
  const [error, setError] = useState('')

  async function transition(newStatus: string, extra?: object) {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/cases/${caseId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...extra }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Update failed')
      router.refresh()
      setShowHoldModal(false); setShowCompleteModal(false); setShowCancelModal(false)
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  const btnStyle = (color: string, bg: string) => ({
    padding:'8px 16px', fontSize:12.5, fontWeight:600, border:`1px solid ${color}`,
    borderRadius:7, cursor:'pointer', background:bg, color,
    display:'flex', alignItems:'center', gap:5,
  })

  return (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
        {/* Active → Hold */}
        {['open','matching','matched','assigned'].includes(status) && (
          <button style={btnStyle('#D97706','#FEF9C3')} onClick={() => setShowHoldModal(true)}>
            ⏸ Put On Hold
          </button>
        )}
        {/* Any → Complete */}
        {['assigned','on_hold'].includes(status) && (
          <button style={btnStyle('#10B981','#ECFDF5')} onClick={() => setShowCompleteModal(true)}>
            ✓ Mark Completed
          </button>
        )}
        {/* Hold → Reopen */}
        {status === 'on_hold' && (
          <button style={btnStyle('#0EA5E9','#EFF6FF')} onClick={() => transition('open')}>
            ↺ Reopen
          </button>
        )}
        {/* Closed → Reopen */}
        {['completed','cancelled'].includes(status) && (
          <button style={btnStyle('#6B7280','#F9FAFB')} onClick={() => transition('open')}>
            ↺ Reopen Case
          </button>
        )}
        {/* Cancel */}
        {!['completed','cancelled'].includes(status) && (
          <button style={btnStyle('#EF4444','#FEF2F2')} onClick={() => setShowCancelModal(true)}>
            ✕ Cancel Case
          </button>
        )}
      </div>

      {error && <div style={{ fontSize:12, color:'var(--red)', marginTop:8 }}>{error}</div>}

      {/* Hold Modal */}
      {showHoldModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:12, padding:'28px 32px', maxWidth:480, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:6 }}>Put Case On Hold</div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:20 }}>{title}</div>
            <div className="form-group" style={{ marginBottom:14 }}>
              <label className="form-label">Reason *</label>
              <select className="form-select" value={holdReason} onChange={e => setHoldReason(e.target.value)}>
                <option value="">Select a reason</option>
                {HOLD_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom:20 }}>
              <label className="form-label">Note <span style={{ fontWeight:400, color:'var(--muted)' }}>(optional)</span></label>
              <textarea className="form-textarea" value={holdNote} onChange={e => setHoldNote(e.target.value)}
                placeholder="Any additional context..." style={{ minHeight:80 }}/>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowHoldModal(false)}>Cancel</button>
              <button className="btn-primary" disabled={!holdReason || loading}
                onClick={() => transition('on_hold', { hold_reason: holdReason, hold_note: holdNote })}>
                {loading ? 'Saving...' : 'Put On Hold'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:12, padding:'28px 32px', maxWidth:440, width:'100%' }}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:6 }}>Mark Case Completed</div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:20 }}>
              This will file the case as completed and move it to Closed. This action can be reversed.
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowCompleteModal(false)}>Cancel</button>
              <button disabled={loading}
                style={{ padding:'8px 20px', background:'#10B981', color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontWeight:600, fontSize:13 }}
                onClick={() => transition('completed')}>
                {loading ? 'Saving...' : '✓ Complete Case'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:12, padding:'28px 32px', maxWidth:440, width:'100%' }}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:6, color:'var(--red)' }}>Cancel Case</div>
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:16 }}>
              This will cancel the case and move it to Closed. Any active dispatch will stop. This can be reversed.
            </div>
            <div className="form-group" style={{ marginBottom:20 }}>
              <label className="form-label">Reason <span style={{ fontWeight:400, color:'var(--muted)' }}>(optional)</span></label>
              <textarea className="form-textarea" value={cancelNote} onChange={e => setCancelNote(e.target.value)}
                placeholder="Why is this case being cancelled?" style={{ minHeight:70 }}/>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowCancelModal(false)}>Back</button>
              <button disabled={loading}
                style={{ padding:'8px 20px', background:'#EF4444', color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontWeight:600, fontSize:13 }}
                onClick={() => transition('cancelled', { hold_note: cancelNote })}>
                {loading ? 'Saving...' : '✕ Cancel Case'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
