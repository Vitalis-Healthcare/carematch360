import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { geocodeAddress, cityFallback } from '@/lib/geocoding'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const db = createServiceClient()
    let geo = await geocodeAddress(body.address, body.city, body.state, body.zip)
    if (geo.lat == null) geo = cityFallback(body.city, body.state)
    const { data, error } = await db.from('clients').insert({
      name:body.name, address:body.address||null, city:body.city||null,
      state:body.state||null, zip:body.zip||null, lat:geo.lat, lng:geo.lng,
      contact_name:body.contact_name||null, contact_phone:body.contact_phone||null, contact_email:body.contact_email||null,
      required_credential:body.required_credential||null,
      care_needs:body.care_needs||[],
      additional_credentials:body.additional_credentials||[],
      required_skills:body.required_skills||[],
      visit_frequency:body.visit_frequency||null, urgency_level:body.urgency_level||'routine',
      payer_types:body.payer_types||[], gender_preference:body.gender_preference||'any',
      status:body.status||'active', notes:body.notes||null,
      requires_car:body.requires_car??false, requires_meal_prep:body.requires_meal_prep??false,
      requires_total_care:body.requires_total_care??false, requires_wheelchair:body.requires_wheelchair??false,
      requires_hoyer_lift:body.requires_hoyer_lift??false, requires_spanish:body.requires_spanish??false,
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
