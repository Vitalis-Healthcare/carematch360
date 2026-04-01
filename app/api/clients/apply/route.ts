import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name, email, phone, address, city, state, zip,
      dob, gender_preference,
      care_needs, required_skills, payer_types,
      schedule_type, hours_per_day, days_per_week, preferred_days,
      requires_car, requires_meal_prep, requires_total_care,
      requires_wheelchair, requires_hoyer_lift, requires_spanish,
      referral_source, notes,
    } = body

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }

    const db = createServiceClient()

    const { data: client, error } = await db.from('clients').insert({
      name,
      email: email || null,
      phone,
      address,
      city: city || 'Silver Spring',
      state: state || 'MD',
      zip,
      dob,
      gender_preference: gender_preference || 'no_preference',
      care_needs: care_needs || [],
      required_skills: required_skills || [],
      payer_types: payer_types || [],
      requires_car: requires_car || false,
      requires_meal_prep: requires_meal_prep || false,
      requires_total_care: requires_total_care || false,
      requires_wheelchair: requires_wheelchair || false,
      requires_hoyer_lift: requires_hoyer_lift || false,
      requires_spanish: requires_spanish || false,
      status: 'active',
      notes: [
        referral_source ? `Referred via: ${referral_source}` : null,
        schedule_type ? `Schedule: ${schedule_type}${hours_per_day ? `, ${hours_per_day}h/day` : ''}${days_per_week ? `, ${days_per_week} days/week` : ''}` : null,
        preferred_days?.length ? `Preferred days: ${preferred_days.join(', ')}` : null,
        notes || null,
      ].filter(Boolean).join('\n'),
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
          subject: `🆕 New Care Request — ${name} · ${city || 'MD'}`,
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
            <h2 style="color:#2D5A1B;margin-bottom:4px">New Client Care Request</h2>
            <p style="color:#5A7050;margin-top:0">Submitted via vitalishealthcare.com</p>
            <div style="background:#F4FAF0;border:1px solid #C8DDB8;border-radius:8px;padding:20px;margin:20px 0">
              <table style="width:100%;font-size:14px;border-collapse:collapse">
                <tr><td style="padding:6px 0;color:#5A7050;width:140px">Name</td><td style="padding:6px 0;font-weight:600">${name}</td></tr>
                <tr><td style="padding:6px 0;color:#5A7050">Phone</td><td style="padding:6px 0">${phone}</td></tr>
                <tr><td style="padding:6px 0;color:#5A7050">Email</td><td style="padding:6px 0">${email || '—'}</td></tr>
                <tr><td style="padding:6px 0;color:#5A7050">Location</td><td style="padding:6px 0">${city || '—'}, ${state || 'MD'} ${zip || ''}</td></tr>
                <tr><td style="padding:6px 0;color:#5A7050">Care Needs</td><td style="padding:6px 0;font-weight:600;color:#2D5A1B">${(care_needs || []).join(', ') || '—'}</td></tr>
                <tr><td style="padding:6px 0;color:#5A7050">Payer</td><td style="padding:6px 0">${(payer_types || []).join(', ') || '—'}</td></tr>
                <tr><td style="padding:6px 0;color:#5A7050">Schedule</td><td style="padding:6px 0">${schedule_type || '—'}${hours_per_day ? ` · ${hours_per_day}h/day` : ''}</td></tr>
                <tr><td style="padding:6px 0;color:#5A7050">Referred by</td><td style="padding:6px 0">${referral_source || '—'}</td></tr>
                ${notes ? `<tr><td style="padding:6px 0;color:#5A7050">Notes</td><td style="padding:6px 0">${notes}</td></tr>` : ''}
              </table>
            </div>
            <p style="font-size:13px;color:#5A7050">This client has been added to CareMatch360. Please follow up within 24 hours to complete the intake assessment.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/clients/${client.id}"
               style="display:inline-block;background:#2D5A1B;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;margin-top:8px">
              View in CareMatch360 →
            </a>
          </div>`,
        })
      }
    } catch {}

    return NextResponse.json({ success: true, id: client.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
