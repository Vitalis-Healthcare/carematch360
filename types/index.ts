// ── Credential types — what a provider IS ────────────────────
export type CredentialType = 'UA' | 'CNA' | 'GNA' | 'CMT' | 'LPN' | 'RN' | 'PT' | 'OT' | 'ST'

// ── Care levels — what a case/client NEEDS ───────────────────
export type CareLevel =
  | 'companion_care'
  | 'personal_care'
  | 'skilled_nursing'
  | 'physical_therapy'
  | 'occupational_therapy'
  | 'speech_therapy'

// ── Eligibility map: care level → which credentials can fill it
export const CARE_LEVEL_POOL: Record<CareLevel, CredentialType[]> = {
  companion_care:       ['UA','CNA','GNA','CMT','LPN','RN'],
  personal_care:        ['UA','CNA','GNA','CMT','LPN','RN'],
  skilled_nursing:      ['LPN','RN'],
  physical_therapy:     ['PT'],
  occupational_therapy: ['OT'],
  speech_therapy:       ['ST'],
}

export const CARE_LEVEL_LABELS: Record<CareLevel, string> = {
  companion_care:       'Companion Care',
  personal_care:        'Personal Care',
  skilled_nursing:      'Skilled Nursing',
  physical_therapy:     'Physical Therapy',
  occupational_therapy: 'Occupational Therapy',
  speech_therapy:       'Speech Therapy',
}

export const CARE_LEVEL_DESCRIPTIONS: Record<CareLevel, string> = {
  companion_care:       'Companionship, light housekeeping, errands — non-hands-on',
  personal_care:        'ADLs, bathing, dressing, feeding — includes all companion care',
  skilled_nursing:      'Wound care, medications, IV therapy, clinical assessment',
  physical_therapy:     'Mobility, strength, rehabilitation exercises',
  occupational_therapy: 'Daily living skills, adaptive equipment, fine motor',
  speech_therapy:       'Speech, language, swallowing, communication',
}

export const CARE_LEVELS: CareLevel[] = [
  'companion_care', 'personal_care', 'skilled_nursing',
  'physical_therapy', 'occupational_therapy', 'speech_therapy',
]

export const CREDENTIAL_TYPES: CredentialType[] = ['UA','CNA','GNA','CMT','LPN','RN','PT','OT','ST']

export const CREDENTIAL_LABELS: Record<CredentialType, string> = {
  UA:  'Unlicensed Aide',
  CNA: 'Certified Nursing Assistant',
  GNA: 'Geriatric Nursing Assistant',
  CMT: 'Certified Medication Technician',
  LPN: 'Licensed Practical Nurse',
  RN:  'Registered Nurse',
  PT:  'Physical Therapist',
  OT:  'Occupational Therapist',
  ST:  'Speech Therapist',
}

// Credential tier for display grouping
export const CREDENTIAL_GROUPS = [
  { label: 'Aides',   creds: ['UA','CNA','GNA','CMT'] as CredentialType[] },
  { label: 'Nursing', creds: ['LPN','RN'] as CredentialType[] },
  { label: 'Therapy', creds: ['PT','OT','ST'] as CredentialType[] },
]

export type UrgencyLevel = 'routine' | 'urgent' | 'emergency'
export type CaseStatus = 'lead' | 'open' | 'matching' | 'matched' | 'assigned' | 'on_hold' | 'completed' | 'cancelled'
export type ProviderStatus = 'active' | 'inactive' | 'suspended'
export type ScheduleType = 'one_time' | 'recurring' | 'flexible'
export type GenderPref = 'any' | 'male' | 'female'
export type DocType = 'doctors_order' | 'client_request' | 'authorization' | 'insurance' | 'assessment' | 'care_plan' | 'id' | 'other'

export interface Provider {
  id: string; name: string; phone: string|null; email: string|null
  address: string|null; city: string|null; state: string|null; zip: string|null
  lat: number|null; lng: number|null
  credential_type: CredentialType
  additional_credentials: CredentialType[]
  license_number: string|null; skills: string[]; preferred_days: string[]
  shift_preferences: string[]
  service_radius_miles: number; available: boolean; status: ProviderStatus
  has_car: boolean; gender: string
  meal_prep: boolean; total_care: boolean
  wheelchair_transfer: boolean; hoyer_lift: boolean; spanish_speaking: boolean
  notes: string|null; created_at: string; updated_at: string
}

export interface Client {
  id: string; name: string; address: string|null; city: string|null
  state: string|null; zip: string|null; lat: number|null; lng: number|null
  contact_name: string|null; contact_phone: string|null; contact_email: string|null
  required_credential: CredentialType|null
  additional_credentials: CredentialType[]
  required_skills: string[]
  care_needs: CareLevel[]          // what levels of care this client needs
  visit_frequency: string|null; urgency_level: UrgencyLevel
  payer_types: string[]
  status: string; notes: string|null
  gender_preference: GenderPref
  requires_car: boolean; requires_meal_prep: boolean; requires_total_care: boolean
  requires_wheelchair: boolean; requires_hoyer_lift: boolean; requires_spanish: boolean
  created_at: string; updated_at: string
}

export interface Case {
  id: string; client_id: string|null; title: string
  care_level: CareLevel             // what type of care this case requires
  required_credential: CredentialType|null  // optional override — usually derived from care_level
  required_skills: string[]
  urgency: UrgencyLevel
  schedule_type: ScheduleType
  visit_date: string|null; visit_time: string|null; duration_hours: number
  recurring_days: string[]; recurring_start: string|null; recurring_end: string|null
  flexible_hours_day: number|null; flexible_days_week: number|null; flexible_any_time: boolean
  payer_types: string[]
  gender_preference: GenderPref
  requires_car: boolean; requires_meal_prep: boolean; requires_total_care: boolean
  requires_wheelchair: boolean; requires_hoyer_lift: boolean; requires_spanish: boolean
  special_instructions: string|null; status: CaseStatus
  assigned_provider_id: string|null
  dispatched_at: string|null
  // ── v2.7.11: Vita lead integration ──
  vita_lead_id: string|null; vita_lead_status: string|null
  vita_lead_synced_at: string|null; allow_pre_dispatch: boolean
  created_at: string; updated_at: string
  clients?: Client; providers?: Provider
}

export interface CaseDocument {
  id: string; case_id: string; name: string; url: string
  file_type: string|null; file_size: number|null; doc_type: DocType
  uploaded_by: string|null; created_at: string
}

// Skills pool — unified clinical skills + attributes
// ── v2.7.13: added 10 "Personal Care & ADLs" items from Vitalis Plan of Care ──
export const ALL_SKILLS = [
  'Vent Care','Trach Care','Wound Care','G-Tube','IV Therapy','Catheter Care',
  'Colostomy Care','Feeding Tube','Oxygen Therapy','Medication Management','Vital Signs',
  'Pediatrics','Geriatrics','Dementia Care',"Alzheimer's",'Behavioral Health',
  'Autism','Developmental Disabilities','Hospice / Palliative','Oncology',
  'Cardiac Care','Diabetes Management','Stroke Recovery','Post-Surgical','Orthopedic',
  // Personal Care & ADLs (v2.7.13)
  'Bathing assistance (tub/shower)','Bedpan / commode assistance','Incontinence care',
  'Peri care','Feeding assistance','Dressing assistance','Oral hygiene & grooming',
  'Turn & reposition','Range of motion exercises','General ADL assistance',
  'Has a car','Meal preparation','Total care','Wheelchair transfer','Hoyer lift',
  'Spanish speaking','French speaking','Sign language',
  'Fall prevention','Ambulation assist','Transfer assist','Spinal care',
]

export const SKILL_TO_FLAG: Record<string,string> = {
  'Has a car':'has_car', 'Meal preparation':'meal_prep', 'Total care':'total_care',
  'Wheelchair transfer':'wheelchair_transfer', 'Hoyer lift':'hoyer_lift',
  'Spanish speaking':'spanish_speaking',
}

export const SKILL_TO_REQ: Record<string,string> = {
  'Has a car':'requires_car', 'Meal preparation':'requires_meal_prep',
  'Total care':'requires_total_care', 'Wheelchair transfer':'requires_wheelchair',
  'Hoyer lift':'requires_hoyer_lift', 'Spanish speaking':'requires_spanish',
}

export const DAYS_OF_WEEK = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

export const SHIFT_OPTIONS = [
  { value:'morning',   label:'Morning',   sub:'6am – 12pm' },
  { value:'afternoon', label:'Afternoon', sub:'12pm – 6pm' },
  { value:'evening',   label:'Evening',   sub:'6pm – 12am' },
  { value:'overnight', label:'Overnight', sub:'12am – 6am' },
]

export const PAYER_TYPES = [
  'Private Pay','Medicaid','Medicare','Medicaid Waiver',
  'CareFirst','Wellpoint','United Healthcare','Aetna','BCHD','Other Insurance',
]

export const DOC_TYPE_LABELS: Record<DocType,string> = {
  doctors_order:"Doctor's Order", client_request:'Client Request',
  authorization:'Authorization', insurance:'Insurance Document',
  assessment:'Assessment', care_plan:'Care Plan', id:'ID / Credential', other:'Other',
}
