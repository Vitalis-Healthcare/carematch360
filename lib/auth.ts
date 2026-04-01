import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { cache } from 'react'

export interface Session {
  userId: string
  userType: 'staff' | 'provider'
  role: 'admin' | 'coordinator' | 'provider'
  sessionToken: string
}

export const getSession = cache(async (): Promise<Session | null> => {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('cm360_session')?.value
    if (!sessionToken) return null

    const db = createServiceClient()
    const now = new Date().toISOString()

    const { data } = await db
      .from('auth_sessions')
      .select('user_id, user_type, role')
      .eq('session_token', sessionToken)
      .gt('expires_at', now)
      .single()

    if (!data) return null

    return {
      userId: data.user_id,
      userType: data.user_type,
      role: data.role as Session['role'],
      sessionToken,
    }
  } catch {
    return null
  }
})

export async function requireAuth(allowedRoles?: string[]): Promise<Session> {
  const session = await getSession()
  if (!session) throw new Error('UNAUTHENTICATED')
  if (allowedRoles && !allowedRoles.includes(session.role)) throw new Error('UNAUTHORIZED')
  return session
}
