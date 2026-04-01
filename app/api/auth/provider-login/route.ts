import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const { email, phone } = await req.json()
    const db = createServiceClient()

    // Look up provider by email or phone
    const query = db.from('providers').select('id, name, email, phone, status')
    const { data: provider } = email
      ? await query.eq('email', email.toLowerCase().trim()).maybeSingle()
      : await query.eq('phone', phone?.replace(/\D/g, '')).maybeSingle()

    // Always return success (security)
    if (!provider || provider.status === 'suspended') {
      return NextResponse.json({ success: true })
    }

    // Generate 6-digit OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Delete any existing unused tokens for this provider
    await db.from('auth_tokens')
      .delete()
      .eq('user_id', provider.id)
      .eq('user_type', 'provider')
      .is('used_at', null)

    await db.from('auth_tokens').insert({
      token: otp,
      token_type: 'otp',
      channel: 'email',
      user_type: 'provider',
      user_id: provider.id,
      expires_at: expiresAt.toISOString(),
    })

    // Send OTP via email (SMS when 10DLC ready)
    const contactEmail = provider.email || email
    if (contactEmail) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: contactEmail,
        subject: `Your CareMatch360 code: ${otp}`,
        html: `
          <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px 24px;text-align:center">
            <div style="width:52px;height:52px;background:linear-gradient(135deg,#0B3D5C,#0E9FA3);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;color:#fff;margin-bottom:16px">⌖</div>
            <h2 style="color:#0B2D45;margin-bottom:8px">Hi ${provider.name},</h2>
            <p style="color:#64748B;margin-bottom:24px">Your CareMatch360 sign-in code is:</p>
            <div style="background:#F0F9FF;border:2px solid #0E9FA3;border-radius:14px;padding:24px;margin-bottom:24px">
              <div style="font-size:42px;font-weight:800;letter-spacing:8px;color:#0B2D45;font-family:monospace">${otp}</div>
            </div>
            <p style="color:#94A3B8;font-size:12px">Expires in 15 minutes. Don't share this code with anyone.</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true, via: 'email' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
