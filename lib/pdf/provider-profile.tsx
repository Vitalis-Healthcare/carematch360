/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/pdf/provider-profile.tsx (v2.7.24)
//
// Branded provider-profile PDF, printable and downloadable by staff.
// One <Page> per provider; accepts an array so v2.7.25 (directory
// multi-select) and v2.7.26 (case matching results) reuse this exact
// template. Optional per-provider match context (score / distance /
// skills matched) renders as a highlighted band when supplied.
//
// Follows the same architecture as lib/email/apply-notification-pdf.tsx:
//   - Fonts arrive as base64 data URIs in a FontBundle (TTF/WOFF only,
//     NOT WOFF2 — react-pdf limitation, see pitfall 18).
//   - Assets are loaded by the CALLING route with static path.resolve
//     so Vercel's file tracer bundles them (see pitfall notes in
//     app/api/providers/apply/route.ts — do NOT centralize loading).

import {
  Document, Page, Text, View, Image, StyleSheet, Font, Svg, Path,
} from '@react-pdf/renderer'
import React from 'react'
import {
  groupSkills,
  prettifyGender,
  prettifyShift,
  stripNotesPrefix,
} from '@/lib/email/types'
import { CREDENTIAL_LABELS, CredentialType } from '@/types'

// ──────────────────────────────────────────────────────────────
// Fonts — same bundle shape as the apply-notification PDF
// ──────────────────────────────────────────────────────────────

export type FontBundle = {
  cormorant400: string
  cormorant400Italic: string
  cormorant500: string
  cormorant600: string
  dmsans400: string
  dmsans500: string
  dmsans600: string
  dmsans700: string
}

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

// ──────────────────────────────────────────────────────────────
// Data shapes
// ──────────────────────────────────────────────────────────────

/** Optional match context — rendered when printing from a case. */
export type MatchContext = {
  caseTitle: string | null
  matchScore: number
  distanceMiles: number | null
  skillMatchCount: number | null
  skillsRequired: number | null
}

/** The provider fields this template reads. Matches `providers` columns. */
export type ProviderProfile = {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  credential_type: string
  additional_credentials: string[] | null
  license_number: string | null
  skills: string[] | null
  preferred_days: string[] | null
  shift_preferences: string[] | null
  service_radius_miles: number | null
  available: boolean
  status: string
  gender: string | null
  has_car: boolean
  spanish_speaking: boolean
  meal_prep: boolean
  total_care: boolean
  wheelchair_transfer: boolean
  hoyer_lift: boolean
  notes: string | null
  created_at: string | null
  match?: MatchContext | null
}

// ──────────────────────────────────────────────────────────────
// Palette + styles (mirrors apply-notification-pdf.tsx)
// ──────────────────────────────────────────────────────────────

const C = {
  greenDark:   '#2D5A1B',
  greenMid:    '#4A7C2F',
  greenBright: '#7AB52A',
  greenLime:   '#9DCF3A',
  greenLight:  '#EBF5DF',
  greenPale:   '#F4FAF0',
  text:        '#1A2E10',
  muted:       '#5A7050',
  border:      '#C8DDB8',
  white:       '#FFFFFF',
  cream:       '#FDFCF7',
  amber:       '#B07D1E',
  red:         '#A63A2E',
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 54,
    backgroundColor: C.white,
    fontFamily: 'DM Sans',
    fontSize: 10,
    color: C.text,
  },
  logoWrap: { alignItems: 'center', marginBottom: 14 },
  logo: { width: 150, height: 100, objectFit: 'contain' },
  headerBand: {
    backgroundColor: C.greenDark,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerEyebrow: {
    fontFamily: 'DM Sans', fontSize: 8, fontWeight: 700,
    letterSpacing: 2, color: C.greenLime,
    textTransform: 'uppercase',
  },
  headerDate: { fontFamily: 'DM Sans', fontSize: 9, color: '#D9E8C8' },

  heroName: {
    fontFamily: 'Cormorant Garamond', fontSize: 26, fontWeight: 500,
    color: C.text, letterSpacing: -0.2, marginBottom: 4,
  },
  heroMeta: {
    fontFamily: 'DM Sans', fontSize: 10.5, color: C.muted, marginBottom: 2,
  },
  heroCredential: { color: C.greenDark, fontWeight: 600 },
  heroDot: { color: C.border },

  statusRow: { flexDirection: 'row', marginTop: 6 },
  statusPill: {
    borderRadius: 9, paddingHorizontal: 9, paddingVertical: 2.5,
    fontFamily: 'DM Sans', fontSize: 8.5, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: 0.8, marginRight: 5,
  },

  matchBand: {
    backgroundColor: C.greenPale,
    borderWidth: 0.75, borderColor: C.border, borderRadius: 4,
    paddingVertical: 8, paddingHorizontal: 14,
    marginTop: 12, flexDirection: 'row',
  },
  matchCell: { marginRight: 26 },
  matchLabel: {
    fontFamily: 'DM Sans', fontSize: 7.5, fontWeight: 700,
    letterSpacing: 1.2, color: C.greenMid, textTransform: 'uppercase',
    marginBottom: 2,
  },
  matchValue: { fontFamily: 'DM Sans', fontSize: 12, fontWeight: 700, color: C.greenDark },

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
    backgroundColor: C.greenLight,
    borderWidth: 0.75, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2.5,
    fontFamily: 'DM Sans', fontSize: 9, color: C.greenDark, fontWeight: 500,
    marginRight: 4, marginBottom: 3.5,
  },

  capRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  capCell: {
    flexDirection: 'row', alignItems: 'center',
    width: '50%', paddingVertical: 4,
  },
  capCheckOn: {
    width: 12, height: 12, backgroundColor: C.greenBright, borderRadius: 6,
    marginRight: 8, alignItems: 'center', justifyContent: 'center',
  },
  capCheckOff: {
    width: 12, height: 12, borderWidth: 1, borderColor: C.border,
    borderRadius: 6, marginRight: 8,
  },
  capLabelOn:  { fontFamily: 'DM Sans', fontSize: 10, color: C.text, fontWeight: 600 },
  capLabelOff: { fontFamily: 'DM Sans', fontSize: 10, color: C.muted, fontWeight: 400 },

  skillGroupLabel: {
    fontFamily: 'DM Sans', fontSize: 8.5, fontWeight: 600,
    letterSpacing: 0.6, color: C.greenMid, textTransform: 'uppercase',
    marginTop: 8, marginBottom: 5,
  },

  notesBox: {
    backgroundColor: C.cream,
    borderLeftWidth: 2.5, borderLeftColor: C.greenBright,
    paddingVertical: 10, paddingHorizontal: 14,
    marginTop: 4,
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
  footerLeft: {
    fontFamily: 'Cormorant Garamond', fontSize: 10, fontWeight: 500,
    color: C.greenDark,
  },
  footerRight: { fontFamily: 'DM Sans', fontSize: 8, color: C.muted },
})

// ──────────────────────────────────────────────────────────────
// Reusable pieces
// ──────────────────────────────────────────────────────────────

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
          {values.map((v) => (
            <Text key={v} style={styles.chip}>{v}</Text>
          ))}
        </View>
      ) : (
        <Text style={[styles.rowValue, styles.rowValueMuted]}>—</Text>
      )}
    </View>
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

const PROFILE_CAPABILITIES: { key: keyof ProviderProfile; label: string }[] = [
  { key: 'has_car', label: 'Has a car' },
  { key: 'spanish_speaking', label: 'Spanish speaking' },
  { key: 'meal_prep', label: 'Meal preparation' },
  { key: 'total_care', label: 'Total care' },
  { key: 'wheelchair_transfer', label: 'Wheelchair transfer' },
  { key: 'hoyer_lift', label: 'Hoyer lift' },
]

// ──────────────────────────────────────────────────────────────
// One provider = one page (content wraps to extra pages if long)
// ──────────────────────────────────────────────────────────────

function ProviderPage({
  provider,
  logoDataUri,
  generatedAt,
}: {
  provider: ProviderProfile
  logoDataUri: string
  generatedAt: string
}) {
  const address = [provider.address, provider.city, provider.state, provider.zip]
    .filter((s) => s != null && String(s).trim() !== '')
    .join(', ')
  const skillGroups = groupSkills(provider.skills ?? [])
  const notes = stripNotesPrefix(provider.notes)
  const m = provider.match

  return (
    <Page size="LETTER" style={styles.page}>
      {logoDataUri ? (
        <View style={styles.logoWrap}>
          <Image src={logoDataUri} style={styles.logo} />
        </View>
      ) : null}

      <View style={styles.headerBand}>
        <Text style={styles.headerEyebrow}>Provider Profile</Text>
        <Text style={styles.headerDate}>{generatedAt}</Text>
      </View>

      <Text style={styles.heroName}>{provider.name}</Text>
      <Text style={styles.heroMeta}>
        <Text style={styles.heroCredential}>{credentialLabel(provider.credential_type)}</Text>
        {provider.city ? (
          <>
            <Text style={styles.heroDot}>  ·  </Text>
            <Text>{[provider.city, provider.state].filter(Boolean).join(', ')}</Text>
          </>
        ) : null}
      </Text>

      <View style={styles.statusRow}>
        <Text
          style={[
            styles.statusPill,
            provider.status === 'active'
              ? { backgroundColor: C.greenLight, color: C.greenDark }
              : { backgroundColor: '#F1E8D8', color: C.amber },
          ]}
        >
          {provider.status === 'active' ? 'Active' : provider.status}
        </Text>
        <Text
          style={[
            styles.statusPill,
            provider.available
              ? { backgroundColor: C.greenLight, color: C.greenDark }
              : { backgroundColor: '#F3E3E0', color: C.red },
          ]}
        >
          {provider.available ? 'Available for cases' : 'Not available'}
        </Text>
      </View>

      {m ? (
        <View style={styles.matchBand}>
          {m.caseTitle ? (
            <View style={styles.matchCell}>
              <Text style={styles.matchLabel}>Case</Text>
              <Text style={styles.matchValue}>{m.caseTitle}</Text>
            </View>
          ) : null}
          <View style={styles.matchCell}>
            <Text style={styles.matchLabel}>Match score</Text>
            <Text style={styles.matchValue}>{m.matchScore}/100</Text>
          </View>
          <View style={styles.matchCell}>
            <Text style={styles.matchLabel}>Distance</Text>
            <Text style={styles.matchValue}>
              {m.distanceMiles != null ? `${Number(m.distanceMiles).toFixed(1)} mi` : '—'}
            </Text>
          </View>
          {m.skillMatchCount != null ? (
            <View style={styles.matchCell}>
              <Text style={styles.matchLabel}>Skills matched</Text>
              <Text style={styles.matchValue}>
                {m.skillMatchCount}
                {m.skillsRequired != null ? `/${m.skillsRequired}` : ''}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionHeader}>Contact</Text>
        <Row label="Phone" value={provider.phone} />
        <Row label="Email" value={provider.email} />
        <Row label="Address" value={address} />
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionHeader}>Credentials</Text>
        <Row label="Primary" value={credentialLabel(provider.credential_type)} />
        <ChipRow
          label="Also certified as"
          values={(provider.additional_credentials ?? []).map(credentialLabel)}
        />
        <Row label="License #" value={provider.license_number} />
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionHeader}>Availability</Text>
        <ChipRow
          label="Shifts"
          values={(provider.shift_preferences ?? []).map(prettifyShift)}
        />
        <ChipRow label="Days" values={provider.preferred_days ?? []} />
        <Row
          label="Service radius"
          value={
            provider.service_radius_miles != null
              ? `${provider.service_radius_miles} miles`
              : null
          }
        />
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionHeader}>Details</Text>
        <Row label="Gender" value={prettifyGender(provider.gender)} />
        <Row label="Joined" value={formatDate(provider.created_at)} />
        {/* v2.7.25a — wrap={false}: the 6-cell grid moves to the next
            page as a unit instead of straddling the break. */}
        <View style={styles.capRow} wrap={false}>
          {PROFILE_CAPABILITIES.map(({ key, label }) => {
            const on = Boolean(provider[key])
            return (
              <View key={key} style={styles.capCell}>
                {on ? (
                  // v2.7.25 — vector check. The '✓' text glyph is not in
                  // DM Sans, so v2.7.24 printed a bare dot. An Svg Path
                  // renders crisply regardless of font coverage.
                  <View style={styles.capCheckOn}>
                    <Svg width={7} height={6} viewBox="0 0 7 6">
                      <Path
                        d="M0.8 3.1 L2.7 5 L6.2 0.9"
                        stroke={C.white}
                        strokeWidth={1.3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </Svg>
                  </View>
                ) : (
                  <View style={styles.capCheckOff} />
                )}
                <Text style={on ? styles.capLabelOn : styles.capLabelOff}>{label}</Text>
              </View>
            )
          })}
        </View>
      </View>

      {skillGroups.length > 0 ? (
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeader}>Skills</Text>
          {/* v2.7.25a — mirror the proven SkillsBlock structure from
              apply-notification-pdf.tsx: a plain row/wrap View with NO
              flex property (reusing chipWrap's flex:1 collapsed the
              measured height and stacked the next label on top), and
              wrap={false} per group so a label never detaches from its
              chips at a page break. */}
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

      {notes ? (
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeader}>Notes</Text>
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{notes}</Text>
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

// ──────────────────────────────────────────────────────────────
// Document — array in, one page (or more, if content wraps) per provider
// ──────────────────────────────────────────────────────────────

export function ProviderProfileDocument({
  providers,
  logoDataUri,
  fonts,
}: {
  providers: ProviderProfile[]
  logoDataUri: string
  fonts: FontBundle
}) {
  registerFontsOnce(fonts)
  const generatedAt = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  return (
    <Document
      title={
        providers.length === 1
          ? `Provider Profile — ${providers[0].name}`
          : `Provider Profiles (${providers.length})`
      }
      author="Vitalis Healthcare Services"
    >
      {providers.map((p) => (
        <ProviderPage
          key={p.id}
          provider={p}
          logoDataUri={logoDataUri}
          generatedAt={generatedAt}
        />
      ))}
    </Document>
  )
}
