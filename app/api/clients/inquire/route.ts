import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      // Contact / POC info
      contact_name, contact_relationship, contact_email, contact_phone,
      // Client info
      name, dob,
      address, city, state, zip,
      // Care needs
      care_level, care_needs, required_skills,
      // Schedule
      schedule_type, hours_per_day, days_per_week, start_date, urgency,
      // Payer
      payer_types,
      // Requirements
      requires_car, requires_meal_prep, requires_spanish,
      requires_hoyer_lift, requires_wheelchair, gender_preference,
      // Notes
      conditions, additional_notes,
    } = body

    if (!contact_name || !contact_email || !contact_phone) {
      return NextResponse.json({ error: 'Contact name, email and phone are required' }, { status: 400 })
    }

    const db = createServiceClient()

    // Insert client with inactive status (pending coordinator review)
    const clientName = name || contact_name
    const { data: client, error } = await db.from('clients').insert({
      name: clientName,
      city: city || 'Silver Spring',
      state: state || 'MD',
      address,
      zip,
      required_credential: null,
      care_needs: care_needs || [],
      required_skills: required_skills || [],
      payer_types: payer_types || [],
      gender_preference: (['any','male','female'].includes(gender_preference) ? gender_preference : 'any'),
      requires_car: requires_car || false,
      contact_name,
      contact_phone,
      contact_email,
      status: 'inactive',
      notes: [
        `[INQUIRY] Contact: ${contact_name} (${contact_relationship || 'Self'})`,
        `Phone: ${contact_phone} · Email: ${contact_email}`,
        dob ? `DOB: ${dob}` : '',
        care_level ? `Care Level: ${care_level}` : '',
        schedule_type ? `Schedule: ${schedule_type}, ${hours_per_day || '?'}h/day, ${days_per_week || '?'} days/wk` : '',
        start_date ? `Start: ${start_date}` : '',
        urgency ? `Urgency: ${urgency}` : '',
        conditions ? `Conditions: ${conditions}` : '',
        requires_spanish ? 'Spanish speaking required' : '',
        requires_hoyer_lift ? 'Hoyer lift required' : '',
        requires_wheelchair ? 'Wheelchair transfer required' : '',
        requires_meal_prep ? 'Meal prep required' : '',
        additional_notes ? `Notes: ${additional_notes}` : '',
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
          subject: `🏠 New Client Inquiry — ${clientName} (${care_level || 'care needed'})`,
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
            <h2 style="color:#2D5A1B;margin-bottom:4px">New Client Care Inquiry</h2>
            <p style="color:#5A7050;margin-top:0">Submitted via the Vitalis client intake form</p>
            <div style="background:#F4FAF0;border:1px solid #C8DDB8;border-radius:8px;padding:20px;margin:20px 0">
              <div style="font-size:12px;font-weight:700;color:#7AB52A;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">Contact / Decision Maker</div>
              <table style="width:100%;font-size:14px;border-collapse:collapse">
                <tr><td style="padding:5px 0;color:#5A7050;width:140px">Name</td><td style="padding:5px 0;font-weight:600">${contact_name}</td></tr>
                <tr><td style="padding:5px 0;color:#5A7050">Relationship</td><td style="padding:5px 0">${contact_relationship || 'Self'}</td></tr>
                <tr><td style="padding:5px 0;color:#5A7050">Email</td><td style="padding:5px 0">${contact_email}</td></tr>
                <tr><td style="padding:5px 0;color:#5A7050">Phone</td><td style="padding:5px 0">${contact_phone}</td></tr>
              </table>
            </div>
            <div style="background:#F4FAF0;border:1px solid #C8DDB8;border-radius:8px;padding:20px;margin:20px 0">
              <div style="font-size:12px;font-weight:700;color:#7AB52A;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px">Care Recipient</div>
              <table style="width:100%;font-size:14px;border-collapse:collapse">
                <tr><td style="padding:5px 0;color:#5A7050;width:140px">Name</td><td style="padding:5px 0;font-weight:600">${name || contact_name}</td></tr>
                <tr><td style="padding:5px 0;color:#5A7050">Location</td><td style="padding:5px 0">${city || '—'}, ${state || 'MD'} ${zip || ''}</td></tr>
                <tr><td style="padding:5px 0;color:#5A7050">Care Level</td><td style="padding:5px 0;font-weight:600;color:#2D5A1B">${care_level || '—'}</td></tr>
                <tr><td style="padding:5px 0;color:#5A7050">Schedule</td><td style="padding:5px 0">${schedule_type || '—'} · ${hours_per_day || '?'}h/day · ${days_per_week || '?'} days/wk</td></tr>
                <tr><td style="padding:5px 0;color:#5A7050">Start Date</td><td style="padding:5px 0">${start_date || '—'}</td></tr>
                <tr><td style="padding:5px 0;color:#5A7050">Urgency</td><td style="padding:5px 0;font-weight:600;color:${urgency === 'emergency' ? '#DC2626' : urgency === 'urgent' ? '#D97706' : '#2D5A1B'}">${urgency || '—'}</td></tr>
                <tr><td style="padding:5px 0;color:#5A7050">Payer</td><td style="padding:5px 0">${(payer_types || []).join(', ') || '—'}</td></tr>
                ${conditions ? `<tr><td style="padding:5px 0;color:#5A7050">Conditions</td><td style="padding:5px 0">${conditions}</td></tr>` : ''}
                ${additional_notes ? `<tr><td style="padding:5px 0;color:#5A7050">Notes</td><td style="padding:5px 0">${additional_notes}</td></tr>` : ''}
              </table>
            </div>
            <p style="font-size:13px;color:#5A7050">This client has been added to CareMatch360 as <strong>inactive</strong>. Please review and follow up within 24 hours.</p>
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
