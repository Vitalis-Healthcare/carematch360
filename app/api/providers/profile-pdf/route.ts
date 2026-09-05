// app/api/providers/profile-pdf/route.ts (v2.7.25)
//
// Combined provider-profile PDF for a selection from the directory.
//   POST /api/providers/profile-pdf
//     form fields: ids=<comma-separated provider UUIDs>, download=1 (optional)
//   → one PDF, each provider starting on a fresh page, ordered as selected.
//     inline (print in browser tab) unless download=1 (attachment).
//
// Accepts a FORM post, not JSON, by design: the client submits a real
// <form target="_blank"> so the inline PDF opens in a new tab without
// popup blockers, and the attachment variant downloads in place.
//
// Staff action: deliberately NOT in middleware PUBLIC_PATHS (no prefix
// collision with the public '/api/providers/apply'). The real gate is
// requireAuth() below.
//
// Asset loading follows the apply-route pattern: static path.resolve at
// module scope so Vercel's Node File Trace bundles fonts + logo with
// THIS function (do NOT centralize — see v2.7.15). next.config.js also
// lists this route in outputFileTracingIncludes.

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
export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Keep in sync with PDF_BATCH_CAP in app/(dashboard)/providers/client.tsx.
const PDF_BATCH_CAP = 25

function loadAssetAsDataUri(relativePath: string, mime: string): string {
  try {
    const abs = path.resolve(process.cwd(), 'public', relativePath)
    const bytes = readFileSync(abs)
    return `data:${mime};base64,${bytes.toString('base64')}`
  } catch (err) {
    console.error(`[profile-pdf-batch] Failed to load asset ${relativePath}:`, err)
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  try {
    await requireAuth(['admin', 'coordinator'])
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'UNAUTHENTICATED'
    return NextResponse.json(
      { error: msg === 'UNAUTHORIZED' ? 'Not permitted' : 'Not signed in' },
      { status: msg === 'UNAUTHORIZED' ? 403 : 401 }
    )
  }

  let idsRaw = ''
  let download = false
  try {
    const fd = await req.formData()
    idsRaw = String(fd.get('ids') ?? '')
    download = String(fd.get('download') ?? '') === '1'
  } catch {
    return NextResponse.json({ error: 'Expected form data with an ids field' }, { status: 400 })
  }

  const ids = idsRaw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => UUID_RE.test(s))

  if (ids.length === 0) {
    return NextResponse.json({ error: 'No valid provider ids supplied' }, { status: 400 })
  }
  if (ids.length > PDF_BATCH_CAP) {
    return NextResponse.json(
      { error: `Print/download is limited to ${PDF_BATCH_CAP} providers at a time (got ${ids.length})` },
      { status: 400 }
    )
  }

  const db = createServiceClient()
  const { data: rows, error } = await db
    .from('providers')
    .select('*')
    .in('id', ids)

  if (error) {
    console.error('[profile-pdf-batch] fetch failed:', error.message)
    return NextResponse.json({ error: 'Failed to load providers' }, { status: 500 })
  }

  // Postgres .in() does not preserve request order — reorder to match
  // the selection order the coordinator clicked in.
  const byId = new Map<string, ProviderProfile>()
  for (const r of rows ?? []) byId.set((r as ProviderProfile).id, r as ProviderProfile)
  const providers = ids
    .map((id) => byId.get(id))
    .filter((p): p is ProviderProfile => p != null)

  if (providers.length === 0) {
    return NextResponse.json({ error: 'No matching providers found' }, { status: 404 })
  }

  try {
    // Same cast pattern as lib/email/send-apply-notification.ts.
    const pdfElement = React.createElement(ProviderProfileDocument, {
      providers,
      logoDataUri: LOGO_DATA_URI,
      fonts: FONT_BUNDLE,
    }) as unknown as React.ReactElement<DocumentProps>
    const buffer = await renderToBuffer(pdfElement)

    const filename =
      providers.length === 1
        ? `vitalis-provider-profile.pdf`
        : `vitalis-provider-profiles-${providers.length}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[profile-pdf-batch] PDF generation failed:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
