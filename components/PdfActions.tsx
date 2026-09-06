"use client"
// components/PdfActions.tsx (v2.7.28)
//
// Generic Print / PDF / Call actions for any PageHeader. Same behavior
// as the provider-specific ProfileActions (v2.7.24), which stays
// untouched — this generic version serves the client detail and case
// detail pages (and any future PDF-bearing surface).
//
//   🖨 Print — opens the PDF inline in a new tab (browser print dialog)
//   ⬇ PDF   — same route with ?download=1 (attachment)
//   📞 Call  — tel: link, rendered only when a phone number is given

interface Props {
  pdfUrl: string
  phone?: string | null
  callTitle?: string
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

export default function PdfActions({ pdfUrl, phone, callTitle }: Props) {
  const hasPhone = typeof phone === 'string' && phone.trim() !== ''
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {hasPhone && (
        <a href={`tel:${phone!.trim()}`} style={btnStyle} title={callTitle ?? `Call ${phone!.trim()}`}>
          📞 Call
        </a>
      )}
      <a href={pdfUrl} target="_blank" rel="noopener" style={btnStyle} title="Open a print-ready PDF in a new tab">
        🖨 Print
      </a>
      <a href={`${pdfUrl}?download=1`} style={btnStyle} title="Download as a PDF">
        ⬇ PDF
      </a>
    </div>
  )
}
