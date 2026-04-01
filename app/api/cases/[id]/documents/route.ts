import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = createServiceClient()
    const form = await req.formData()
    const file = form.get('file') as File
    const docType = form.get('doc_type') as string
    const name = form.get('name') as string

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = new Uint8Array(bytes)
    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `cases/${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    // Upload to Supabase Storage
    const { error: upErr } = await db.storage
      .from('case-documents')
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (upErr) {
      // Storage bucket may not exist yet — return a helpful error
      return NextResponse.json({
        error: `Storage error: ${upErr.message}. Make sure the 'case-documents' bucket exists in Supabase Storage.`
      }, { status: 400 })
    }

    const { data: urlData } = db.storage.from('case-documents').getPublicUrl(path)

    const { data, error } = await db.from('case_documents').insert({
      case_id: id,
      name,
      url: urlData.publicUrl,
      file_type: file.type,
      file_size: file.size,
      doc_type: docType || 'other',
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { doc_id } = await req.json()
    const db = createServiceClient()
    const { error } = await db.from('case_documents').delete().eq('id', doc_id).eq('case_id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ deleted: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
