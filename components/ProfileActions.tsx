"use client"
// components/ProfileActions.tsx (v2.7.24)
//
// Lives in the PageHeader actions slot on the provider detail page,
// next to SendToVitaButton (same pattern — the page is a server
// component, so interactivity is its own client component).
//
//   🖨 Print — opens the profile PDF inline in a new tab; the browser's
//              PDF viewer gives a clean print dialog with no layout drift.
//   ⬇ PDF   — same route with ?download=1; Content-Disposition:
//              attachment saves the file instead.
//   📞 Call  — tel: link. On a Mac with the Quo desktop app installed
//              the link hands off to Quo; on mobile it dials natively.
//              Only rendered when the provider has a phone number.

interface Props {
  providerId: string
  phone: string | null
}

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '7px 12px',
  fontSize: 12.5,
  fontWeight: 500,
  color: 'var(--text)',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 7,
  cursor: 'pointer',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}

export default function ProfileActions({ providerId, phone }: Props) {
  const pdfUrl = `/api/providers/${providerId}/profile-pdf`
  const hasPhone = typeof phone === 'string' && phone.trim() !== ''

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {hasPhone && (
        <a href={`tel:${phone!.trim()}`} style={btnStyle} title={`Call ${phone!.trim()}`}>
          📞 Call
        </a>
      )}
      <a href={pdfUrl} target="_blank" rel="noopener" style={btnStyle} title="Open a print-ready PDF in a new tab">
        🖨 Print
      </a>
      <a href={`${pdfUrl}?download=1`} style={btnStyle} title="Download the profile as a PDF">
        ⬇ PDF
      </a>
    </div>
  )
}
