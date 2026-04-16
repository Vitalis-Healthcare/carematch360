import {
  type ApplicantData,
  CAPABILITY_LABELS,
  groupSkills,
  prettifyGender,
  prettifyShift,
} from './types'

/**
 * Renders a Vitalis-branded HTML email body for the coordinator
 * notification on a new provider application.
 *
 * Design constraints:
 * - Table-based layout (no flexbox/grid — email clients strip these)
 * - Inline styles only (no <style> rules — Gmail strips them)
 * - 600px max width (industry standard for email)
 * - Serif + sans pairing via web-safe fallbacks (Georgia for serif,
 *   Helvetica Neue/Arial for sans). Apply form uses Cormorant Garamond
 *   and DM Sans from Google Fonts; email clients drop those silently
 *   and fall back, which is fine — the pairing still reads deliberate.
 */

// Brand palette — locked tokens from apply form (/app/apply/route.ts <style>)
const C = {
  greenDark:   '#2D5A1B',
  greenMid:    '#4A7C2F',
  greenBright: '#7AB52A',
  greenLime:   '#9DCF3A',
  greenLight:  '#EBF5DF',
  greenPale:   '#F4FAF0',
  text:        '#1A2E10',
  muted:       '#5A7050',
  border:      '#C8DDB8',
  white:       '#FFFFFF',
  cream:       '#FDFCF7',
}

const FONT_SERIF = `'Cormorant Garamond', 'Georgia', 'Times New Roman', serif`
const FONT_SANS  = `'DM Sans', 'Helvetica Neue', Arial, sans-serif`

const esc = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const fmtDate = (d: Date): string => {
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
    timeZone: 'America/New_York', timeZoneName: 'short',
  })
}

// ──────────────────────────────────────────────────────────────
// Reusable fragments
// ──────────────────────────────────────────────────────────────

function sectionHeader(label: string): string {
  return `
    <tr>
      <td style="padding:28px 32px 8px 32px;">
        <div style="font-family:${FONT_SANS};font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${C.greenDark};padding-bottom:10px;border-bottom:1px solid ${C.border};">
          ${esc(label)}
        </div>
      </td>
    </tr>`
}

function row(label: string, value: string | null | undefined, opts: { mono?: boolean } = {}): string {
  const displayValue = value && String(value).trim() ? esc(value) : '<span style="color:' + C.muted + '">—</span>'
  const valueStyle = opts.mono
    ? `font-family:'SF Mono', Menlo, Consolas, monospace;font-size:13px;`
    : `font-family:${FONT_SANS};font-size:14px;`
  return `
    <tr>
      <td style="padding:10px 32px;font-family:${FONT_SANS};">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="width:140px;color:${C.muted};font-size:12.5px;font-weight:500;letter-spacing:0.02em;vertical-align:top;padding-top:2px;">${esc(label)}</td>
            <td style="${valueStyle}color:${C.text};font-weight:500;vertical-align:top;">${displayValue}</td>
          </tr>
        </table>
      </td>
    </tr>`
}

function chips(values: string[]): string {
  if (!values || values.length === 0) {
    return '<span style="color:' + C.muted + '">—</span>'
  }
  return values
    .map(
      v => `<span style="display:inline-block;background:${C.greenLight};color:${C.greenDark};border:1px solid ${C.border};border-radius:14px;padding:4px 11px;margin:2px 4px 2px 0;font-family:${FONT_SANS};font-size:12px;font-weight:500;line-height:1.4;">${esc(v)}</span>`
    )
    .join('')
}

function chipRow(label: string, values: string[]): string {
  return `
    <tr>
      <td style="padding:10px 32px;font-family:${FONT_SANS};">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="width:140px;color:${C.muted};font-size:12.5px;font-weight:500;letter-spacing:0.02em;vertical-align:top;padding-top:6px;">${esc(label)}</td>
            <td style="vertical-align:top;">${chips(values)}</td>
          </tr>
        </table>
      </td>
    </tr>`
}

function capabilityGrid(caps: ApplicantData['capabilities']): string {
  // 2-column table of capabilities, green check for present, muted dot for absent
  const cells = CAPABILITY_LABELS.map(({ key, label }) => {
    const present = caps[key]
    const icon = present
      ? `<span style="display:inline-block;width:18px;height:18px;background:${C.greenBright};border-radius:50%;color:${C.white};font-size:12px;font-weight:700;text-align:center;line-height:18px;margin-right:10px;vertical-align:middle;">✓</span>`
      : `<span style="display:inline-block;width:18px;height:18px;border:1.5px solid ${C.border};border-radius:50%;margin-right:10px;vertical-align:middle;"></span>`
    const textColor = present ? C.text : C.muted
    const weight = present ? '600' : '400'
    return `<td style="padding:6px 8px;font-family:${FONT_SANS};font-size:13.5px;color:${textColor};font-weight:${weight};width:50%;vertical-align:middle;">${icon}${esc(label)}</td>`
  })
  // Build 3 rows of 2 cells
  let html = ''
  for (let i = 0; i < cells.length; i += 2) {
    html += `<tr>${cells[i]}${cells[i + 1] || ''}</tr>`
  }
  return `
    <tr>
      <td style="padding:6px 24px 12px 24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
          ${html}
        </table>
      </td>
    </tr>`
}

function skillsBlock(skills: string[]): string {
  const groups = groupSkills(skills)
  if (groups.length === 0) {
    return `
      <tr>
        <td style="padding:10px 32px;font-family:${FONT_SANS};font-size:14px;color:${C.muted};">
          No skills selected
        </td>
      </tr>`
  }
  return groups
    .map(
      g => `
    <tr>
      <td style="padding:10px 32px 2px 32px;">
        <div style="font-family:${FONT_SANS};font-size:11.5px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${C.greenMid};margin-bottom:6px;">
          ${esc(g.label)}
        </div>
        <div style="line-height:1.9;">
          ${chips(g.skills)}
        </div>
      </td>
    </tr>`
    )
    .join('')
}

function notesBlock(notes: string | null | undefined): string {
  if (!notes || !notes.trim()) {
    return `
      <tr>
        <td style="padding:8px 32px 16px 32px;font-family:${FONT_SANS};font-size:14px;color:${C.muted};">
          No additional notes provided
        </td>
      </tr>`
  }
  return `
    <tr>
      <td style="padding:8px 32px 20px 32px;">
        <div style="background:${C.cream};border-left:3px solid ${C.greenBright};padding:16px 20px;font-family:${FONT_SERIF};font-size:15px;font-style:italic;color:${C.text};line-height:1.65;white-space:pre-wrap;">
          ${esc(notes)}
        </div>
      </td>
    </tr>`
}

// ──────────────────────────────────────────────────────────────
// Main template
// ──────────────────────────────────────────────────────────────

export function renderApplyNotificationHtml(
  applicant: ApplicantData,
  opts: { logoUrl: string; portalUrl: string }
): string {
  const locationLine = [applicant.city, applicant.state].filter(Boolean).join(', ') || 'Location not provided'

  const fullAddress = [
    applicant.address,
    [applicant.city, applicant.state].filter(Boolean).join(', '),
    applicant.zip,
  ]
    .filter(Boolean)
    .join(' · ') || null

  const yearsExp = applicant.years_experience != null && String(applicant.years_experience).trim() !== ''
    ? `${applicant.years_experience} year${String(applicant.years_experience) === '1' ? '' : 's'}`
    : null

  const radius = applicant.service_radius_miles != null
    ? `${applicant.service_radius_miles} mile${applicant.service_radius_miles === 1 ? '' : 's'}`
    : null

  const shifts = (applicant.shift_preferences || []).map(prettifyShift)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Provider Application — ${esc(applicant.name)}</title>
</head>
<body style="margin:0;padding:0;background:${C.greenPale};font-family:${FONT_SANS};color:${C.text};-webkit-font-smoothing:antialiased;">

  <!-- Preheader (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${C.greenPale};">
    New ${esc(applicant.credential_type)} applicant · ${esc(locationLine)} · View in CareMatch360
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.greenPale};padding:32px 16px;">
    <tr>
      <td align="center">

        <!-- Main container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:${C.white};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(45,90,27,0.08);">

          <!-- Logo band -->
          <tr>
            <td align="center" style="padding:32px 32px 20px 32px;background:${C.white};">
              <img src="${esc(opts.logoUrl)}" alt="Vitalis HealthCare" width="240" style="width:240px;max-width:60%;height:auto;display:block;border:0;"/>
            </td>
          </tr>

          <!-- Green header band -->
          <tr>
            <td style="padding:0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:linear-gradient(135deg,${C.greenDark} 0%,${C.greenMid} 100%);background-color:${C.greenDark};">
                <tr>
                  <td style="padding:22px 32px;">
                    <div style="font-family:${FONT_SANS};font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:${C.greenLime};margin-bottom:4px;">
                      New Provider Application
                    </div>
                    <div style="font-family:${FONT_SANS};font-size:13px;color:rgba(255,255,255,0.75);">
                      Submitted ${esc(fmtDate(applicant.submitted_at))}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Applicant hero -->
          <tr>
            <td style="padding:32px 32px 8px 32px;">
              <div style="font-family:${FONT_SERIF};font-size:32px;font-weight:500;color:${C.text};line-height:1.15;letter-spacing:-0.01em;">
                ${esc(applicant.name)}
              </div>
              <div style="font-family:${FONT_SANS};font-size:14px;color:${C.muted};margin-top:6px;">
                <span style="color:${C.greenDark};font-weight:600;">${esc(applicant.credential_type)}</span>
                <span style="color:${C.border};margin:0 8px;">·</span>
                ${esc(locationLine)}
              </div>
            </td>
          </tr>

          <!-- PERSONAL -->
          ${sectionHeader('Personal')}
          ${row('Email', applicant.email)}
          ${row('Phone', applicant.phone)}
          ${row('Address', fullAddress)}
          ${row('Gender', prettifyGender(applicant.gender))}

          <!-- CREDENTIALS -->
          ${sectionHeader('Credentials')}
          ${row('Primary', applicant.credential_type)}
          ${row('License #', applicant.license_number, { mono: true })}
          ${chipRow('Additional', applicant.additional_credentials || [])}
          ${row('Experience', yearsExp)}

          <!-- AVAILABILITY -->
          ${sectionHeader('Availability')}
          ${chipRow('Shifts', shifts)}
          ${chipRow('Days', applicant.preferred_days || [])}
          ${row('Service radius', radius)}

          <!-- CAPABILITIES -->
          ${sectionHeader('Capabilities')}
          ${capabilityGrid(applicant.capabilities)}

          <!-- SKILLS -->
          ${sectionHeader('Skills')}
          ${skillsBlock(applicant.skills || [])}

          <!-- NOTES -->
          ${sectionHeader('Notes')}
          ${notesBlock(applicant.notes)}

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:12px 32px 36px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius:10px;background:${C.greenDark};">
                    <a href="${esc(opts.portalUrl)}" style="display:inline-block;padding:14px 28px;font-family:${FONT_SANS};font-size:14px;font-weight:600;color:${C.white};text-decoration:none;letter-spacing:0.02em;">
                      View in CareMatch360 →
                    </a>
                  </td>
                </tr>
              </table>
              <div style="font-family:${FONT_SANS};font-size:12.5px;color:${C.muted};margin-top:14px;">
                This applicant has been added with <strong style="color:${C.greenDark};">inactive</strong> status pending your review.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px 32px;background:${C.greenPale};border-top:1px solid ${C.border};">
              <div style="font-family:${FONT_SERIF};font-size:15px;font-weight:500;color:${C.greenDark};">
                Vitalis HealthCare Services LLC
              </div>
              <div style="font-family:${FONT_SANS};font-size:11.5px;color:${C.muted};margin-top:4px;line-height:1.7;">
                Silver Spring, MD · Maryland OHCQ License #3879R<br/>
                A full PDF copy of this application is attached for your records.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
