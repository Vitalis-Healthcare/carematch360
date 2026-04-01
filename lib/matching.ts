import { Provider, CareLevel, CARE_LEVEL_POOL } from '@/types'

function toRad(d: number) { return d * Math.PI / 180 }

export function haversineDistance(lat1:number,lon1:number,lat2:number,lon2:number):number {
  const R=3958.8, dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1)
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}

export interface MatchInput {
  care_level: CareLevel          // primary filter — determines eligible credential pool
  required_skills: string[]
  client_lat?: number|null
  client_lng?: number|null
  requires_car?: boolean
  gender_preference?: string
  requires_meal_prep?: boolean
  requires_total_care?: boolean
  requires_wheelchair?: boolean
  requires_hoyer_lift?: boolean
  requires_spanish?: boolean
}

export interface MatchResult {
  provider_id: string
  provider: Provider
  match_score: number
  credential_match: boolean
  skill_match_count: number
  skill_match_pct: number
  distance_miles: number|null
  within_radius: boolean
  is_available: boolean
  flag_failures: string[]
  match_notes: string
}

export function scoreProvider(provider: Provider, input: MatchInput): MatchResult | null {
  if (provider.status !== 'active') return null

  // ── Core filter: is this provider's credential eligible for this care level? ──
  const eligiblePool = CARE_LEVEL_POOL[input.care_level]
  const allCreds = [provider.credential_type, ...(provider.additional_credentials || [])]
  const credentialMatch = allCreds.some(c => eligiblePool.includes(c as any))
  if (!credentialMatch) return null

  // ── Hard filter: capability flags ────────────────────────────────────────────
  const flagFailures: string[] = []
  if (input.requires_car         && !provider.has_car)             flagFailures.push('No car')
  if (input.requires_meal_prep   && !provider.meal_prep)           flagFailures.push('No meal prep')
  if (input.requires_total_care  && !provider.total_care)          flagFailures.push('No total care')
  if (input.requires_wheelchair  && !provider.wheelchair_transfer) flagFailures.push('No wheelchair transfer')
  if (input.requires_hoyer_lift  && !provider.hoyer_lift)          flagFailures.push('No hoyer lift')
  if (input.requires_spanish     && !provider.spanish_speaking)    flagFailures.push('Not Spanish-speaking')
  if (input.gender_preference && input.gender_preference !== 'any' &&
      provider.gender !== 'unspecified' && provider.gender !== input.gender_preference) {
    flagFailures.push(`Gender: needs ${input.gender_preference}`)
  }
  if (flagFailures.length > 0) return null

  // ── Scoring ───────────────────────────────────────────────────────────────────
  const requiredSkills = input.required_skills || []
  const skillMatchCount = requiredSkills.filter(s => (provider.skills||[]).includes(s)).length
  const skillMatchPct = requiredSkills.length > 0 ? skillMatchCount / requiredSkills.length : 1.0

  let distanceMiles: number|null = null
  let withinRadius = true
  let proximityScore = 50

  if (provider.lat!=null && provider.lng!=null && input.client_lat!=null && input.client_lng!=null) {
    distanceMiles = haversineDistance(provider.lat, provider.lng, input.client_lat!, input.client_lng!)
    withinRadius = distanceMiles <= provider.service_radius_miles
    if (!withinRadius) return null
    proximityScore = Math.max(0, Math.round(50 * (1 - distanceMiles / provider.service_radius_miles)))
  }

  // Bonus: exact credential match within the eligible pool (e.g. RN for skilled nursing)
  // vs. a higher credential covering a lower care level (e.g. RN for personal care)
  const exactCredMatch = allCreds.includes(provider.credential_type as any)
  const skillScore  = Math.round(skillMatchPct * 30)
  const availScore  = provider.available ? 20 : 0
  const totalScore  = proximityScore + skillScore + availScore

  const notes: string[] = []
  if (distanceMiles!=null) notes.push(`${distanceMiles.toFixed(1)} mi`)
  if (requiredSkills.length>0) notes.push(`${skillMatchCount}/${requiredSkills.length} skills`)
  if (!provider.available) notes.push('unavailable')

  return {
    provider_id: provider.id, provider,
    match_score: totalScore,
    credential_match: true,
    skill_match_count: skillMatchCount,
    skill_match_pct: skillMatchPct,
    distance_miles: distanceMiles,
    within_radius: withinRadius,
    is_available: provider.available,
    flag_failures: flagFailures,
    match_notes: notes.join(' · '),
  }
}

export function runMatchingEngine(providers: Provider[], input: MatchInput): MatchResult[] {
  const results: MatchResult[] = []
  for (const p of providers) {
    const r = scoreProvider(p, input)
    if (r) results.push(r)
  }
  results.sort((a, b) => {
    if (b.match_score !== a.match_score) return b.match_score - a.match_score
    if (b.is_available !== a.is_available) return b.is_available ? 1 : -1
    if (a.distance_miles!=null && b.distance_miles!=null) return a.distance_miles - b.distance_miles
    return 0
  })
  return results
}

export function getScoreColor(score:number):string {
  if (score>=80) return '#10B981'
  if (score>=60) return '#F59E0B'
  if (score>=40) return '#EF4444'
  return '#94A3B8'
}

export function getScoreLabel(score:number):string {
  if (score>=80) return 'Excellent'
  if (score>=60) return 'Good'
  if (score>=40) return 'Fair'
  return 'Weak'
}
