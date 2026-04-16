/**
 * Renders the applicant-facing confirmation email sent after a new
 * provider application is submitted. This is the "thank you, we'll
 * be in touch" email — distinct from the coordinator notification.
 *
 * Design constraints (same as apply-notification-html.ts):
 * - Table-based layout (no flexbox/grid)
 * - Inline styles only (no <style> rules)
 * - 600px max width
 * - Green-palette brand tokens match the apply form + coordinator email
 *
 * Shorter and warmer than the coordinator email — no data sections,
 * no PDF attachment, no CTA button (nothing for the applicant to do).
 */

import type { ApplicantData } from './types'

// Same palette as apply-notification-html.ts — keep tokens in sync.
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

function firstName(fullName: string): string {
  if (!fullName) return 'there'
  const first = fullName.trim().split(/\s+/)[0]
  return first || 'there'
}

function stepCard(num: number, title: string, body: string): string {
  return `
    <tr>
      <td style="padding:0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td width="44" valign="top" style="padding:4px 14px 4px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="32" height="32" align="center" valign="middle" style="background:${C.greenBright};border-radius:50%;font-family:${FONT_SANS};font-size:14px;font-weight:700;color:${C.white};line-height:32px;">
                    ${num}
                  </td>
                </tr>
              </table>
            </td>
            <td valign="top" style="padding:2px 0 18px 0;">
              <div style="font-family:${FONT_SANS};font-size:14.5px;font-weight:600;color:${C.text};margin-bottom:3px;letter-spacing:-0.005em;">
                ${esc(title)}
              </div>
              <div style="font-family:${FONT_SANS};font-size:13.5px;color:${C.muted};line-height:1.55;">
                ${esc(body)}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
}

export type ApplicantConfirmationOpts = {
  logoUrl: string
}

export function renderApplicantConfirmationHtml(
  applicant: ApplicantData,
  opts: ApplicantConfirmationOpts
): string {
  const greeting = firstName(applicant.name)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Thank you for applying to Vitalis HealthCare</title>
</head>
<body style="margin:0;padding:0;background:${C.greenPale};font-family:${FONT_SANS};color:${C.text};-webkit-font-smoothing:antialiased;">

  <!-- Preheader (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${C.greenPale};">
    Your application has been received. We'll respond within 1–2 business days.
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
                      Application Received
                    </div>
                    <div style="font-family:${FONT_SERIF};font-size:24px;font-weight:500;color:${C.white};letter-spacing:-0.01em;">
                      Thank you for applying
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting + body -->
          <tr>
            <td style="padding:32px 32px 8px 32px;">
              <div style="font-family:${FONT_SERIF};font-size:20px;font-weight:500;color:${C.text};margin-bottom:16px;">
                Dear ${esc(greeting)},
              </div>
              <div style="font-family:${FONT_SANS};font-size:15px;color:${C.text};line-height:1.65;">
                Thank you for applying to join Vitalis HealthCare Services.
                We've received your application and a member of our team will
                review it shortly.
              </div>
            </td>
          </tr>

          <!-- What happens next card -->
          <tr>
            <td style="padding:20px 32px 8px 32px;">
              <div style="background:${C.cream};border:1px solid ${C.border};border-radius:12px;padding:22px 24px;">
                <div style="font-family:${FONT_SANS};font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${C.greenDark};margin-bottom:16px;">
                  What happens next
                </div>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                  ${stepCard(1, 'Review', 'Our coordinator reviews your application and credentials.')}
                  ${stepCard(2, 'Verification', 'We may contact you for references or to confirm details.')}
                  ${stepCard(3, 'Interview', "If your profile is a fit, we'll reach out to schedule an interview.")}
                </table>
              </div>
            </td>
          </tr>

          <!-- Closing paragraph -->
          <tr>
            <td style="padding:20px 32px 8px 32px;">
              <div style="font-family:${FONT_SANS};font-size:14.5px;color:${C.text};line-height:1.65;">
                We aim to respond to every application within
                <strong style="color:${C.greenDark};">1&ndash;2 business days</strong>.
              </div>
              <div style="font-family:${FONT_SANS};font-size:14.5px;color:${C.text};line-height:1.65;margin-top:14px;">
                If you have questions in the meantime, simply reply to this
                email &mdash; it goes straight to our team.
              </div>
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td style="padding:28px 32px 36px 32px;">
              <div style="font-family:${FONT_SANS};font-size:14.5px;color:${C.text};line-height:1.65;">
                With gratitude,
              </div>
              <div style="font-family:${FONT_SERIF};font-size:18px;color:${C.greenDark};font-weight:500;margin-top:4px;letter-spacing:-0.005em;">
                The Vitalis HealthCare Team
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
                Silver Spring, MD &middot; Maryland OHCQ License #3879R
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
