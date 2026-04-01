import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(['provider'])
    const { available } = await req.json()
    const db = createServiceClient()
    await db.from('providers').update({ available }).eq('id', session.userId)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
