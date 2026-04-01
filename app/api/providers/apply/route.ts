import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name, email, phone, address, city, state, zip, gender,
      credential_type, additional_credentials, license_number,
      years_experience, skills, preferred_days, shift_preferences,
      service_radius_miles, has_car, spanish_speaking, hoyer_lift,
      wheelchair_transfer, meal_prep, total_care, notes,
    } = body

    if (!name || !email || !phone || !credential_type) {
      return NextResponse.json({ error: 'Name, email, phone and credential are required' }, { status: 400 })
    }

    const db = createServiceClient()

    // Check for duplicate email
    const { data: existing } = await db.from('providers').select('id').eq('email', email).maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'A provider with this email already exists in our system.' }, { status: 409 })
    }

    // Insert provider with inactive status (pending review)
    const { data: provider, error } = await db.from('providers').insert({
      name,
      email,
      phone,
      address,
      city: city || 'Silver Spring',
      state: state || 'MD',
      zip,
      gender,
      credential_type,
      additional_credentials: additional_credentials || [],
      license_number,
      skills: skills || [],
      preferred_days: preferred_days || [],
      shift_preferences: shift_preferences || [],
      service_radius_miles: service_radius_miles || 15,
      has_car: has_car || false,
      spanish_speaking: spanish_speaking || false,
      hoyer_lift: hoyer_lift || false,
      wheelchair_transfer: wheelchair_transfer || false,
      meal_prep: meal_prep || false,
      total_care: total_care || false,
      available: false,
      status: 'inactive', // pending review by coordinator
      notes: notes ? `[APPLICATION] Years exp: ${years_experience || 'N/A'}\n\n${notes}` : `[APPLICATION] Years exp: ${years_experience || 'N/A'}`,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Notify coordinator
    try {
      const coordinatorEmail = process.env.COORDINATOR_EMAIL
      const resendKey = process.env.RESEND_API_KEY
      const fromEmail = process.env.RESEND_FROM_EMAIL
      if (coordinatorEmail && resendKey && fromEmail) {
        const { Resend } = await import('resend')
        const resend = new Resend(resendKey)
        await resend.emails.send({
          from: fromEmail,
          to: coordinatorEmail,
          subject: `🆕 New Provider Application — ${name} (${credential_type})`,
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
            <h2 style="color:#0B3D5C;margin-bottom:4px">New Provider Application</h2>
            <p style="color:#64748B;margin-top:0">Submitted via the Vitalis provider application form</p>
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:20px;margin:20px 0">
              <table style="width:100%;font-size:14px;border-collapse:collapse">
                <tr><td style="padding:6px 0;color:#64748B;width:140px">Name</td><td style="padding:6px 0;font-weight:600">${name}</td></tr>
                <tr><td style="padding:6px 0;color:#64748B">Email</td><td style="padding:6px 0">${email}</td></tr>
                <tr><td style="padding:6px 0;color:#64748B">Phone</td><td style="padding:6px 0">${phone}</td></tr>
                <tr><td style="padding:6px 0;color:#64748B">City</td><td style="padding:6px 0">${city || '—'}, ${state || 'MD'}</td></tr>
                <tr><td style="padding:6px 0;color:#64748B">Credential</td><td style="padding:6px 0;font-weight:600;color:#0B3D5C">${credential_type}</td></tr>
                <tr><td style="padding:6px 0;color:#64748B">License #</td><td style="padding:6px 0">${license_number || '—'}</td></tr>
                <tr><td style="padding:6px 0;color:#64748B">Experience</td><td style="padding:6px 0">${years_experience || '—'} years</td></tr>
                <tr><td style="padding:6px 0;color:#64748B">Has car</td><td style="padding:6px 0">${has_car ? 'Yes' : 'No'}</td></tr>
                <tr><td style="padding:6px 0;color:#64748B">Spanish</td><td style="padding:6px 0">${spanish_speaking ? 'Yes' : 'No'}</td></tr>
                ${notes ? `<tr><td style="padding:6px 0;color:#64748B">Notes</td><td style="padding:6px 0">${notes}</td></tr>` : ''}
              </table>
            </div>
            <p style="font-size:13px;color:#64748B">This provider has been added to CareMatch360 with <strong>inactive</strong> status. Please review and activate when ready.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/providers/${provider.id}" 
               style="display:inline-block;background:#0B3D5C;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;margin-top:8px">
              View in CareMatch360 →
            </a>
          </div>`,
        })
      }
    } catch {}

    return NextResponse.json({ success: true, id: provider.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Allow CORS for external website submissions
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
