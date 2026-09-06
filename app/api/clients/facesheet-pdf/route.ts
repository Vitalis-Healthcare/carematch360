// app/api/clients/facesheet-pdf/route.ts (v2.7.28)
//
// Combined client face sheets for a directory selection. FORM post
// (ids CSV, download=1 optional) for the same popup-blocker reasons as
// /api/providers/profile-pdf. Cap 25 both sides. NOT in PUBLIC_PATHS.

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
export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Keep in sync with PDF_BATCH_CAP in app/(dashboard)/clients/client.tsx.
const PDF_BATCH_CAP = 25

function loadAssetAsDataUri(relativePath: string, mime: string): string {
  try {
    const abs = path.resolve(process.cwd(), 'public', relativePath)
    const bytes = readFileSync(abs)
    return `data:${mime};base64,${bytes.toString('base64')}`
  } catch (err) {
    console.error(`[facesheet-pdf-batch] Failed to load asset ${relativePath}:`, err)
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

  const ids = idsRaw.split(',').map((s) => s.trim()).filter((s) => UUID_RE.test(s))
  if (ids.length === 0) {
    return NextResponse.json({ error: 'No valid client ids supplied' }, { status: 400 })
  }
  if (ids.length > PDF_BATCH_CAP) {
    return NextResponse.json(
      { error: `Print/download is limited to ${PDF_BATCH_CAP} clients at a time (got ${ids.length})` },
      { status: 400 }
    )
  }

  const db = createServiceClient()
  const { data: rows, error } = await db.from('clients').select('*').in('id', ids)
  if (error) {
    console.error('[facesheet-pdf-batch] fetch failed:', error.message)
    return NextResponse.json({ error: 'Failed to load clients' }, { status: 500 })
  }

  // Preserve selection order (.in() does not).
  const byId = new Map<string, ClientFacesheet>()
  for (const r of rows ?? []) byId.set((r as ClientFacesheet).id, r as ClientFacesheet)
  const clients = ids.map((id) => byId.get(id)).filter((c): c is ClientFacesheet => c != null)
  if (clients.length === 0) {
    return NextResponse.json({ error: 'No matching clients found' }, { status: 404 })
  }

  // Case histories in ONE query, grouped client-side. Degrades gracefully.
  try {
    const { data: caseRows } = await db
      .from('cases')
      .select('client_id,title,care_level,status,created_at')
      .in('client_id', ids)
      .order('created_at', { ascending: false })
    const grouped = new Map<string, ClientCaseRow[]>()
    for (const r of caseRows ?? []) {
      const list = grouped.get((r as any).client_id) ?? []
      if (list.length < 15) list.push(r as unknown as ClientCaseRow)
      grouped.set((r as any).client_id, list)
    }
    for (const c of clients) c.cases = grouped.get(c.id) ?? []
  } catch (err) {
    console.error('[facesheet-pdf-batch] case history lookup failed (continuing):', err)
  }

  try {
    const pdfElement = React.createElement(ClientFacesheetDocument, {
      clients,
      logoDataUri: LOGO_DATA_URI,
      fonts: FONT_BUNDLE,
    }) as unknown as React.ReactElement<DocumentProps>
    const buffer = await renderToBuffer(pdfElement)

    const filename = clients.length === 1
      ? 'vitalis-client-facesheet.pdf'
      : `vitalis-client-facesheets-${clients.length}.pdf`
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[facesheet-pdf-batch] PDF generation failed:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
