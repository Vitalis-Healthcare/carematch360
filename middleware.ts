import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/login', '/provider/login', '/auth/verify', '/api/auth/',
  '/getcare', '/apply', '/respond', '/api/respond',
  '/api/clients/inquire', '/api/providers/apply', '/thank-you',
  // ── v2.7.11a: webhook endpoints are authenticated by HMAC signature,
  //    not by session cookie, so they need to bypass the auth middleware ──
  '/api/webhooks/',
  // ── v2.7.12a: public compliance pages for A2P 10DLC (Twilio) —
  //    must be reachable by TCR reviewers without a login. ──
  '/privacy', '/sms-terms',
  // ── v2.7.15-a: shared branding assets (logo, etc.) — referenced
  //    from transactional emails rendered by external clients (Gmail
  //    image proxy, Outlook, Apple Mail), so they must be publicly
  //    fetchable without a session. Served from /public/branding/. ──
  '/branding/',
  // ── v2.7.23: read-only aggregate stats for the Vitalis Portal
  //    "Thursday Brief". Authenticated by the VITA_STATS_SECRET bearer
  //    token, not by session cookie, so it must bypass the auth check. ──
  '/api/stats',
  '/_next', '/favicon',
]

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const { pathname } = req.nextUrl

  // ── Subdomain routing ─────────────────────────────────────────
  // /api/ and /thank-you are excluded so they reach their own route
  // handlers regardless of host.
  //
  // v2.7.19: /privacy and /sms-terms are ALSO excluded from the
  // apply.* rewrite so they're reachable on apply.vitalishealthcare.com
  // for A2P 10DLC vetters. Hosting the consent page (apply.*) and the
  // linked policies on the same subdomain avoids the cross-subdomain
  // mismatch that contributed to the campaign rejection (Error 30909).
  // The same paths are still in PUBLIC_PATHS below so they pass the
  // auth check after the rewrite is skipped.
  // ──────────────────────────────────────────────────────────────
  if (host.startsWith('getcare.') && !pathname.startsWith('/api/') && !pathname.startsWith('/thank-you')) {
    return NextResponse.rewrite(new URL('/getcare', req.url))
  }
  if (host.startsWith('apply.')
      && !pathname.startsWith('/api/')
      && !pathname.startsWith('/thank-you')
      && !pathname.startsWith('/privacy')
      && !pathname.startsWith('/sms-terms')) {
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
