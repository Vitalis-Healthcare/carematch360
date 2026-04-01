import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300 // 5 minutes
import { createServiceClient } from '@/lib/supabase/server'
import { geocodeAddress, cityFallback } from '@/lib/geocoding'

// Map AxisCare class codes/labels to CareMatch360 credential types
const CLASS_TO_CREDENTIAL: Record<string,string> = {
  // Registered Nurse
  'RN': 'RN', 'REGISTERED NURSE': 'RN',
  // Licensed Practical Nurse
  'LPN': 'LPN', 'LICENSED PRACTICAL NURSE': 'LPN', 'LVN': 'LPN',
  // Certified Nursing Assistant
  'CNA': 'CNA', 'CERTIFIED NURSING ASSISTANT': 'CNA',
  // Geriatric Nursing Assistant
  'GNA': 'GNA', 'GERIATRIC NURSING ASSISTANT': 'GNA',
  // Certified Medication Technician
  'CMT': 'CMT', 'CERTIFIED MEDICATION TECHNICIAN': 'CMT', 'MED TECH': 'CMT', 'MEDICATION TECHNICIAN': 'CMT',
  // Unlicensed Aide — maps explicitly
  'UA': 'UA', 'UNLICENSED AIDE': 'UA', 'UNLICENSED': 'UA',
  'HHA': 'UA', 'HOME HEALTH AIDE': 'UA',   // HHA in AxisCare is typically unlicensed
  'PCA': 'UA', 'PERSONAL CARE AIDE': 'UA', 'COMPANION': 'UA', 'HCA': 'UA',
  // Therapists
  'PT': 'PT', 'PHYSICAL THERAPIST': 'PT', 'PHYSICAL THERAPY': 'PT',
  'OT': 'OT', 'OCCUPATIONAL THERAPIST': 'OT', 'OCCUPATIONAL THERAPY': 'OT',
  'ST': 'ST', 'SPEECH THERAPIST': 'ST', 'SPEECH THERAPY': 'ST', 'SLP': 'ST',
}

function mapCredential(classes: any[]): string {
  // Try to map explicitly first
  if (classes && classes.length > 0) {
    for (const cls of classes) {
      const key = (cls.code || cls.label || '').toUpperCase().trim()
      const mapped = CLASS_TO_CREDENTIAL[key]
      if (mapped) return mapped  // use whatever it maps to (UA, CNA, GNA, CMT, RN, LPN, PT, OT, ST)
    }
  }
  // No class info — default to CNA (most common licensed aide at Vitalis)
  return 'CNA'
}

function mapGender(g: string | null): string {
  if (!g) return 'unspecified'
  const upper = g.toUpperCase()
  if (upper === 'M' || upper === 'MALE') return 'male'
  if (upper === 'F' || upper === 'FEMALE') return 'female'
  return 'unspecified'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, records, credentialOverrides } = body
    // type: 'caregivers' | 'clients'
    // records: AxisCare records to import
    // credentialOverrides: { [axiscareId]: credentialType } — user-selected overrides

    if (!type || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const db = createServiceClient()
    const results = { imported: 0, updated: 0, skipped: 0, errors: [] as string[] }
    const newProviders: { id: string; name: string; credential_type: string }[] = []
    const logRows: any[] = []

    for (const record of records) {
      try {
        if (type === 'caregivers') {
          const credType = credentialOverrides?.[record.id] || mapCredential(record.classes)
          // credType is always at minimum 'CNA' — no need to skip

          const addr = record.mailingAddress || {}
          let geo: { lat: number; lng: number } | null = null // geocoding done via /admin/geocode

          const phone = record.mobilePhone || record.homePhone || record.otherPhone || null
          const payload = {
            name: `${record.firstName} ${record.lastName}`.trim(),
            phone, email: record.email || null,
            address: addr.streetAddress1 || null,
            city: addr.city || null,
            state: addr.state || addr.region || 'MD',
            zip: addr.postalCode || null,
            lat: null, lng: null,
            credential_type: credType,
            additional_credentials: [],
            license_number: null,
            skills: [], preferred_days: [],
            shift_preferences: [],
            service_radius_miles: 15,
            available: record.status?.active ?? true,
            status: record.status?.active ? 'active' : 'inactive',
            gender: mapGender(record.gender),
            has_car: false, meal_prep: false, total_care: false,
            wheelchair_transfer: false, hoyer_lift: false, spanish_speaking: false,
            notes: `Imported from AxisCare (ID: ${record.id})`,
            axiscare_id: record.id,
          }

          // Upsert on axiscare_id
          const existing = await db.from('providers').select('id').eq('axiscare_id', record.id).maybeSingle()
          let carematchId: string | null = null

          if (existing.data) {
            const { data, error } = await db.from('providers').update({ ...payload, updated_at: new Date().toISOString() }).eq('axiscare_id', record.id).select('id').single()
            if (error) throw new Error(error.message)
            carematchId = data.id
            results.updated++
            logRows.push({ entity_type:'caregiver', axiscare_id:record.id, axiscare_name:`${record.firstName} ${record.lastName}`, carematch_id:carematchId, action:'updated' })
          } else {
            const { data, error } = await db.from('providers').insert(payload).select('id').single()
            if (error) throw new Error(error.message)
            carematchId = data.id
            results.imported++
            newProviders.push({ id: carematchId!, name: payload.name, credential_type: payload.credential_type })
            logRows.push({ entity_type:'caregiver', axiscare_id:record.id, axiscare_name:`${record.firstName} ${record.lastName}`, carematch_id:carematchId, action:'imported' })
          }

        } else if (type === 'clients') {
          const addr = record.residentialAddress || {}
          let geo: { lat: number; lng: number } | null = null // geocoding done via /admin/geocode

          const phone = record.mobilePhone || record.homePhone || null
          const payload = {
            name: `${record.firstName} ${record.lastName}`.trim(),
            address: addr.streetAddress1 || null,
            city: addr.city || null,
            state: addr.state || addr.region || 'MD',
            zip: addr.postalCode || null,
            lat: null, lng: null,
            contact_name: null, contact_phone: phone, contact_email: record.personalEmail || null,
            required_credential: null,
            additional_credentials: [],
            required_skills: [],
            visit_frequency: null,
            urgency_level: 'routine',
            payer_types: record.medicaidNumber ? ['Medicaid'] : [],
            gender_preference: 'any',
            status: record.status?.active ? 'active' : 'inactive',
            notes: `Imported from AxisCare (ID: ${record.id})${record.priorityNote ? ' — ' + record.priorityNote : ''}`,
            requires_car: false, requires_meal_prep: false, requires_total_care: false,
            requires_wheelchair: false, requires_hoyer_lift: false, requires_spanish: false,
            axiscare_id: record.id,
          }

          const existing = await db.from('clients').select('id').eq('axiscare_id', record.id).maybeSingle()
          let carematchId: string | null = null

          if (existing.data) {
            const { data, error } = await db.from('clients').update({ ...payload, updated_at: new Date().toISOString() }).eq('axiscare_id', record.id).select('id').single()
            if (error) throw new Error(error.message)
            carematchId = data.id
            results.updated++
            logRows.push({ entity_type:'client', axiscare_id:record.id, axiscare_name:`${record.firstName} ${record.lastName}`, carematch_id:carematchId, action:'updated' })
          } else {
            const { data, error } = await db.from('clients').insert(payload).select('id').single()
            if (error) throw new Error(error.message)
            carematchId = data.id
            results.imported++
            logRows.push({ entity_type:'client', axiscare_id:record.id, axiscare_name:`${record.firstName} ${record.lastName}`, carematch_id:carematchId, action:'imported' })
          }
        }
      } catch (err: any) {
        results.skipped++
        results.errors.push(`${record.firstName} ${record.lastName}: ${err.message}`)
        logRows.push({ entity_type:type==='caregivers'?'caregiver':'client', axiscare_id:record.id, axiscare_name:`${record.firstName} ${record.lastName}`, action:'error', error_message:err.message })
      }
    }

    // Write sync log
    if (logRows.length > 0) {
      await db.from('axiscare_sync_log').upsert(logRows, { onConflict: 'entity_type,axiscare_id', ignoreDuplicates: false })
    }

    return NextResponse.json({ ...results, total: records.length, newProviders })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
