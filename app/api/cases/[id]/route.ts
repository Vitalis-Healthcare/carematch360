import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const db = createServiceClient()
    const { data, error } = await db.from('cases').update({
      title:body.title, client_id:body.client_id||null,
      care_level:body.care_level||'personal_care',
      required_credential:body.required_credential||null,
      required_skills:body.required_skills||[],
      urgency:body.urgency||'routine',
      schedule_type:body.schedule_type||'one_time',
      visit_date:body.visit_date||null, visit_time:body.visit_time||null,
      duration_hours:body.duration_hours||1,
      recurring_days:body.recurring_days||[],
      recurring_start:body.recurring_start||null, recurring_end:body.recurring_end||null,
      flexible_hours_day:body.flexible_hours_day||null,
      flexible_days_week:body.flexible_days_week||null,
      flexible_any_time:body.flexible_any_time??false,
      payer_types:body.payer_types||[],
      requires_car:body.requires_car??false,
      gender_preference:body.gender_preference||'any',
      requires_meal_prep:body.requires_meal_prep??false,
      requires_total_care:body.requires_total_care??false,
      requires_wheelchair:body.requires_wheelchair??false,
      requires_hoyer_lift:body.requires_hoyer_lift??false,
      requires_spanish:body.requires_spanish??false,
      special_instructions:body.special_instructions||null,
      updated_at:new Date().toISOString(),
    }).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
