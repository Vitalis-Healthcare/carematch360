import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const db = createServiceClient()
  const [{ data: providers }, { data: clients }] = await Promise.all([
    db.from('providers').select('axiscare_id').not('axiscare_id', 'is', null),
    db.from('clients').select('axiscare_id').not('axiscare_id', 'is', null),
  ])
  return NextResponse.json({
    provider_ids: (providers ?? []).map(p => p.axiscare_id),
    client_ids: (clients ?? []).map(c => c.axiscare_id),
  })
}
