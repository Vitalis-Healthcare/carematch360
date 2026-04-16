/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Document, Page, Text, View, Image, StyleSheet, Font, Link,
} from '@react-pdf/renderer'
import React from 'react'
import {
  type ApplicantData,
  CAPABILITY_LABELS,
  groupSkills,
  prettifyGender,
  prettifyShift,
} from './types'

// ──────────────────────────────────────────────────────────────
// Fonts — registered from Google Fonts CDN at module load.
// @react-pdf/renderer fetches and caches these per function cold start.
// ──────────────────────────────────────────────────────────────

Font.register({
  family: 'Cormorant Garamond',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/cormorantgaramond/v16/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYrEPjuw.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/cormorantgaramond/v16/co3YmX5slCNuHLi8bLeY9MK7whWMhyjornlYABQXKQ.ttf', fontWeight: 400, fontStyle: 'italic' },
    { src: 'https://fonts.gstatic.com/s/cormorantgaramond/v16/co3bmX5slCNuHLi8bLeY9MK7whWMhyjQr0PjuBC1.ttf', fontWeight: 500 },
    { src: 'https://fonts.gstatic.com/s/cormorantgaramond/v16/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYYUPjuBC1.ttf', fontWeight: 600 },
  ],
})

Font.register({
  family: 'DM Sans',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g7vcAFjwXFw.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vcAFjwXwXY.ttf', fontWeight: 500 },
    { src: 'https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g0PcAFjwXwXY.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g5vcAFjwXwXY.ttf', fontWeight: 700 },
  ],
})

// ──────────────────────────────────────────────────────────────
// Palette
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
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 54,
    backgroundColor: C.white,
    fontFamily: 'DM Sans',
    fontSize: 10,
    color: C.text,
  },

  // Header
  logoWrap: { alignItems: 'center', marginBottom: 18 },
  logo: { width: 180, height: 120, objectFit: 'contain' },
  headerBand: {
    backgroundColor: C.greenDark,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginBottom: 22,
  },
  headerEyebrow: {
    fontFamily: 'DM Sans', fontSize: 8, fontWeight: 700,
    letterSpacing: 2, color: C.greenLime, marginBottom: 3,
    textTransform: 'uppercase',
  },
  headerDate: { fontFamily: 'DM Sans', fontSize: 10, color: '#D9E8C8' },

  // Hero
  heroName: {
    fontFamily: 'Cormorant Garamond', fontSize: 26, fontWeight: 500,
    color: C.text, letterSpacing: -0.2, marginBottom: 4,
  },
  heroMeta: {
    fontFamily: 'DM Sans', fontSize: 10.5, color: C.muted, marginBottom: 2,
  },
  heroCredential: { color: C.greenDark, fontWeight: 600 },
  heroDot: { color: C.border },

  // Section
  sectionWrap: { marginTop: 18 },
  sectionHeader: {
    fontFamily: 'DM Sans', fontSize: 8.5, fontWeight: 700,
    letterSpacing: 1.6, color: C.greenDark, textTransform: 'uppercase',
    paddingBottom: 5, borderBottomWidth: 0.75, borderBottomColor: C.border,
    marginBottom: 8,
  },

  // Data rows
  row: { flexDirection: 'row', paddingVertical: 3.5 },
  rowLabel: {
    width: 110, fontFamily: 'DM Sans', fontSize: 9, color: C.muted,
    fontWeight: 500, paddingTop: 1,
  },
  rowValue: {
    flex: 1, fontFamily: 'DM Sans', fontSize: 10.5, color: C.text,
    fontWeight: 500, lineHeight: 1.4,
  },
  rowValueMono: {
    flex: 1, fontFamily: 'Courier', fontSize: 10, color: C.text,
  },
  rowValueMuted: { color: C.muted, fontWeight: 400 },

  // Chips
  chipWrap: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    backgroundColor: C.greenLight,
    borderWidth: 0.75, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2.5,
    fontFamily: 'DM Sans', fontSize: 9, color: C.greenDark, fontWeight: 500,
    marginRight: 4, marginBottom: 3.5,
  },

  // Capabilities grid
  capRow: { flexDirection: 'row', marginTop: 4 },
  capCell: {
    flexDirection: 'row', alignItems: 'center',
    width: '50%', paddingVertical: 4,
  },
  capCheckOn: {
    width: 12, height: 12, backgroundColor: C.greenBright, borderRadius: 6,
    marginRight: 8, textAlign: 'center',
    color: C.white, fontSize: 8, fontWeight: 700, lineHeight: 1.6,
  },
  capCheckOff: {
    width: 12, height: 12, borderWidth: 1, borderColor: C.border,
    borderRadius: 6, marginRight: 8,
  },
  capLabelOn:  { fontFamily: 'DM Sans', fontSize: 10, color: C.text, fontWeight: 600 },
  capLabelOff: { fontFamily: 'DM Sans', fontSize: 10, color: C.muted, fontWeight: 400 },

  // Skills group
  skillGroupLabel: {
    fontFamily: 'DM Sans', fontSize: 8.5, fontWeight: 600,
    letterSpacing: 0.6, color: C.greenMid, textTransform: 'uppercase',
    marginTop: 8, marginBottom: 5,
  },

  // Notes
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

  // Footer
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
  footerSub: { fontFamily: 'DM Sans', fontSize: 7.5, color: C.muted, marginTop: 2 },
})

// ──────────────────────────────────────────────────────────────
// Reusable row components
// ──────────────────────────────────────────────────────────────

function Row({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  const hasValue = value != null && String(value).trim() !== ''
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {hasValue ? (
        <Text style={mono ? styles.rowValueMono : styles.rowValue}>{value}</Text>
      ) : (
        <Text style={[styles.rowValue, styles.rowValueMuted]}>—</Text>
      )}
    </View>
  )
}

function ChipRow({ label, values }: { label: string; values: string[] }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {values && values.length > 0 ? (
        <View style={styles.chipWrap}>
          {values.map((v, i) => (
            <Text key={`${label}-${i}-${v}`} style={styles.chip}>{v}</Text>
          ))}
        </View>
      ) : (
        <Text style={[styles.rowValue, styles.rowValueMuted]}>—</Text>
      )}
    </View>
  )
}

function Capabilities({ caps }: { caps: ApplicantData['capabilities'] }) {
  // Build pairs of capability cells into rows of 2
  const rows: { key: string; label: string; present: boolean }[][] = []
  for (let i = 0; i < CAPABILITY_LABELS.length; i += 2) {
    const pair = [
      { ...CAPABILITY_LABELS[i], present: caps[CAPABILITY_LABELS[i].key] },
    ]
    if (CAPABILITY_LABELS[i + 1]) {
      pair.push({ ...CAPABILITY_LABELS[i + 1], present: caps[CAPABILITY_LABELS[i + 1].key] })
    }
    rows.push(pair as any)
  }
  return (
    <View>
      {rows.map((pair, rowIdx) => (
        <View key={rowIdx} style={styles.capRow}>
          {pair.map(({ key, label, present }) => (
            <View key={key} style={styles.capCell}>
              {present ? (
                <Text style={styles.capCheckOn}>✓</Text>
              ) : (
                <View style={styles.capCheckOff} />
              )}
              <Text style={present ? styles.capLabelOn : styles.capLabelOff}>{label}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

function SkillsBlock({ skills }: { skills: string[] }) {
  const groups = groupSkills(skills)
  if (groups.length === 0) {
    return <Text style={[styles.rowValue, styles.rowValueMuted, { marginTop: 4 }]}>No skills selected</Text>
  }
  return (
    <View>
      {groups.map(g => (
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
  )
}

function Notes({ text }: { text: string | null | undefined }) {
  if (!text || !text.trim()) {
    return <Text style={[styles.rowValue, styles.rowValueMuted, { marginTop: 4 }]}>No additional notes provided</Text>
  }
  return (
    <View style={styles.notesBox}>
      <Text style={styles.notesText}>{text}</Text>
    </View>
  )
}

// ──────────────────────────────────────────────────────────────
// Main document
// ──────────────────────────────────────────────────────────────

const fmtDate = (d: Date): string =>
  d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
    timeZone: 'America/New_York', timeZoneName: 'short',
  })

export function ApplyNotificationPdf({
  applicant,
  logoDataUrl,
}: {
  applicant: ApplicantData
  logoDataUrl: string
}) {
  const locationLine = [applicant.city, applicant.state].filter(Boolean).join(', ') || 'Location not provided'
  const fullAddress = [
    applicant.address,
    [applicant.city, applicant.state].filter(Boolean).join(', '),
    applicant.zip,
  ].filter(Boolean).join(' · ') || null

  const yearsExp = applicant.years_experience != null && String(applicant.years_experience).trim() !== ''
    ? `${applicant.years_experience} year${String(applicant.years_experience) === '1' ? '' : 's'}`
    : null

  const radius = applicant.service_radius_miles != null
    ? `${applicant.service_radius_miles} mile${applicant.service_radius_miles === 1 ? '' : 's'}`
    : null

  const shifts = (applicant.shift_preferences || []).map(prettifyShift)

  return (
    <Document
      title={`Vitalis Application — ${applicant.name}`}
      author="Vitalis HealthCare Services LLC"
      subject="New Provider Application"
    >
      <Page size="LETTER" style={styles.page}>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Image style={styles.logo} src={logoDataUrl} />
        </View>

        {/* Header band */}
        <View style={styles.headerBand}>
          <Text style={styles.headerEyebrow}>New Provider Application</Text>
          <Text style={styles.headerDate}>Submitted {fmtDate(applicant.submitted_at)}</Text>
        </View>

        {/* Hero */}
        <View>
          <Text style={styles.heroName}>{applicant.name}</Text>
          <Text style={styles.heroMeta}>
            <Text style={styles.heroCredential}>{applicant.credential_type}</Text>
            <Text style={styles.heroDot}>  ·  </Text>
            {locationLine}
          </Text>
        </View>

        {/* Personal */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeader}>Personal</Text>
          <Row label="Email"   value={applicant.email}/>
          <Row label="Phone"   value={applicant.phone}/>
          <Row label="Address" value={fullAddress}/>
          <Row label="Gender"  value={prettifyGender(applicant.gender)}/>
        </View>

        {/* Credentials */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeader}>Credentials</Text>
          <Row      label="Primary"    value={applicant.credential_type}/>
          <Row      label="License #"  value={applicant.license_number} mono/>
          <ChipRow  label="Additional" values={applicant.additional_credentials || []}/>
          <Row      label="Experience" value={yearsExp}/>
        </View>

        {/* Availability */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeader}>Availability</Text>
          <ChipRow label="Shifts"         values={shifts}/>
          <ChipRow label="Days"           values={applicant.preferred_days || []}/>
          <Row     label="Service radius" value={radius}/>
        </View>

        {/* Capabilities */}
        <View style={styles.sectionWrap} wrap={false}>
          <Text style={styles.sectionHeader}>Capabilities</Text>
          <Capabilities caps={applicant.capabilities}/>
        </View>

        {/* Skills */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeader}>Skills</Text>
          <SkillsBlock skills={applicant.skills || []}/>
        </View>

        {/* Notes */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeader}>Notes</Text>
          <Notes text={applicant.notes}/>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View>
            <Text style={styles.footerLeft}>Vitalis HealthCare Services LLC</Text>
            <Text style={styles.footerSub}>Silver Spring, MD · Maryland OHCQ License #3879R</Text>
          </View>
          <Text
            style={styles.footerRight}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>

      </Page>
    </Document>
  )
}
