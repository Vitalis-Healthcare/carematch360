import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { token, type } = await req.json()
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

    const db = createServiceClient()
    const now = new Date().toISOString()

    // Look up token
    const { data: authToken } = await db
      .from('auth_tokens')
      .select('*')
      .eq('token', token.trim())
      .is('used_at', null)
      .gt('expires_at', now)
      .single()

    if (!authToken) {
      return NextResponse.json({ error: 'Invalid or expired code. Please request a new one.' }, { status: 401 })
    }

    // Mark token as used
    await db.from('auth_tokens').update({ used_at: now }).eq('id', authToken.id)

    // Get user details
    let role = 'provider'
    let userName = ''
    if (authToken.user_type === 'staff') {
      const { data: staff } = await db.from('staff_users').select('role, full_name').eq('id', authToken.user_id).single()
      role = staff?.role ?? 'coordinator'
      userName = staff?.full_name ?? ''
      await db.from('staff_users').update({ last_login: now }).eq('id', authToken.user_id)
    } else {
      const { data: provider } = await db.from('providers').select('name').eq('id', authToken.user_id).single()
      userName = provider?.name ?? ''
    }

    // Create session
    const sessionToken = randomBytes(48).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await db.from('auth_sessions').insert({
      session_token: sessionToken,
      user_type: authToken.user_type,
      user_id: authToken.user_id,
      role,
      expires_at: expiresAt.toISOString(),
    })

    // Set cookie + return redirect
    const redirectTo = authToken.user_type === 'provider' ? '/provider/dashboard' : '/dashboard'
    const res = NextResponse.json({ success: true, redirect: redirectTo, role, userName })
    res.cookies.set('cm360_session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })
    return res
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
