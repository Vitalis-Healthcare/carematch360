import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(['admin'])
    const { email, full_name, role } = await req.json()
    if (!email || !full_name || !role) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const db = createServiceClient()

    // Check not already exists
    const { data: existing } = await db.from('staff_users').select('id').eq('email', email.toLowerCase()).maybeSingle()
    if (existing) return NextResponse.json({ error: 'User with this email already exists.' }, { status: 409 })

    // Create staff user
    const { data: newStaff, error } = await db.from('staff_users')
      .insert({ email: email.toLowerCase(), full_name, role, active: true })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Send welcome + magic link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://carematch360.vercel.app'
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: `You've been invited to CareMatch360`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <div style="text-align:center;margin-bottom:28px">
            <div style="width:52px;height:52px;background:linear-gradient(135deg,#0B3D5C,#0E9FA3);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;color:#fff;margin-bottom:12px">⌖</div>
            <div style="font-weight:700;font-size:20px;color:#0B2D45">CareMatch360</div>
          </div>
          <h2 style="color:#0B2D45">Hi ${full_name},</h2>
          <p style="color:#64748B;line-height:1.7">You've been invited to join <strong>Vitalis Healthcare's CareMatch360</strong> platform as a <strong>${role}</strong>.</p>
          <p style="color:#64748B;line-height:1.7">Sign in at the link below using your email address — no password needed.</p>
          <a href="${appUrl}/login" style="display:block;background:linear-gradient(135deg,#0B3D5C,#0E9FA3);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;text-align:center;margin:24px 0">
            Go to CareMatch360 →
          </a>
          <p style="color:#94A3B8;font-size:12px;text-align:center">Questions? Reply to this email or contact your administrator.</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
