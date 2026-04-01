import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = createServiceClient()

    const { data: matches } = await db
      .from('case_matches')
      .select('*,providers(id,name,credential_type,phone,email,city,state,shift_preferences,skills)')
      .eq('case_id', id)
      .order('match_score', { ascending: false })

    const { data: caseData } = await db
      .from('cases')
      .select('id,title,status,dispatched_at,assigned_provider_id')
      .eq('id', id).single()

    const summary = {
      total: matches?.length || 0,
      notified: matches?.filter(m => m.notified_at).length || 0,
      accepted: matches?.filter(m => m.status === 'accepted').length || 0,
      declined: matches?.filter(m => m.status === 'declined').length || 0,
      pending:  matches?.filter(m => m.status === 'notified').length || 0,
    }

    return NextResponse.json({ matches: matches || [], case: caseData, summary })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
