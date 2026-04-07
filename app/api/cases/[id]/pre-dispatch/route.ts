import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/cases/[id]/pre-dispatch
// Body: { allow: boolean }
//
// Coordinator-controlled gate that lets a lead-status case bypass the
// silent-by-default dispatch lockout. Used for high-confidence leads
// where we want to lock in provider availability before the deal closes.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const allow = body?.allow === true

    const db = createServiceClient()
    const { data, error } = await db
      .from('cases')
      .update({
        allow_pre_dispatch: allow,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, allow_pre_dispatch, status')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
