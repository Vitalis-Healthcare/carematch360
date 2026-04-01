import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, hold_reason, hold_note } = body
    const db = createServiceClient()

    const update: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'on_hold') {
      update.hold_reason  = hold_reason
      update.hold_note    = hold_note || null
      update.on_hold_at   = new Date().toISOString()
    }

    if (status === 'completed' || status === 'cancelled') {
      update.closed_at  = new Date().toISOString()
      if (hold_note) update.hold_note = hold_note
    }

    if (status === 'open') {
      // Reopen — clear hold fields
      update.hold_reason  = null
      update.hold_note    = null
      update.on_hold_at   = null
      update.closed_at    = null
    }

    if (status === 'assigned') {
      update.assigned_at = new Date().toISOString()
    }

    const { data, error } = await db.from('cases').update(update).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
