import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json()
    if (!ids?.length) return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })

    const db = createServiceClient()
    const { data, error } = await db
      .from('providers')
      .update({ status: 'active', available: true })
      .in('id', ids)
      .select('id, name, credential_type')

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, activated: data?.length ?? 0, providers: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
