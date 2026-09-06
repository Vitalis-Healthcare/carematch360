/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/pdf/case-summary.tsx (v2.7.28)
//
// Branded single-case summary sheet. Deliberately does NOT include the
// match results table — printing candidates with scores is the v2.7.26
// flow (Matching Results → profile PDFs with match context). Same
// architecture as the other lib/pdf templates; fonts arrive as a
// FontBundle from the calling route (pitfall 34).

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

/** The case fields this template reads — matches `cases` columns. */
export type CaseSummaryData = {
  id: string
  title: string
  status: string
  urgency: string | null
  care_level: string | null
  allowed_credentials: string[] | null
  required_skills: string[] | null
  schedule_type: string | null
  visit_date: string | null
  visit_time: string | null
  duration_hours: number | null
  recurring_days: string[] | null
  recurring_start: string | null
  recurring_end: string | null
  flexible_hours_day: number | null
  flexible_days_week: number | null
  flexible_any_time: boolean | null
  payer_types: string[] | null
  gender_preference: string | null
  requires_car: boolean
  requires_meal_prep: boolean
  requires_total_care: boolean
  requires_wheelchair: boolean
  requires_hoyer_lift: boolean
  requires_spanish: boolean
  special_instructions: string | null
  created_at: string | null
  client?: { name: string; city: string | null; state: string | null; contact_phone: string | null } | null
  provider?: { name: string; credential_type: string; phone: string | null } | null
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
    fontFamily: 'Cormorant Garamond', fontSize: 24, fontWeight: 500,
    color: C.text, letterSpacing: -0.2, marginBottom: 4,
  },
  heroMeta: { fontFamily: 'DM Sans', fontSize: 10.5, color: C.muted, marginBottom: 2 },
  statusRow: { flexDirection: 'row', marginTop: 6 },
  statusPill: {
    borderRadius: 9, paddingHorizontal: 9, paddingVertical: 2.5,
    fontFamily: 'DM Sans', fontSize: 8.5, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: 0.8, marginRight: 5,
  },
  providerBand: {
    backgroundColor: C.greenPale, borderWidth: 0.75, borderColor: C.border,
    borderRadius: 4, paddingVertical: 8, paddingHorizontal: 14, marginTop: 12,
  },
  providerLabel: {
    fontFamily: 'DM Sans', fontSize: 7.5, fontWeight: 700,
    letterSpacing: 1.2, color: C.greenMid, textTransform: 'uppercase', marginBottom: 2,
  },
  providerValue: { fontFamily: 'DM Sans', fontSize: 12, fontWeight: 700, color: C.greenDark },
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

function ChipRow({ label, values, empty }: { label: string; values: string[]; empty?: string }) {
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
        <Text style={[styles.rowValue, styles.rowValueMuted]}>{empty ?? '—'}</Text>
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

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

/** Human-readable schedule from the case's schedule columns. */
function scheduleLines(c: CaseSummaryData): { label: string; value: string }[] {
  const t = c.schedule_type ?? 'one_time'
  if (t === 'recurring') {
    return [
      { label: 'Schedule', value: 'Recurring' },
      { label: 'Days', value: (c.recurring_days ?? []).join(', ') || '—' },
      {
        label: 'Window',
        value: [c.recurring_start, c.recurring_end].filter(Boolean).join(' – ') || '—',
      },
      { label: 'Hours per visit', value: c.duration_hours != null ? String(c.duration_hours) : '—' },
    ]
  }
  if (t === 'flexible') {
    return [
      { label: 'Schedule', value: c.flexible_any_time ? 'Flexible — any time' : 'Flexible' },
      { label: 'Hours per day', value: c.flexible_hours_day != null ? String(c.flexible_hours_day) : '—' },
      { label: 'Days per week', value: c.flexible_days_week != null ? String(c.flexible_days_week) : '—' },
    ]
  }
  return [
    { label: 'Schedule', value: 'One-time visit' },
    { label: 'Visit date', value: formatDate(c.visit_date) },
    { label: 'Visit time', value: c.visit_time ?? '—' },
    { label: 'Hours', value: c.duration_hours != null ? String(c.duration_hours) : '—' },
  ]
}

const CASE_REQUIREMENTS: { key: keyof CaseSummaryData; label: string }[] = [
  { key: 'requires_car', label: 'Requires a car' },
  { key: 'requires_spanish', label: 'Spanish speaking' },
  { key: 'requires_meal_prep', label: 'Meal preparation' },
  { key: 'requires_total_care', label: 'Total care' },
  { key: 'requires_wheelchair', label: 'Wheelchair transfer' },
  { key: 'requires_hoyer_lift', label: 'Hoyer lift' },
]

export function CaseSummaryDocument({
  caseData, logoDataUri, fonts,
}: {
  caseData: CaseSummaryData
  logoDataUri: string
  fonts: FontBundle
}) {
  registerFontsOnce(fonts)
  const generatedAt = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const c = caseData
  const skillGroups = groupSkills(c.required_skills ?? [])
  const careLevel = c.care_level
    ? ((CARE_LEVEL_LABELS as Record<string, string>)[c.care_level as CareLevel] ?? c.care_level)
    : '—'

  return (
    <Document title={`Case Summary — ${c.title}`} author="Vitalis Healthcare Services">
      <Page size="LETTER" style={styles.page}>
        {logoDataUri ? (
          <View style={styles.logoWrap}><Image src={logoDataUri} style={styles.logo} /></View>
        ) : null}

        <View style={styles.headerBand}>
          <Text style={styles.headerEyebrow}>Case Summary</Text>
          <Text style={styles.headerDate}>{generatedAt}</Text>
        </View>

        <Text style={styles.heroName}>{c.title}</Text>
        {c.client ? (
          <Text style={styles.heroMeta}>
            {c.client.name}
            {c.client.city ? ` · ${[c.client.city, c.client.state].filter(Boolean).join(', ')}` : ''}
            {c.client.contact_phone ? ` · ${c.client.contact_phone}` : ''}
          </Text>
        ) : null}

        <View style={styles.statusRow}>
          <Text style={[styles.statusPill, { backgroundColor: C.greenLight, color: C.greenDark }]}>
            {c.status || '—'}
          </Text>
          {c.urgency ? (
            <Text style={[styles.statusPill,
              c.urgency === 'routine'
                ? { backgroundColor: C.greenPale, color: C.greenMid }
                : { backgroundColor: '#F3E3E0', color: C.red }]}>
              {c.urgency}
            </Text>
          ) : null}
        </View>

        {c.provider ? (
          <View style={styles.providerBand}>
            <Text style={styles.providerLabel}>Assigned provider</Text>
            <Text style={styles.providerValue}>
              {c.provider.name} · {c.provider.credential_type}
              {c.provider.phone ? ` · ${c.provider.phone}` : ''}
            </Text>
          </View>
        ) : null}

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeader}>Case</Text>
          <Row label="Care level" value={careLevel} />
          <ChipRow
            label="Qualifications"
            values={(c.allowed_credentials ?? []).map(credentialLabel)}
            empty="Any credential eligible for the care level"
          />
          <Row label="Opened" value={formatDate(c.created_at)} />
          <ChipRow label="Payer" values={c.payer_types ?? []} />
          <Row label="Gender preference"
            value={!c.gender_preference || c.gender_preference === 'any'
              ? 'No preference'
              : c.gender_preference.charAt(0).toUpperCase() + c.gender_preference.slice(1)} />
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeader}>Schedule</Text>
          {scheduleLines(c).map((l) => (
            <Row key={l.label} label={l.label} value={l.value} />
          ))}
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeader}>Requirements</Text>
          {/* v2.7.25a rule: the 6-cell grid never splits across a page break */}
          <View style={styles.capRow} wrap={false}>
            {CASE_REQUIREMENTS.map(({ key, label }) => {
              const on = Boolean(c[key])
              return (
                <View key={key} style={styles.capCell}>
                  <Check on={on} />
                  <Text style={on ? styles.capLabelOn : styles.capLabelOff}>{label}</Text>
                </View>
              )
            })}
          </View>
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

        {c.special_instructions && c.special_instructions.trim() ? (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeader}>Special Instructions</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{c.special_instructions.trim()}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text style={styles.footerLeft}>Vitalis Healthcare Services</Text>
          <Text style={styles.footerRight}>Internal staff document · CareMatch360</Text>
        </View>
      </Page>
    </Document>
  )
}
