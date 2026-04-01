import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const db = createServiceClient()

    // Check staff exists and is active
    const { data: staff } = await db
      .from('staff_users')
      .select('id, full_name, role, active')
      .eq('email', email.toLowerCase().trim())
      .single()

    // Always return success (don't leak whether email exists)
    if (!staff || !staff.active) {
      return NextResponse.json({ success: true })
    }

    // Generate magic link token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await db.from('auth_tokens').insert({
      token,
      token_type: 'magic_link',
      channel: 'email',
      user_type: 'staff',
      user_id: staff.id,
      expires_at: expiresAt.toISOString(),
    })

    // Send email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://carematch360.vercel.app'
    const magicLink = `${appUrl}/auth/verify?token=${token}&type=staff`

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: 'Sign in to CareMatch360',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <div style="text-align:center;margin-bottom:32px">
            <div style="width:52px;height:52px;background:linear-gradient(135deg,#0B3D5C,#0E9FA3);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;color:#fff;margin-bottom:12px">⌖</div>
            <div style="font-weight:700;font-size:20px;color:#0B2D45">CareMatch360</div>
          </div>
          <h2 style="color:#0B2D45;margin-bottom:8px">Hi ${staff.full_name},</h2>
          <p style="color:#64748B;line-height:1.7;margin-bottom:28px">
            Click the button below to sign in. This link expires in 1 hour and can only be used once.
          </p>
          <a href="${magicLink}"
             style="display:block;background:linear-gradient(135deg,#0B3D5C,#0E9FA3);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;text-align:center;margin-bottom:24px">
            Sign In to CareMatch360 →
          </a>
          <p style="color:#94A3B8;font-size:12px;text-align:center;line-height:1.6">
            If you didn't request this, you can safely ignore this email.<br/>
            This link expires at ${expiresAt.toLocaleTimeString('en-US', { timeZone: 'America/New_York' })} ET.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
