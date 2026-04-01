import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('cm360_session')?.value
  if (sessionToken) {
    const db = createServiceClient()
    await db.from('auth_sessions').delete().eq('session_token', sessionToken)
  }
  const res = NextResponse.redirect(new URL('/login', req.url), { status: 303 })
  res.cookies.delete('cm360_session')
  return res
}
