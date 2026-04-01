export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import CaseForm from '@/components/CaseForm'
import CaseActions from '@/components/CaseActions'
import Link from 'next/link'
import { CREDENTIAL_LABELS, CredentialType } from '@/types'
import { CASE_STATUS_CONFIG, HOLD_REASONS } from '@/lib/constants'

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createServiceClient()
  let caseData: any = null
  let clients: any[] = []
  let matches: any[] = []
  let documents: any[] = []

  try {
    const { data } = await db
      .from('cases')
      .select('*,clients(*),providers(id,name,credential_type,phone,email)')
      .eq('id', id).single()
    caseData = data
  } catch {}
  if (!caseData) notFound()

  try {
    const { data } = await db.from('clients')
      .select('id,name,required_credential,required_skills,care_needs,urgency_level,city,state,lat,lng,gender_preference,requires_car,requires_meal_prep,requires_total_care,requires_wheelchair,requires_hoyer_lift,requires_spanish')
      .eq('status','active').order('name')
    clients = data ?? []
  } catch {}

  try {
    const { data } = await db.from('case_matches')
      .select('*,providers(id,name,credential_type,phone,email,city,state,lat,lng,available,status,skills,service_radius_miles,additional_credentials,has_car,spanish_speaking,hoyer_lift,wheelchair_transfer,shift_preferences)')
      .eq('case_id', id).order('match_score', { ascending: false })
    matches = data ?? []
  } catch {}

  try {
    const { data } = await db.from('case_documents')
      .select('*').eq('case_id', id).order('created_at', { ascending: false })
    documents = data ?? []
  } catch {}

  const assignedProvider = Array.isArray(caseData.providers) ? caseData.providers[0] : caseData.providers
  const client = Array.isArray(caseData.clients) ? caseData.clients[0] : caseData.clients
  const cfg = CASE_STATUS_CONFIG[caseData.status]
  const holdLabel = HOLD_REASONS.find(r => r.value === caseData.hold_reason)?.label

  return (
    <>
      <PageHeader
        title={caseData.title}
        subtitle={`${client?.name ?? 'No client'} · ${caseData.schedule_type ?? 'one_time'}`}
        breadcrumbs={[{ label: 'Cases', href: '/cases' }, { label: caseData.title }]}
        actions={
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ background:cfg?.bg, color:cfg?.color, border:`1px solid ${cfg?.color}33`, borderRadius:12, padding:'3px 12px', fontSize:12, fontWeight:600 }}>
              {cfg?.label ?? caseData.status}
            </span>
            <StatusBadge label={caseData.urgency} status={caseData.urgency}/>
          </div>
        }
      />

      {/* Status banners */}
      {assignedProvider && (
        <div style={{ background:'#ECFDF5', borderBottom:'1px solid #A7F3D0', padding:'12px 32px', display:'flex', alignItems:'center', gap:12, fontSize:13.5 }}>
          <span style={{ color:'#10B981', fontSize:18 }}>⭐</span>
          <strong>Assigned:</strong>
          <span>{assignedProvider.name} ({assignedProvider.credential_type})</span>
          {assignedProvider.phone && <span style={{ color:'var(--muted)' }}>· {assignedProvider.phone}</span>}
          <Link href={`/providers/${assignedProvider.id}`} style={{ marginLeft:'auto', color:'var(--teal)', fontSize:12, fontWeight:500 }}>View Provider →</Link>
        </div>
      )}

      {caseData.status === 'on_hold' && (
        <div style={{ background:'#FEF9C3', borderBottom:'1px solid #FDE68A', padding:'12px 32px', display:'flex', alignItems:'center', gap:12, fontSize:13.5 }}>
          <span style={{ fontSize:18 }}>⏸</span>
          <strong>On Hold</strong>
          {holdLabel && <span>— {holdLabel}</span>}
          {caseData.hold_note && <span style={{ color:'var(--muted)' }}>· {caseData.hold_note}</span>}
          {caseData.on_hold_at && <span style={{ marginLeft:'auto', fontSize:11, color:'var(--muted)' }}>Since {new Date(caseData.on_hold_at).toLocaleDateString()}</span>}
        </div>
      )}

      {['completed','cancelled'].includes(caseData.status) && (
        <div style={{ background:'#F9FAFB', borderBottom:'1px solid var(--border)', padding:'12px 32px', display:'flex', alignItems:'center', gap:12, fontSize:13.5 }}>
          <span>{caseData.status === 'completed' ? '✓' : '✕'}</span>
          <strong>{caseData.status === 'completed' ? 'Completed' : 'Cancelled'}</strong>
          {caseData.closed_at && <span style={{ color:'var(--muted)' }}>{new Date(caseData.closed_at).toLocaleDateString()}</span>}
        </div>
      )}

      {/* Case lifecycle actions */}
      <div style={{ padding:'16px 28px', borderBottom:'1px solid var(--border)', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:12, color:'var(--muted)' }}>
          Opened {new Date(caseData.created_at).toLocaleDateString()}
          {caseData.assigned_at && ` · Assigned ${new Date(caseData.assigned_at).toLocaleDateString()}`}
        </div>
        <CaseActions caseId={id} status={caseData.status} title={caseData.title} />
      </div>

      <CaseForm
        mode="edit"
        clients={clients}
        caseData={caseData}
        matches={matches}
        documents={documents}
        assignedProviderId={assignedProvider?.id ?? null}
      />
    </>
  )
}
