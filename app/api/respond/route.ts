import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token  = searchParams.get('token')
  const answer = searchParams.get('answer')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://carematch360.vercel.app'

  if (!token || !answer || !['yes','no','maybe'].includes(answer)) {
    return NextResponse.redirect(`${appUrl}/respond/invalid`)
  }

  try {
    const db = createServiceClient()

    // Look up token — catch table-not-found separately
    let tokenRow: any = null
    try {
      const { data, error } = await db
        .from('dispatch_tokens')
        .select('*')
        .eq('token', token)
        .maybeSingle()
      if (error) {
        // Table doesn't exist or DB error
        return NextResponse.redirect(`${appUrl}/respond/invalid?reason=db`)
      }
      tokenRow = data
    } catch {
      return NextResponse.redirect(`${appUrl}/respond/invalid?reason=db`)
    }

    if (!tokenRow) return NextResponse.redirect(`${appUrl}/respond/invalid?reason=notfound`)
    if (tokenRow.used_at) return NextResponse.redirect(`${appUrl}/respond/already-responded?answer=${tokenRow.answer ?? 'yes'}`)
    if (new Date(tokenRow.expires_at) < new Date()) return NextResponse.redirect(`${appUrl}/respond/expired`)

    // Mark token used
    await db.from('dispatch_tokens').update({
      used_at: new Date().toISOString(),
      answer,
    }).eq('token', token)

    // Update case_match status
    const newStatus = answer === 'yes' ? 'accepted' : answer === 'maybe' ? 'interested' : 'declined'
    await db.from('case_matches').update({
      status: newStatus,
      response_at: new Date().toISOString(),
      response_channel: tokenRow.channel,
    }).eq('id', tokenRow.case_match_id)

    // If accepted → case matched
    if (answer === 'yes') {
      const { data: caseRow } = await db.from('cases').select('status').eq('id', tokenRow.case_id).single()
      if (caseRow?.status !== 'assigned') {
        await db.from('cases').update({ status: 'matched', updated_at: new Date().toISOString() }).eq('id', tokenRow.case_id)
      }
    }

    // If interested → notify coordinator by email
    if (answer === 'maybe') {
      try {
        const { data: caseRow } = await db.from('cases')
          .select('title,clients(city,state)').eq('id', tokenRow.case_id).single()
        const { data: provider } = await db.from('providers')
          .select('name,phone,email').eq('id', tokenRow.provider_id).single()
        const notifyEmail = process.env.COORDINATOR_EMAIL || process.env.RESEND_FROM_EMAIL
        if (notifyEmail) {
          const { Resend } = await import('resend')
          const resend = new Resend(process.env.RESEND_API_KEY)
          const client = Array.isArray(caseRow?.clients) ? (caseRow.clients as any[])[0] : caseRow?.clients
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'dispatch@carematch360.com',
            to: notifyEmail,
            subject: `📞 Follow-up needed: ${provider?.name} wants more info — ${caseRow?.title}`,
            html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
              <h2 style="color:#0B3D5C;margin-bottom:4px">Provider Wants More Information</h2>
              <p style="color:#64748B;margin-top:0">${caseRow?.title} · ${client?.city ?? ''}, ${client?.state ?? 'MD'}</p>
              <div style="background:#FEF9C3;border:1px solid #FDE68A;border-radius:8px;padding:16px;margin:16px 0">
                <strong>${provider?.name}</strong> is interested but has questions before committing.<br/>
                <div style="margin-top:8px;font-size:14px;color:#64748B">
                  ${provider?.phone ? `📞 ${provider.phone}` : ''}
                  ${provider?.email ? ` · ✉️ ${provider.email}` : ''}
                </div>
              </div>
              <p style="font-size:13px;color:#64748B">Please follow up directly to answer their questions and confirm availability.</p>
            </div>`,
          })
        }
      } catch {}
    }

    return NextResponse.redirect(`${appUrl}/respond/thank-you?answer=${answer}&case_id=${tokenRow.case_id}`)
  } catch (err: any) {
    return NextResponse.redirect(`${appUrl}/respond/invalid`)
  }
}
