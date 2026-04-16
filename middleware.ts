import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/login', '/provider/login', '/auth/verify', '/api/auth/',
  '/getcare', '/apply', '/respond', '/api/respond',
  '/api/clients/inquire', '/api/providers/apply', '/thank-you',
  // ── v2.7.11a: webhook endpoints are authenticated by HMAC signature,
  // not by session cookie, so they need to bypass the auth middleware ──
  '/api/webhooks/',
  // ── v2.7.12a: public compliance pages for A2P 10DLC (Twilio) —
  // must be reachable by TCR reviewers without a login. ──
  '/privacy', '/sms-terms',
  // ── v2.7.15-a: shared branding assets (logo, etc.) — referenced
  // from transactional emails rendered by external clients (Gmail
  // image proxy, Outlook, Apple Mail), so they must be publicly
  // fetchable without a session. Served from /public/branding/. ──
  '/branding/',
  '/_next', '/favicon',
]

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const { pathname } = req.nextUrl

  // Subdomain routing — exclude /api/ and /thank-you so they reach their own handlers
  if (host.startsWith('getcare.') && !pathname.startsWith('/api/') && !pathname.startsWith('/thank-you')) {
    return NextResponse.rewrite(new URL('/getcare', req.url))
  }
  if (host.startsWith('apply.') && !pathname.startsWith('/api/') && !pathname.startsWith('/thank-you')) {
    return NextResponse.rewrite(new URL('/apply', req.url))
  }

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check session cookie
  const sessionToken = req.cookies.get('cm360_session')?.value
  if (!sessionToken) {
    const isProvider = pathname.startsWith('/provider/')
    return NextResponse.redirect(new URL(isProvider ? '/provider/login' : '/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
