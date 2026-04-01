import { Resend } from 'resend'
import { Vonage } from '@vonage/server-sdk'

// Lazy init — never instantiate at module load time; build won't have env vars
function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

function getVonage() {
  const apiKey    = process.env.VONAGE_API_KEY
  const apiSecret = process.env.VONAGE_API_SECRET
  if (!apiKey || !apiSecret) return null
  return new Vonage({ apiKey, apiSecret })
}

export interface DispatchPayload {
  providerName: string
  providerEmail: string | null
  providerPhone: string | null
  caseTitle: string
  caseId: string
  credential: string
  urgency: string
  scheduleType: string
  scheduleDesc: string
  clientCity: string
  clientState: string
  skills: string[]
  specialInstructions: string | null
  yesUrl: string
  noUrl: string
  maybeUrl: string
}

export async function sendEmailDispatch(payload: DispatchPayload): Promise<{ id?: string; error?: string }> {
  if (!payload.providerEmail) return { error: 'No email address' }
  if (!process.env.RESEND_API_KEY) return { error: 'RESEND_API_KEY not configured' }

  const urgencyColor = payload.urgency === 'emergency' ? '#EF4444' : payload.urgency === 'urgent' ? '#F59E0B' : '#10B981'
  const urgencyLabel = payload.urgency.toUpperCase()

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#0B3D5C;padding:28px 32px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:36px;height:36px;background:#0EA5E9;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;flex-shrink:0;">⌖</div>
        <div>
          <div style="color:#fff;font-size:18px;font-weight:600;line-height:1.2;">CareMatch360</div>
          <div style="color:rgba(255,255,255,0.6);font-size:12px;">New Case Opportunity</div>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 8px;font-size:15px;color:#64748B;">Hi ${payload.providerName.split(' ')[0]},</p>
      <p style="margin:0 0 24px;font-size:15px;color:#1E293B;line-height:1.6;">
        A new case has been matched to you. Please review the details below and let us know if you're available.
      </p>

      <!-- Case card -->
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:24px;margin-bottom:24px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;">
          <div>
            <div style="font-size:17px;font-weight:600;color:#0B3D5C;margin-bottom:4px;">${payload.caseTitle}</div>
            <div style="font-size:13px;color:#64748B;">${payload.credential} • ${payload.clientCity}, ${payload.clientState}</div>
          </div>
          <div style="background:${urgencyColor}22;color:${urgencyColor};border:1px solid ${urgencyColor}44;border-radius:20px;padding:3px 12px;font-size:12px;font-weight:600;white-space:nowrap;">${urgencyLabel}</div>
        </div>

        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #E2E8F0;font-size:13px;color:#64748B;width:140px;">Schedule</td>
            <td style="padding:8px 0;border-bottom:1px solid #E2E8F0;font-size:13px;color:#1E293B;font-weight:500;">${payload.scheduleDesc}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #E2E8F0;font-size:13px;color:#64748B;">Location</td>
            <td style="padding:8px 0;border-bottom:1px solid #E2E8F0;font-size:13px;color:#1E293B;font-weight:500;">${payload.clientCity}, ${payload.clientState}</td>
          </tr>
          ${payload.skills.length > 0 ? `
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#64748B;">Skills needed</td>
            <td style="padding:8px 0;font-size:13px;color:#1E293B;">${payload.skills.join(' · ')}</td>
          </tr>` : ''}
        </table>

        ${payload.specialInstructions ? `
        <div style="margin-top:14px;padding:12px;background:#E0F2FE;border-radius:7px;font-size:13px;color:#0369A1;">
          <strong>Note:</strong> ${payload.specialInstructions}
        </div>` : ''}
      </div>

      <!-- Response buttons -->
      <p style="margin:0 0 16px;font-size:14px;color:#64748B;text-align:center;">Are you available for this case?</p>
      <div style="display:flex;gap:10px;justify-content:center;margin-bottom:16px;flex-wrap:wrap;">
        <a href="${payload.yesUrl}" style="display:inline-block;background:#10B981;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:14px;font-weight:600;">
          ✓ Yes, I'm Available
        </a>
        <a href="${payload.maybeUrl}" style="display:inline-block;background:#FEF9C3;color:#92400E;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:14px;font-weight:600;border:1px solid #FDE68A;">
          💬 I Have Questions
        </a>
        <a href="${payload.noUrl}" style="display:inline-block;background:#F1F5F9;color:#64748B;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:14px;font-weight:600;border:1px solid #E2E8F0;">
          ✗ Not Available
        </a>
      </div>
      <p style="margin:0 0 20px;font-size:11px;color:#94A3B8;text-align:center;">"I Have Questions" alerts your coordinator to call you before you commit.</p>

      <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center;line-height:1.6;">
        This link expires in 48 hours. If you have questions, contact your coordinator.<br>
        Vitalis Healthcare Services · Silver Spring, MD
      </p>
    </div>
  </div>
</body>
</html>`

  const resend = getResend()
  if (!resend) return { error: 'RESEND_API_KEY not configured' }
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'dispatch@carematch360.com',
      to: payload.providerEmail,
      subject: `[${urgencyLabel}] New Case: ${payload.caseTitle} — ${payload.clientCity}, ${payload.clientState}`,
      html,
    })
    if (result.error) return { error: result.error.message }
    return { id: result.data?.id }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function sendSmsDispatch(payload: DispatchPayload): Promise<{ id?: string; error?: string }> {
  if (!payload.providerPhone) return { error: 'No phone number' }
  const vonage = getVonage()
  if (!vonage) return { error: 'VONAGE_API_KEY / VONAGE_API_SECRET not configured' }

  // Clean and format phone number to E.164
  const digits = payload.providerPhone.replace(/[^0-9]/g, '')
  const to = digits.length === 10 ? `1${digits}` : digits  // add US country code if needed
  const from = process.env.VONAGE_FROM_NUMBER || 'CareMatch360'

  const urgencyEmoji = payload.urgency === 'emergency' ? '🔴' : payload.urgency === 'urgent' ? '🟡' : '🟢'

  const text = `${urgencyEmoji} CareMatch360 — New Case

${payload.caseTitle}
${payload.credential} · ${payload.clientCity}, ${payload.clientState}
${payload.scheduleDesc}

YES: ${payload.yesUrl}
Questions: ${payload.maybeUrl}
NO: ${payload.noUrl}

Expires 48hrs. —Vitalis Healthcare`

  try {
    const result = await vonage.sms.send({ to, from, text })
    const msg = result.messages?.[0]
    if (!msg || msg?.status !== '0') {
      const statusCode = msg?.status ?? 'no-response'
      const errText = (msg as any)?.errorText ?? 'Unknown error'
      // Common status codes: 2=missing params, 4=invalid credentials,
      // 5=internal error, 6=invalid message, 15=invalid sender, 33=unroutable number
      const hint = statusCode === '15' ? ' (alphanumeric sender IDs not supported for US — buy a Vonage virtual number)'
                 : statusCode === '4'  ? ' (invalid API credentials — check VONAGE_API_KEY and VONAGE_API_SECRET)'
                 : statusCode === '33' ? ' (number unroutable — check country code format)'
                 : ''
      return { error: `Vonage [${statusCode}]: ${errText}${hint}` }
    }
    return { id: (msg as any)?.messageId }
  } catch (err: any) {
    return { error: err.message }
  }
}

export function buildScheduleDesc(caseData: any): string {
  const type = caseData.schedule_type || 'one_time'
  if (type === 'one_time') {
    const d = caseData.visit_date ? new Date(caseData.visit_date).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' }) : 'TBD'
    const t = caseData.visit_time ? ` at ${caseData.visit_time.slice(0,5)}` : ''
    return `${d}${t} · ${caseData.duration_hours ?? 1}h`
  }
  if (type === 'recurring') {
    const days = (caseData.recurring_days || []).map((d: string) => d.slice(0,3)).join('/')
    const start = caseData.recurring_start?.slice(0,5) || ''
    const end = caseData.recurring_end?.slice(0,5) || ''
    return `${days} ${start}–${end} (recurring)`
  }
  if (type === 'flexible') {
    return `Flexible · ${caseData.flexible_hours_day ?? '?'}h/day · ${caseData.flexible_days_week ?? '?'} days/week`
  }
  return 'Schedule TBD'
}
