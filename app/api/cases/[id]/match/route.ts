import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { runMatchingEngine } from '@/lib/matching'
import { CareLevel } from '@/types'

// Cap the matching results so the dispatch panel stays focused on the
// best candidates instead of every eligible provider in the network.
const MAX_MATCHES = 20

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = createServiceClient()

    const { data: caseData, error: caseErr } = await db
      .from('cases')
      .select('*,clients(lat,lng)')
      .eq('id', id).single()
    if (caseErr || !caseData) return NextResponse.json({ error: 'Case not found' }, { status: 404 })

    const client = Array.isArray(caseData.clients) ? caseData.clients[0] : caseData.clients
    const { data: providers } = await db.from('providers').select('*').eq('status', 'active')

    // care_level is the primary filter; fall back to personal_care if not set
    const careLevel = (caseData.care_level || 'personal_care') as CareLevel

    const matchInput = {
      care_level: careLevel,
      required_skills: caseData.required_skills || [],
      client_lat: client?.lat ?? null,
      client_lng: client?.lng ?? null,
      requires_car: caseData.requires_car,
      gender_preference: caseData.gender_preference,
      requires_meal_prep: caseData.requires_meal_prep,
      requires_total_care: caseData.requires_total_care,
      requires_wheelchair: caseData.requires_wheelchair,
      requires_hoyer_lift: caseData.requires_hoyer_lift,
      requires_spanish: caseData.requires_spanish,
    }

    // Run engine on the full provider pool, then cap to the top N for dispatch.
    const allResults = runMatchingEngine(providers ?? [], matchInput)
    const eligibleTotal = allResults.length
    const results = allResults.slice(0, MAX_MATCHES)

    // Clean up stale pending matches from previous runs that didn't make
    // the new top N. We only delete rows that are still 'pending' AND
    // never got notified — anything that's been dispatched, accepted,
    // or declined is left alone.
    const keepIds = new Set(results.map(r => r.provider_id))
    const { data: existingPending } = await db.from('case_matches')
      .select('id, provider_id')
      .eq('case_id', id)
      .eq('status', 'pending')
      .is('notified_at', null)

    const toDeleteIds = (existingPending ?? [])
      .filter(m => !keepIds.has(m.provider_id))
      .map(m => m.id)

    if (toDeleteIds.length > 0) {
      await db.from('case_matches').delete().in('id', toDeleteIds)
    }

    if (results.length > 0) {
      await db.from('case_matches').upsert(
        results.map(r => ({
          case_id: id, provider_id: r.provider_id, match_score: r.match_score,
          credential_match: r.credential_match,
          skill_match_count: r.skill_match_count, skill_match_pct: r.skill_match_pct,
          distance_miles: r.distance_miles,
          within_radius: r.within_radius, is_available: r.is_available,
          match_notes: r.match_notes, status: 'pending',
        })),
        { onConflict: 'case_id,provider_id', ignoreDuplicates: false }
      )
    }

    await db.from('cases').update({
      status: 'matching', updated_at: new Date().toISOString()
    }).eq('id', id)

    return NextResponse.json({
      matches: results.map(r => ({
        case_id: id, provider_id: r.provider_id, match_score: r.match_score,
        credential_match: r.credential_match,
        skill_match_count: r.skill_match_count, skill_match_pct: r.skill_match_pct,
        distance_miles: r.distance_miles, within_radius: r.within_radius,
        is_available: r.is_available, match_notes: r.match_notes,
        status: 'pending', providers: r.provider,
      })),
      total: results.length,
      eligible_total: eligibleTotal,
      max_matches: MAX_MATCHES,
      case_id: id,
      care_level: careLevel,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { provider_id } = await req.json()
    if (!provider_id) return NextResponse.json({ error: 'provider_id required' }, { status: 400 })
    const db = createServiceClient()
    await db.from('case_matches').update({ status: 'accepted' }).eq('case_id', id).eq('provider_id', provider_id)
    await db.from('case_matches').update({ status: 'declined' }).eq('case_id', id).neq('provider_id', provider_id).eq('status', 'pending')
    const { data, error } = await db.from('cases').update({
      assigned_provider_id: provider_id, status: 'assigned',
      updated_at: new Date().toISOString()
    }).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
