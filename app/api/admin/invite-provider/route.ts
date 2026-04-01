import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    await requireAuth(['admin', 'coordinator'])
    const { provider_id } = await req.json()
    const db = createServiceClient()

    const { data: provider } = await db.from('providers')
      .select('id, name, email, phone, credential_type, city')
      .eq('id', provider_id).single()

    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    if (!provider.email) return NextResponse.json({ error: 'Provider has no email address' }, { status: 400 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://carematch360.vercel.app'
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: provider.email,
      subject: `Your Vitalis HealthCare Provider Portal is Ready`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <div style="text-align:center;margin-bottom:28px">
            <div style="width:52px;height:52px;background:linear-gradient(135deg,#2D5A1B,#4A7C2F);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;color:#fff;margin-bottom:12px">⌖</div>
            <div style="font-weight:700;font-size:20px;color:#1A3A0A">Vitalis HealthCare</div>
          </div>
          <h2 style="color:#1A3A0A">Hi ${provider.name},</h2>
          <p style="color:#5A7050;line-height:1.7">
            Your provider portal is ready. You can now sign in to view case opportunities, indicate your availability, and update your profile.
          </p>
          <p style="color:#5A7050;line-height:1.7">
            Sign in using your email address or phone number — no password needed. We'll send you a quick code to verify it's you.
          </p>
          <a href="${appUrl}/provider/login" style="display:block;background:linear-gradient(135deg,#2D5A1B,#4A7C2F);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;text-align:center;margin:24px 0">
            Access Your Portal →
          </a>
          <div style="background:#F4FAF0;border:1px solid #C8DDB8;border-radius:10px;padding:16px 18px;font-size:13px;color:#5A7050;line-height:1.7">
            <strong>How it works:</strong><br/>
            Enter your email or phone → receive a 6-digit code → enter the code → you're in.<br/>
            No app download, no password to remember.
          </div>
          <p style="color:#94A3B8;font-size:12px;text-align:center;margin-top:20px">
            Questions? Call us at 240.716.6874 or email team@vitalishealthcare.com
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
