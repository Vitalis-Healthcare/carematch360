// app/api/providers/[id]/profile-pdf/route.ts (v2.7.24)
//
// Returns the branded provider-profile PDF.
//   GET /api/providers/<id>/profile-pdf              → inline (print in browser tab)
//   GET /api/providers/<id>/profile-pdf?download=1   → attachment (save to disk)
//
// Staff action: deliberately NOT in middleware PUBLIC_PATHS. The real
// gate is requireAuth() below (middleware only checks cookie existence).
//
// Asset loading follows the apply-route pattern: static path.resolve
// calls at module scope so Vercel's Node File Trace bundles the fonts
// and logo with THIS function. Do NOT centralize into a shared module —
// lazy reads inside lib/ modules were not reliably traced (v2.7.15).
// next.config.js also lists this route in outputFileTracingIncludes.

import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import {
  ProviderProfileDocument,
  type FontBundle,
  type ProviderProfile,
} from '@/lib/pdf/provider-profile'
import { readFileSync } from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const maxDuration = 30
export const dynamic = 'force-dynamic'

function loadAssetAsDataUri(relativePath: string, mime: string): string {
  try {
    const abs = path.resolve(process.cwd(), 'public', relativePath)
    const bytes = readFileSync(abs)
    return `data:${mime};base64,${bytes.toString('base64')}`
  } catch (err) {
    console.error(`[profile-pdf] Failed to load asset ${relativePath}:`, err)
    return ''
  }
}

const LOGO_DATA_URI = loadAssetAsDataUri('branding/vitalis-logo.png', 'image/png')
const FONT_BUNDLE: FontBundle = {
  cormorant400: loadAssetAsDataUri('fonts/cormorant-garamond-400.woff', 'font/woff'),
  cormorant400Italic: loadAssetAsDataUri('fonts/cormorant-garamond-400-italic.woff', 'font/woff'),
  cormorant500: loadAssetAsDataUri('fonts/cormorant-garamond-500.woff', 'font/woff'),
  cormorant600: loadAssetAsDataUri('fonts/cormorant-garamond-600.woff', 'font/woff'),
  dmsans400: loadAssetAsDataUri('fonts/dm-sans-400.woff', 'font/woff'),
  dmsans500: loadAssetAsDataUri('fonts/dm-sans-500.woff', 'font/woff'),
  dmsans600: loadAssetAsDataUri('fonts/dm-sans-600.woff', 'font/woff'),
  dmsans700: loadAssetAsDataUri('fonts/dm-sans-700.woff', 'font/woff'),
}

/** "Oyindamola Okojie" → "oyindamola-okojie" for the download filename. */
function slugify(name: string): string {
  const s = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return s || 'provider'
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    await requireAuth(['admin', 'coordinator'])
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'UNAUTHENTICATED'
    return NextResponse.json(
      { error: msg === 'UNAUTHORIZED' ? 'Not permitted' : 'Not signed in' },
      { status: msg === 'UNAUTHORIZED' ? 403 : 401 }
    )
  }

  const db = createServiceClient()
  const { data: provider, error } = await db
    .from('providers')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
  }

  try {
    // Same cast pattern as lib/email/send-apply-notification.ts — the
    // component returns a <Document>, but createElement's inferred prop
    // type doesn't overlap DocumentProps, so react-pdf needs the assist.
    const pdfElement = React.createElement(ProviderProfileDocument, {
      providers: [provider as ProviderProfile],
      logoDataUri: LOGO_DATA_URI,
      fonts: FONT_BUNDLE,
    }) as unknown as React.ReactElement<DocumentProps>
    const buffer = await renderToBuffer(pdfElement)

    const download = req.nextUrl.searchParams.get('download') === '1'
    const filename = `vitalis-provider-${slugify(provider.name ?? '')}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[profile-pdf] PDF generation failed:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
