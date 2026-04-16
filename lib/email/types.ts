/**
 * Shared type for applicant data consumed by both the email HTML
 * builder and the PDF renderer. Populated in /api/providers/apply.
 *
 * All fields are kept nullable-ish (string | null | undefined) so the
 * templates can render "—" for missing values rather than throwing.
 */

export type ApplicantData = {
  // Identity
  id: string
  name: string
  email: string
  phone: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  gender?: string | null

  // Credentials
  credential_type: string
  additional_credentials: string[]
  license_number?: string | null
  years_experience?: string | number | null

  // Availability
  shift_preferences: string[]
  preferred_days: string[]
  service_radius_miles?: number | null

  // Capability flags (mirrors six boolean columns)
  capabilities: {
    has_car: boolean
    spanish_speaking: boolean
    meal_prep: boolean
    total_care: boolean
    wheelchair_transfer: boolean
    hoyer_lift: boolean
  }

  // Free-text notes (with [APPLICATION] prefix stripped)
  notes?: string | null

  // Skills (full taxonomy — display-string values only)
  skills: string[]

  // Metadata
  submitted_at: Date
}

// Grouping of the 47 canonical skills from types/index.ts → ALL_SKILLS.
// Used to organize the Skills section of the email and PDF.
// Each skill must exist in ALL_SKILLS or it will be dropped (unknown skills
// render in an "Other" group at the bottom for safety).

export const SKILL_GROUPS: { label: string; skills: string[] }[] = [
  {
    label: 'Clinical Skills',
    skills: [
      'Vent Care', 'Trach Care', 'Wound Care', 'G-Tube', 'IV Therapy',
      'Catheter Care', 'Colostomy Care', 'Feeding Tube', 'Oxygen Therapy',
      'Medication Management', 'Vital Signs',
    ],
  },
  {
    label: 'Specialties',
    skills: [
      'Pediatrics', 'Geriatrics', 'Dementia Care', "Alzheimer's",
      'Behavioral Health', 'Autism', 'Developmental Disabilities',
      'Hospice / Palliative', 'Oncology', 'Cardiac Care',
      'Diabetes Management', 'Stroke Recovery', 'Post-Surgical',
      'Orthopedic', 'Spinal care',
    ],
  },
  {
    label: 'Personal Care & ADLs',
    skills: [
      'Bathing assistance (tub/shower)', 'Bedpan / commode assistance',
      'Incontinence care', 'Peri care', 'Feeding assistance',
      'Dressing assistance', 'Oral hygiene & grooming',
      'Turn & reposition', 'Range of motion exercises',
      'General ADL assistance',
    ],
  },
  {
    label: 'Mobility & Care Attributes',
    skills: [
      'Total care', 'Wheelchair transfer', 'Hoyer lift',
      'Fall prevention', 'Ambulation assist', 'Transfer assist',
    ],
  },
  {
    label: 'Languages & Transport',
    skills: [
      'Spanish speaking', 'French speaking', 'Sign language', 'Has a car',
    ],
  },
  {
    label: 'Nutrition',
    skills: ['Meal preparation'],
  },
]

/**
 * Group a flat skills array by the canonical taxonomy. Returns only
 * groups that contain at least one matching skill. Unknown skills are
 * collected into a final "Other" group.
 */
export function groupSkills(skills: string[]): { label: string; skills: string[] }[] {
  if (!skills || skills.length === 0) return []

  const knownSkills = new Set<string>()
  SKILL_GROUPS.forEach(g => g.skills.forEach(s => knownSkills.add(s)))

  const out: { label: string; skills: string[] }[] = []
  for (const group of SKILL_GROUPS) {
    const present = group.skills.filter(s => skills.includes(s))
    if (present.length > 0) out.push({ label: group.label, skills: present })
  }

  const other = skills.filter(s => !knownSkills.has(s))
  if (other.length > 0) out.push({ label: 'Other', skills: other })

  return out
}

/**
 * Strip the "[APPLICATION] Years exp: X" prefix that the apply route
 * currently prepends to notes. Returns the raw applicant text or null.
 */
export function stripNotesPrefix(notes: string | null | undefined): string | null {
  if (!notes) return null
  // Pattern: "[APPLICATION] Years exp: <value>" optionally followed by "\n\n<rest>"
  const match = notes.match(/^\[APPLICATION\] Years exp: [^\n]*(?:\n\n([\s\S]*))?$/)
  if (match) {
    return match[1]?.trim() || null
  }
  return notes
}

/**
 * Format display labels for the six capability flags.
 */
export const CAPABILITY_LABELS: { key: keyof ApplicantData['capabilities']; label: string }[] = [
  { key: 'has_car', label: 'Has a car' },
  { key: 'spanish_speaking', label: 'Spanish speaking' },
  { key: 'meal_prep', label: 'Meal preparation' },
  { key: 'total_care', label: 'Total care' },
  { key: 'wheelchair_transfer', label: 'Wheelchair transfer' },
  { key: 'hoyer_lift', label: 'Hoyer lift' },
]

/**
 * Prettify a shift value (e.g., 'morning' → 'Morning').
 */
export function prettifyShift(s: string): string {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

/**
 * Prettify gender column value (e.g., 'non_binary' → 'Non-binary').
 */
export function prettifyGender(g: string | null | undefined): string {
  if (!g) return '—'
  const map: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    non_binary: 'Non-binary',
    unspecified: 'Prefer not to say',
  }
  return map[g] || g
}
