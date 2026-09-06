// app/api/clients/[id]/facesheet-pdf/route.ts (v2.7.28)
//
// Single client face sheet. Inline for print, ?download=1 for attachment.
// Staff action: NOT in PUBLIC_PATHS (no prefix collision with the public
// /api/clients/inquire or /api/clients/apply); requireAuth is the gate.
// Per-route asset loading + outputFileTracingIncludes entry (pitfall 34).

import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import {
  ClientFacesheetDocument,
  type ClientFacesheet,
  type ClientCaseRow,
} from '@/lib/pdf/client-facesheet'
import type { FontBundle } from '@/lib/pdf/provider-profile'
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
    console.error(`[facesheet-pdf] Failed to load asset ${relativePath}:`, err)
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

function slugify(name: string): string {
  const s = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return s || 'client'
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
  const { data: client, error } = await db
    .from('clients').select('*').eq('id', id).single()
  if (error || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  // Compact case history — failure degrades to a face sheet without it.
  let caseRows: ClientCaseRow[] = []
  try {
    const { data } = await db
      .from('cases')
      .select('title,care_level,status,created_at')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(15)
    caseRows = (data ?? []) as ClientCaseRow[]
  } catch (err) {
    console.error('[facesheet-pdf] case history lookup failed (continuing):', err)
  }

  try {
    const pdfElement = React.createElement(ClientFacesheetDocument, {
      clients: [{ ...(client as ClientFacesheet), cases: caseRows }],
      logoDataUri: LOGO_DATA_URI,
      fonts: FONT_BUNDLE,
    }) as unknown as React.ReactElement<DocumentProps>
    const buffer = await renderToBuffer(pdfElement)

    const download = req.nextUrl.searchParams.get('download') === '1'
    const filename = `vitalis-client-${slugify(client.name ?? '')}.pdf`
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[facesheet-pdf] PDF generation failed:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
