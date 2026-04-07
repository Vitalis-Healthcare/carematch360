// ═════════════════════════════════════════════════════════════════════════
// Vita lead → CareMatch360 mapping
// Used by /api/webhooks/vita-lead to convert incoming Vita lead payloads
// into the shape our `clients` and `cases` tables expect.
// ═════════════════════════════════════════════════════════════════════════

export interface VitaLeadPayload {
  id: string                 // Vita lead UUID — used as cross-reference
  full_name: string          // enquirer (may differ from care recipient)
  client_name?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  date_of_birth?: string | null
  status: string             // 'new' | 'contacted' | ... | 'won' | 'lost'
  source?: string | null
  relationship?: string | null
  care_types?: string[] | null
  condition_notes?: string | null
  preferred_schedule?: string | null
  estimated_hours_week?: number | null
  hourly_rate?: number | null
  expected_start_date?: string | null
  expected_close_date?: string | null
  notes?: string | null
}

// Vita care_types array is a mix of service types AND payer types.
// Split them into the right CareMatch360 buckets.
const VITA_CARE_TYPE_TO_LEVEL: Record<string, string> = {
  personal_care:      'personal_care',
  companion:          'companion_care',
  companion_care:     'companion_care',
  skilled_nursing:    'skilled_nursing',
  // these all collapse into personal_care for matching purposes —
  // coordinator can refine after conversion
  respite:            'personal_care',
  overnight:          'personal_care',
  live_in:            'personal_care',
  bchd_personal_care: 'personal_care',
  bchd_chore:         'companion_care',
}

const VITA_PAYER_TYPES = new Set([
  'medicaid_waiver', 'genworth', 'private_pay', 'other_ltc',
  'bchd_personal_care', 'bchd_chore', // BCHD entries are also payers
])

const VITA_PAYER_TO_CM360: Record<string, string> = {
  medicaid_waiver:    'medicaid_waiver',
  genworth:           'private_pay',     // Genworth is private LTC insurance
  private_pay:        'private_pay',
  other_ltc:          'private_pay',
  bchd_personal_care: 'bchd',
  bchd_chore:         'bchd',
}

function normalizeKey(s: string): string {
  return s.toLowerCase().trim().replace(/[\s-]+/g, '_')
}

export function deriveCareLevel(careTypes: string[] | null | undefined): string {
  if (!careTypes || careTypes.length === 0) return 'personal_care'
  for (const ct of careTypes) {
    const k = normalizeKey(ct)
    if (VITA_CARE_TYPE_TO_LEVEL[k]) return VITA_CARE_TYPE_TO_LEVEL[k]
  }
  return 'personal_care'
}

export function derivePayerTypes(careTypes: string[] | null | undefined): string[] {
  if (!careTypes || careTypes.length === 0) return []
  const out = new Set<string>()
  for (const ct of careTypes) {
    const k = normalizeKey(ct)
    if (VITA_PAYER_TYPES.has(k) && VITA_PAYER_TO_CM360[k]) {
      out.add(VITA_PAYER_TO_CM360[k])
    }
  }
  return [...out]
}

// Build the special_instructions string from anything Vita captured that
// doesn't have a clean mapping into CareMatch360's structured fields.
// Coordinator will read this when refining the case.
export function buildSpecialInstructions(p: VitaLeadPayload): string {
  const parts: string[] = []
  parts.push(`[Imported from Vita lead]`)
  if (p.relationship)        parts.push(`Enquirer: ${p.full_name} (${p.relationship.replace(/_/g, ' ')})`)
  if (p.care_types?.length)  parts.push(`Care types requested: ${p.care_types.join(', ')}`)
  if (p.estimated_hours_week) parts.push(`Estimated hours/week: ${p.estimated_hours_week}`)
  if (p.hourly_rate)         parts.push(`Quoted rate: $${p.hourly_rate}/hr`)
  if (p.preferred_schedule)  parts.push(`Preferred schedule: ${p.preferred_schedule}`)
  if (p.expected_start_date) parts.push(`Expected start date: ${p.expected_start_date}`)
  if (p.condition_notes)     parts.push(`\nSituation notes:\n${p.condition_notes}`)
  if (p.notes)               parts.push(`\nGeneral notes:\n${p.notes}`)
  return parts.join('\n')
}

export function buildClientPayload(p: VitaLeadPayload) {
  const recipientName = (p.client_name && p.client_name.trim()) || p.full_name
  const enquirerDifferent = !!(p.client_name && p.client_name.trim() && p.client_name.trim() !== p.full_name)

  return {
    name:           recipientName,
    address:        p.address || null,
    city:           p.city || null,
    state:          p.state || 'MD',
    zip:            p.zip || null,
    contact_name:   enquirerDifferent ? p.full_name : null,
    contact_phone:  p.phone || null,
    contact_email:  p.email || null,
    date_of_birth:  p.date_of_birth || null,
    vita_lead_id:   p.id,
    status:         'active',
    care_needs:     [deriveCareLevel(p.care_types)],
    payer_types:    derivePayerTypes(p.care_types),
    notes:          p.condition_notes || null,
    urgency_level:  'routine',
  }
}

export function buildCasePayload(p: VitaLeadPayload, clientId: string) {
  const recipientName = (p.client_name && p.client_name.trim()) || p.full_name
  const careTypeLabel = (p.care_types && p.care_types[0]) || 'Care'
  return {
    title:                `${recipientName} — ${careTypeLabel.replace(/_/g, ' ')}`,
    client_id:            clientId,
    care_level:           deriveCareLevel(p.care_types),
    required_credential:  null,
    required_skills:      [],
    urgency:              'routine',
    schedule_type:        'flexible',
    flexible_hours_day:   p.estimated_hours_week ? Math.round((p.estimated_hours_week / 7) * 10) / 10 : null,
    flexible_days_week:   p.estimated_hours_week && p.estimated_hours_week >= 35 ? 7 : 5,
    payer_types:          derivePayerTypes(p.care_types),
    special_instructions: buildSpecialInstructions(p),
    status:               'lead',
    vita_lead_id:         p.id,
    vita_lead_status:     p.status,
    vita_lead_synced_at:  new Date().toISOString(),
    allow_pre_dispatch:   false,
  }
}
