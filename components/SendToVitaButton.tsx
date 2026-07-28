"use client"
// components/SendToVitaButton.tsx (v2.7.22)
//
// Lives in the PageHeader actions slot on the provider detail page. That page is
// a server component, so the interactivity has to be its own client component.
//
// Vita's refusals arrive already written for a human — a missing email, a
// one-word name, an application the candidate has already submitted — so they
// are shown verbatim. A gate that refuses without explaining is worse than one
// that does not exist: staff trust it, get stuck, and report it as broken.

import { useState } from 'react'

interface Props {
  providerId: string
  /** Set once this provider has been pushed; drives the re-send wording. */
  vitaCandidateId: string | null
  sentToVitaAt: string | null
}

interface Outcome {
  kind: 'ok' | 'error'
  text: string
  href?: string
}

function formatSentAt(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SendToVitaButton({ providerId, vitaCandidateId, sentToVitaAt }: Props) {
  const [sending, setSending] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [sent, setSent] = useState(!!vitaCandidateId)

  async function send() {
    setOutcome(null)
    setSending(true)
    try {
      const res = await fetch(`/api/providers/${providerId}/send-to-vita`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.ok) {
        setOutcome({ kind: 'error', text: data.error || 'Could not send this provider to Vita.' })
        return
      }

      setSent(true)
      const filled = typeof data.fields_filled === 'number' ? data.fields_filled : 0
      const left = typeof data.fields_left_alone === 'number' ? data.fields_left_alone : 0
      const summary = data.created
        ? `Candidate created in Vita with ${filled} field${filled === 1 ? '' : 's'} pre-filled.`
        : left > 0
          ? `Existing Vita candidate updated. ${filled} blank field${filled === 1 ? '' : 's'} filled, ${left} left as answered.`
          : `Existing Vita candidate updated with ${filled} field${filled === 1 ? '' : 's'}.`

      setOutcome({ kind: 'ok', text: summary, href: data.candidate_url })
    } catch {
      setOutcome({ kind: 'error', text: 'Network error \u2014 please try again.' })
    } finally {
      setSending(false)
    }
  }

  const label = sending ? 'Sending\u2026' : sent ? 'Re-send to Vita' : 'Send to Vita'
  const sentLabel = formatSentAt(sentToVitaAt)

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      <button
        onClick={send}
        disabled={sending}
        title={sent
          ? 'Send this provider to Vita again. Answers the candidate has already given are never overwritten.'
          : 'Create a Vita candidate from this provider, with their application pre-filled.'}
        className={sent ? 'btn-secondary' : 'btn-teal'}
        style={{ cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.6 : 1 }}>
        {label}
      </button>

      {sent && !outcome && sentLabel && (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Sent to Vita on {sentLabel}</span>
      )}

      {outcome && (
        <div style={{
          maxWidth: 340, textAlign: 'right', fontSize: 12.5, lineHeight: 1.55,
          color: outcome.kind === 'ok' ? 'var(--green)' : 'var(--red)',
        }}>
          <span>{outcome.text}</span>
          {outcome.href && (
            <>
              {' '}
              <a href={outcome.href} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--teal)', fontWeight: 500, textDecoration: 'underline' }}>
                Open in Vita
              </a>
            </>
          )}
        </div>
      )}
    </div>
  )
}
