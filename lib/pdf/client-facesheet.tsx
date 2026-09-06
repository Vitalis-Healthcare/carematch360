/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/pdf/client-facesheet.tsx (v2.7.28)
//
// Branded client face sheet, printable/downloadable by staff. Takes an
// ARRAY of clients (one page each, wrapping if long) so the single and
// multi-select routes share one template — same architecture as
// lib/pdf/provider-profile.tsx. Fonts arrive as a FontBundle from the
// calling route (per-route asset loading is deliberate — see the
// conventions doc and pitfall 34).

import {
  Document, Page, Text, View, Image, StyleSheet, Font, Svg, Path,
} from '@react-pdf/renderer'
import React from 'react'
import { groupSkills } from '@/lib/email/types'
import { CREDENTIAL_LABELS, CredentialType, CARE_LEVEL_LABELS, CareLevel } from '@/types'
import type { FontBundle } from './provider-profile'

let fontsRegistered = false
function registerFontsOnce(fonts: FontBundle) {
  if (fontsRegistered) return
  Font.register({
    family: 'Cormorant Garamond',
    fonts: [
      { src: fonts.cormorant400, fontWeight: 400 },
      { src: fonts.cormorant400Italic, fontWeight: 400, fontStyle: 'italic' },
      { src: fonts.cormorant500, fontWeight: 500 },
      { src: fonts.cormorant600, fontWeight: 600 },
    ],
  })
  Font.register({
    family: 'DM Sans',
    fonts: [
      { src: fonts.dmsans400, fontWeight: 400 },
      { src: fonts.dmsans500, fontWeight: 500 },
      { src: fonts.dmsans600, fontWeight: 600 },
      { src: fonts.dmsans700, fontWeight: 700 },
    ],
  })
  fontsRegistered = true
}

export type ClientCaseRow = {
  title: string
  care_level: string | null
  status: string
  created_at: string | null
}

/** The client fields this template reads — matches `clients` columns. */
export type ClientFacesheet = {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  required_credential: string | null
  additional_credentials: string[] | null
  required_skills: string[] | null
  care_needs: string[] | null
  visit_frequency: string | null
  urgency_level: string | null
  payer_types: string[] | null
  status: string
  notes: string | null
  gender_preference: string | null
  requires_car: boolean
  requires_meal_prep: boolean
  requires_total_care: boolean
  requires_wheelchair: boolean
  requires_hoyer_lift: boolean
  requires_spanish: boolean
  created_at: string | null
  /** Attached by the route — compact case history. */
  cases?: ClientCaseRow[]
}

const C = {
  greenDark: '#2D5A1B', greenMid: '#4A7C2F', greenBright: '#7AB52A',
  greenLime: '#9DCF3A', greenLight: '#EBF5DF', greenPale: '#F4FAF0',
  text: '#1A2E10', muted: '#5A7050', border: '#C8DDB8',
  white: '#FFFFFF', cream: '#FDFCF7', amber: '#B07D1E', red: '#A63A2E',
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 44, paddingBottom: 56, paddingHorizontal: 54,
    backgroundColor: C.white, fontFamily: 'DM Sans', fontSize: 10, color: C.text,
  },
  logoWrap: { alignItems: 'center', marginBottom: 14 },
  logo: { width: 150, height: 100, objectFit: 'contain' },
  headerBand: {
    backgroundColor: C.greenDark, paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 4, marginBottom: 18, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  headerEyebrow: {
    fontFamily: 'DM Sans', fontSize: 8, fontWeight: 700,
    letterSpacing: 2, color: C.greenLime, textTransform: 'uppercase',
  },
  headerDate: { fontFamily: 'DM Sans', fontSize: 9, color: '#D9E8C8' },
  heroName: {
    fontFamily: 'Cormorant Garamond', fontSize: 26, fontWeight: 500,
    color: C.text, letterSpacing: -0.2, marginBottom: 4,
  },
  heroMeta: { fontFamily: 'DM Sans', fontSize: 10.5, color: C.muted, marginBottom: 2 },
  statusRow: { flexDirection: 'row', marginTop: 6 },
  statusPill: {
    borderRadius: 9, paddingHorizontal: 9, paddingVertical: 2.5,
    fontFamily: 'DM Sans', fontSize: 8.5, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: 0.8, marginRight: 5,
  },
  sectionWrap: { marginTop: 16 },
  sectionHeader: {
    fontFamily: 'DM Sans', fontSize: 8.5, fontWeight: 700,
    letterSpacing: 1.6, color: C.greenDark, textTransform: 'uppercase',
    paddingBottom: 5, borderBottomWidth: 0.75, borderBottomColor: C.border,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', paddingVertical: 3.5 },
  rowLabel: {
    width: 110, fontFamily: 'DM Sans', fontSize: 9, color: C.muted,
    fontWeight: 500, paddingTop: 1,
  },
  rowValue: {
    flex: 1, fontFamily: 'DM Sans', fontSize: 10.5, color: C.text,
    fontWeight: 500, lineHeight: 1.4,
  },
  rowValueMuted: { color: C.muted, fontWeight: 400 },
  chipWrap: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    backgroundColor: C.greenLight, borderWidth: 0.75, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2.5,
    fontFamily: 'DM Sans', fontSize: 9, color: C.greenDark, fontWeight: 500,
    marginRight: 4, marginBottom: 3.5,
  },
  capRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  capCell: { flexDirection: 'row', alignItems: 'center', width: '50%', paddingVertical: 4 },
  capCheckOn: {
    width: 12, height: 12, backgroundColor: C.greenBright, borderRadius: 6,
    marginRight: 8, alignItems: 'center', justifyContent: 'center',
  },
  capCheckOff: {
    width: 12, height: 12, borderWidth: 1, borderColor: C.border,
    borderRadius: 6, marginRight: 8,
  },
  capLabelOn: { fontFamily: 'DM Sans', fontSize: 10, color: C.text, fontWeight: 600 },
  capLabelOff: { fontFamily: 'DM Sans', fontSize: 10, color: C.muted, fontWeight: 400 },
  skillGroupLabel: {
    fontFamily: 'DM Sans', fontSize: 8.5, fontWeight: 600,
    letterSpacing: 0.6, color: C.greenMid, textTransform: 'uppercase',
    marginTop: 8, marginBottom: 5,
  },
  notesBox: {
    backgroundColor: C.cream, borderLeftWidth: 2.5, borderLeftColor: C.greenBright,
    paddingVertical: 10, paddingHorizontal: 14, marginTop: 4,
  },
  notesText: {
    fontFamily: 'Cormorant Garamond', fontSize: 11.5, fontStyle: 'italic',
    color: C.text, lineHeight: 1.55,
  },
  tableHead: {
    flexDirection: 'row', borderBottomWidth: 0.75, borderBottomColor: C.border,
    paddingBottom: 4, marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row', paddingVertical: 4,
    borderBottomWidth: 0.5, borderBottomColor: C.greenLight,
  },
  thCell: {
    fontFamily: 'DM Sans', fontSize: 8, fontWeight: 700, color: C.greenMid,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  tdCell: { fontFamily: 'DM Sans', fontSize: 9.5, color: C.text },
  footer: {
    position: 'absolute', bottom: 28, left: 54, right: 54,
    borderTopWidth: 0.75, borderTopColor: C.border,
    paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between',
  },
  footerLeft: { fontFamily: 'Cormorant Garamond', fontSize: 10, fontWeight: 500, color: C.greenDark },
  footerRight: { fontFamily: 'DM Sans', fontSize: 8, color: C.muted },
})

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  const hasValue = value != null && String(value).trim() !== ''
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={hasValue ? styles.rowValue : [styles.rowValue, styles.rowValueMuted]}>
        {hasValue ? String(value) : '—'}
      </Text>
    </View>
  )
}

function ChipRow({ label, values }: { label: string; values: string[] }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {values.length > 0 ? (
        <View style={styles.chipWrap}>
          {values.map((v, i) => (
            <Text key={`${v}-${i}`} style={styles.chip}>{v}</Text>
          ))}
        </View>
      ) : (
        <Text style={[styles.rowValue, styles.rowValueMuted]}>—</Text>
      )}
    </View>
  )
}

function Check({ on }: { on: boolean }) {
  return on ? (
    <View style={styles.capCheckOn}>
      <Svg width={7} height={6} viewBox="0 0 7 6">
        <Path d="M0.8 3.1 L2.7 5 L6.2 0.9" stroke={C.white} strokeWidth={1.3}
          strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    </View>
  ) : (
    <View style={styles.capCheckOff} />
  )
}

function credentialLabel(code: string): string {
  const label = (CREDENTIAL_LABELS as Record<string, string>)[code as CredentialType]
  return label ? `${code} — ${label}` : code
}

function careLevelLabel(code: string): string {
  return (CARE_LEVEL_LABELS as Record<string, string>)[code as CareLevel] ?? code
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function prettyGenderPref(g: string | null | undefined): string {
  if (!g || g === 'any') return 'No preference'
  return g.charAt(0).toUpperCase() + g.slice(1)
}

const CLIENT_REQUIREMENTS: { key: keyof ClientFacesheet; label: string }[] = [
  { key: 'requires_car', label: 'Requires a car' },
  { key: 'requires_spanish', label: 'Spanish speaking' },
  { key: 'requires_meal_prep', label: 'Meal preparation' },
  { key: 'requires_total_care', label: 'Total care' },
  { key: 'requires_wheelchair', label: 'Wheelchair transfer' },
  { key: 'requires_hoyer_lift', label: 'Hoyer lift' },
]

function ClientPage({
  client, logoDataUri, generatedAt,
}: {
  client: ClientFacesheet
  logoDataUri: string
  generatedAt: string
}) {
  const address = [client.address, client.city, client.state, client.zip]
    .filter((s) => s != null && String(s).trim() !== '').join(', ')
  const skillGroups = groupSkills(client.required_skills ?? [])
  const cases = client.cases ?? []

  return (
    <Page size="LETTER" style={styles.page}>
      {logoDataUri ? (
        <View style={styles.logoWrap}><Image src={logoDataUri} style={styles.logo} /></View>
      ) : null}

      <View style={styles.headerBand}>
        <Text style={styles.headerEyebrow}>Client Face Sheet</Text>
        <Text style={styles.headerDate}>{generatedAt}</Text>
      </View>

      <Text style={styles.heroName}>{client.name}</Text>
      {client.city ? (
        <Text style={styles.heroMeta}>{[client.city, client.state].filter(Boolean).join(', ')}</Text>
      ) : null}

      <View style={styles.statusRow}>
        <Text style={[styles.statusPill,
          client.status === 'active'
            ? { backgroundColor: C.greenLight, color: C.greenDark }
            : { backgroundColor: '#F1E8D8', color: C.amber }]}>
          {client.status || '—'}
        </Text>
        {client.urgency_level ? (
          <Text style={[styles.statusPill,
            client.urgency_level === 'routine'
              ? { backgroundColor: C.greenPale, color: C.greenMid }
              : { backgroundColor: '#F3E3E0', color: C.red }]}>
            {client.urgency_level}
          </Text>
        ) : null}
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionHeader}>Contact</Text>
        <Row label="Address" value={address} />
        <Row label="Emergency contact" value={client.contact_name} />
        <Row label="Contact phone" value={client.contact_phone} />
        <Row label="Contact email" value={client.contact_email} />
        <Row label="Client since" value={formatDate(client.created_at)} />
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionHeader}>Care Plan</Text>
        <Row label="Visit frequency" value={client.visit_frequency} />
        <ChipRow label="Care needs" values={(client.care_needs ?? []).map(careLevelLabel)} />
        <ChipRow
          label="Credentials"
          values={[client.required_credential, ...(client.additional_credentials ?? [])]
            .filter((c): c is string => Boolean(c)).map(credentialLabel)}
        />
        <Row label="Gender preference" value={prettyGenderPref(client.gender_preference)} />
        <ChipRow label="Payer" values={client.payer_types ?? []} />
        {/* v2.7.25a rule: the 6-cell grid never splits across a page break */}
        <View style={styles.capRow} wrap={false}>
          {CLIENT_REQUIREMENTS.map(({ key, label }) => {
            const on = Boolean(client[key])
            return (
              <View key={key} style={styles.capCell}>
                <Check on={on} />
                <Text style={on ? styles.capLabelOn : styles.capLabelOff}>{label}</Text>
              </View>
            )
          })}
        </View>
      </View>

      {skillGroups.length > 0 ? (
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeader}>Required Skills</Text>
          {skillGroups.map((g) => (
            <View key={g.label} wrap={false}>
              <Text style={styles.skillGroupLabel}>{g.label}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {g.skills.map((s, i) => (
                  <Text key={`${g.label}-${i}-${s}`} style={styles.chip}>{s}</Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {cases.length > 0 ? (
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeader}>Cases</Text>
          <View style={styles.tableHead} wrap={false}>
            <Text style={[styles.thCell, { flex: 3 }]}>Case</Text>
            <Text style={[styles.thCell, { flex: 2 }]}>Care level</Text>
            <Text style={[styles.thCell, { flex: 1.4 }]}>Status</Text>
            <Text style={[styles.thCell, { flex: 1.4 }]}>Opened</Text>
          </View>
          {cases.map((c, i) => (
            <View key={`${c.title}-${i}`} style={styles.tableRow} wrap={false}>
              <Text style={[styles.tdCell, { flex: 3, fontWeight: 500 }]}>{c.title}</Text>
              <Text style={[styles.tdCell, { flex: 2, color: C.muted }]}>
                {c.care_level ? careLevelLabel(c.care_level) : '—'}
              </Text>
              <Text style={[styles.tdCell, { flex: 1.4, color: C.greenMid, fontWeight: 600 }]}>{c.status}</Text>
              <Text style={[styles.tdCell, { flex: 1.4, color: C.muted }]}>{formatDate(c.created_at)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {client.notes && client.notes.trim() ? (
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeader}>Notes</Text>
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{client.notes.trim()}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.footer} fixed>
        <Text style={styles.footerLeft}>Vitalis Healthcare Services</Text>
        <Text style={styles.footerRight}>Internal staff document · CareMatch360</Text>
      </View>
    </Page>
  )
}

export function ClientFacesheetDocument({
  clients, logoDataUri, fonts,
}: {
  clients: ClientFacesheet[]
  logoDataUri: string
  fonts: FontBundle
}) {
  registerFontsOnce(fonts)
  const generatedAt = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  return (
    <Document
      title={clients.length === 1
        ? `Client Face Sheet — ${clients[0].name}`
        : `Client Face Sheets (${clients.length})`}
      author="Vitalis Healthcare Services"
    >
      {clients.map((c) => (
        <ClientPage key={c.id} client={c} logoDataUri={logoDataUri} generatedAt={generatedAt} />
      ))}
    </Document>
  )
}
