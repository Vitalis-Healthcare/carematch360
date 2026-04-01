"use client"
import { useState, useRef } from 'react'
import { CaseDocument, DOC_TYPE_LABELS, DocType } from '@/types'

interface Props { caseId: string; documents: CaseDocument[] }

const DOC_ICONS: Record<string, string> = {
  doctors_order:'📋', client_request:'✍️', authorization:'🔑',
  insurance:'💳', assessment:'📊', care_plan:'📌', id:'🪪', other:'📄',
}

export default function CaseDocuments({ caseId, documents: initialDocs }: Props) {
  const [docs, setDocs] = useState<CaseDocument[]>(initialDocs)
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState<DocType>('doctors_order')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('File must be under 10MB'); return }

    setUploading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('doc_type', docType)
      fd.append('name', file.name)

      const res = await fetch(`/api/cases/${caseId}/documents`, { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      setDocs(prev => [json, ...prev])
      if (fileRef.current) fileRef.current.value = ''
    } catch (err: any) { setError(err.message) } finally { setUploading(false) }
  }

  async function handleDelete(docId: string) {
    if (!confirm('Remove this document?')) return
    try {
      await fetch(`/api/cases/${caseId}/documents`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_id: docId }),
      })
      setDocs(prev => prev.filter(d => d.id !== docId))
    } catch { setError('Delete failed') }
  }

  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--navy)' }}>Documents</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{docs.length} attached</div>
        </div>
      </div>

      {/* Upload row */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px dashed var(--border)' }}>
        <select className="form-select" value={docType} onChange={e => setDocType(e.target.value as DocType)} style={{ width: 200, fontSize: 12.5 }}>
          {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{DOC_ICONS[k]} {v}</option>
          ))}
        </select>
        <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="btn-secondary" style={{ padding: '7px 14px', fontSize: 12.5 }}>
            {uploading ? 'Uploading...' : '+ Attach file'}
          </span>
          <input ref={fileRef} type="file" style={{ display: 'none' }}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
            onChange={handleUpload} disabled={uploading} />
        </label>
        <span style={{ fontSize: 11, color: 'var(--subtle)' }}>PDF, Word, image · max 10MB</span>
      </div>

      {error && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 10 }}>{error}</div>}

      {/* Document list */}
      {docs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--subtle)', fontSize: 13 }}>
          No documents attached yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {docs.map(doc => (
            <div key={doc.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', background: 'var(--bg)',
              border: '1px solid var(--border)', borderRadius: 8,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{DOC_ICONS[doc.doc_type] ?? '📄'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                  {DOC_TYPE_LABELS[doc.doc_type]}
                  {doc.file_size && ` · ${(doc.file_size / 1024).toFixed(0)} KB`}
                  {' · '}{new Date(doc.created_at).toLocaleDateString()}
                </div>
              </div>
              <a href={doc.url} target="_blank" rel="noopener noreferrer"
                className="btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }}>
                View
              </a>
              <button onClick={() => handleDelete(doc.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--subtle)', fontSize: 16, padding: '0 4px' }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
