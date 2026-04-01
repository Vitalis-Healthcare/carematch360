import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { geocodeAddress, cityFallback } from '@/lib/geocoding'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const db = createServiceClient()
    let geo = await geocodeAddress(body.address, body.city, body.state, body.zip)
    if (geo.lat == null) geo = cityFallback(body.city, body.state)
    const { data, error } = await db.from('providers').update({
      name:body.name, phone:body.phone||null, email:body.email||null,
      address:body.address||null, city:body.city||null, state:body.state||null, zip:body.zip||null,
      lat:geo.lat, lng:geo.lng,
      credential_type:body.credential_type, license_number:body.license_number||null,
      additional_credentials:body.additional_credentials||[],
      skills:body.skills||[], preferred_days:body.preferred_days||[],
      shift_preferences:body.shift_preferences||[],
      service_radius_miles:body.service_radius_miles||15,
      available:body.available??true, status:body.status||'active',
      gender:body.gender||'unspecified',
      has_car:body.has_car??false, meal_prep:body.meal_prep??false,
      total_care:body.total_care??false, wheelchair_transfer:body.wheelchair_transfer??false,
      hoyer_lift:body.hoyer_lift??false, spanish_speaking:body.spanish_speaking??false,
      notes:body.notes||null, updated_at:new Date().toISOString(),
    }).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = createServiceClient()
    const { error } = await db.from('providers').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ deleted: true })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
