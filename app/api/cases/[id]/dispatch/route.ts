import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmailDispatch, sendSmsDispatch, buildScheduleDesc, DispatchPayload } from '@/lib/dispatch'

// Server-side circuit breaker. Even if a future UI bug tries to fire
// hundreds of notifications at once, the API stops it here. Sized
// generously above the matching cap (20) to allow some flexibility.
const MAX_DISPATCH_PER_REQUEST = 25

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { providerIds, channels } = body
    // channels: string[] — e.g. ['email','sms']

    if (!providerIds?.length) return NextResponse.json({ error: 'No providers selected' }, { status: 400 })
    if (!channels?.length)    return NextResponse.json({ error: 'No channels selected' }, { status: 400 })

    if (providerIds.length > MAX_DISPATCH_PER_REQUEST) {
      return NextResponse.json({
        error: `Safety limit: cannot dispatch to more than ${MAX_DISPATCH_PER_REQUEST} providers in a single request. You requested ${providerIds.length}. Please select fewer providers and try again.`,
      }, { status: 400 })
    }

    const db = createServiceClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://carematch360.vercel.app'

    // Load case + client
    const { data: caseData, error: caseErr } = await db
      .from('cases')
      .select('*,clients(id,name,city,state,lat,lng)')
      .eq('id', id).single()
    if (caseErr || !caseData) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

    const client = Array.isArray(caseData.clients) ? caseData.clients[0] : caseData.clients
    const scheduleDesc = buildScheduleDesc(caseData)

    const results: any[] = []
    const logRows: any[] = []

    for (const providerId of providerIds) {
      // Load provider
      const { data: provider } = await db.from('providers').select('id,name,email,phone,credential_type').eq('id', providerId).single()
      if (!provider) continue

      // Get or create case_match row
      const { data: matchRow } = await db.from('case_matches')
        .select('id').eq('case_id', id).eq('provider_id', providerId).maybeSingle()

      let matchId = matchRow?.id
      if (!matchId) {
        const { data: newMatch } = await db.from('case_matches').insert({
          case_id: id, provider_id: providerId, match_score: 0,
          credential_match: true, skill_match_count: 0, skill_match_pct: 0,
          within_radius: true, is_available: true, status: 'pending',
        }).select('id').single()
        matchId = newMatch?.id
      }
      if (!matchId) continue

      const providerResult: any = { providerId, providerName: provider.name, channels: [] }

      for (const channel of channels) {
        // Create a unique single-use token for this provider+channel
        const { data: tokenRow } = await db.from('dispatch_tokens').insert({
          case_match_id: matchId,
          case_id: id,
          provider_id: providerId,
          channel,
        }).select('token').single()

        if (!tokenRow) continue
        const token = tokenRow.token

        // Create separate tokens for each answer so each is single-use
        const { data: maybeTokenRow } = await db.from('dispatch_tokens').insert({
          case_match_id: matchId, case_id: id, provider_id: providerId, channel,
        }).select('token').single()

        const yesUrl   = `${appUrl}/respond?token=${token}&answer=yes`
        const noUrl    = `${appUrl}/respond?token=${token}&answer=no`
        const maybeUrl = `${appUrl}/respond?token=${maybeTokenRow?.token}&answer=maybe`

        const payload: DispatchPayload = {
          providerName: provider.name,
          providerEmail: provider.email,
          providerPhone: provider.phone,
          caseTitle: caseData.title,
          caseId: id,
          credential: caseData.required_credential,
          urgency: caseData.urgency || 'routine',
          scheduleType: caseData.schedule_type || 'one_time',
          scheduleDesc,
          clientCity: client?.city || 'Unknown',
          clientState: client?.state || 'MD',
          skills: caseData.required_skills || [],
          specialInstructions: caseData.special_instructions,
          yesUrl,
          noUrl,
          maybeUrl,
        }

        let sendResult: { id?: string; error?: string } = {}
        if (channel === 'email') sendResult = await sendEmailDispatch(payload)
        if (channel === 'sms')   sendResult = await sendSmsDispatch(payload)

        logRows.push({
          case_id: id,
          provider_id: providerId,
          channel,
          status: sendResult.error ? 'failed' : 'sent',
          external_id: sendResult.id || null,
          error: sendResult.error || null,
        })

        providerResult.channels.push({ channel, status: sendResult.error ? 'failed' : 'sent', error: sendResult.error })
      }

      // Mark match as notified
      await db.from('case_matches').update({
        status: 'notified',
        notified_at: new Date().toISOString(),
        notified_channels: channels,
      }).eq('id', matchId)

      results.push(providerResult)
    }

    // Write dispatch log
    if (logRows.length > 0) {
      await db.from('dispatch_log').insert(logRows)
    }

    // Mark case as dispatched
    await db.from('cases').update({
      dispatched_at: new Date().toISOString(),
      status: 'matching',
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    const sent = logRows.filter(r => r.status === 'sent').length
    const failed = logRows.filter(r => r.status === 'failed').length

    return NextResponse.json({ results, sent, failed, total: providerIds.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
