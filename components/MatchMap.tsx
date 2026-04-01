"use client"
import dynamic from 'next/dynamic'
import { type MapPin } from './LeafletMap'
import { getScoreColor, getScoreLabel } from '@/lib/matching'

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false })

interface ProviderPin {
  provider_id: string
  name: string
  credential_type: string
  lat: number | null
  lng: number | null
  match_score: number
  distance_miles: number | null
  is_available: boolean
  match_notes: string
}

interface Props {
  clientLat: number | null
  clientLng: number | null
  clientName: string
  providers: ProviderPin[]
  onAssign?: (providerId: string) => void
  height?: number
}

export default function MatchMap({ clientLat, clientLng, clientName, providers, onAssign, height = 440 }: Props) {
  const pins: MapPin[] = []

  // Client pin
  if (clientLat != null && clientLng != null) {
    pins.push({
      id: 'client',
      lat: clientLat,
      lng: clientLng,
      type: 'client',
      label: clientName,
      color: '#0B3D5C',
      popupHtml: `
        <div style="font-family:sans-serif;padding:2px 0">
          <strong style="font-size:13px">📍 ${clientName}</strong>
          <div style="font-size:11px;color:#64748B;margin-top:3px">Case location</div>
        </div>`,
    })
  }

  // Provider pins
  providers.forEach((p, i) => {
    if (p.lat == null || p.lng == null) return
    const color = getScoreColor(p.match_score)
    const rank = i + 1
    const distText = p.distance_miles != null ? `${p.distance_miles.toFixed(1)} mi away` : 'Distance unknown'
    const assignBtn = onAssign
      ? `<button
           onclick="(function(){var e=new CustomEvent('cm-assign',{detail:'${p.provider_id}',bubbles:true});document.dispatchEvent(e)})()"
           style="margin-top:8px;background:#0EA5E9;color:#fff;border:none;padding:5px 12px;border-radius:6px;font-size:12px;cursor:pointer;width:100%">
           Assign #${rank} to case
         </button>`
      : ''

    pins.push({
      id: p.provider_id,
      lat: p.lat,
      lng: p.lng,
      type: 'provider',
      label: `${rank}. ${p.name}`,
      color,
      popupHtml: `
        <div style="font-family:sans-serif;min-width:200px;padding:2px 0">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
            <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0"></div>
            <strong style="font-size:13px">#${rank} ${p.name}</strong>
          </div>
          <div style="font-size:11px;color:#64748B;margin-bottom:6px">${p.credential_type}</div>
          <div style="margin-bottom:4px">
            <span style="font-size:15px;font-weight:700;color:${color}">${p.match_score}</span>
            <span style="font-size:11px;color:#94A3B8;margin-left:4px">${getScoreLabel(p.match_score)}</span>
          </div>
          <div style="font-size:11.5px;color:#64748B;margin-bottom:3px">📍 ${distText}</div>
          <div style="font-size:11.5px;color:${p.is_available?'#10B981':'#EF4444'}">
            ${p.is_available ? '✓ Available' : '✗ Unavailable'}
          </div>
          ${p.match_notes ? `<div style="font-size:10px;color:#94A3B8;border-top:1px solid #E2E8F0;margin-top:5px;padding-top:5px">${p.match_notes}</div>` : ''}
          ${assignBtn}
        </div>`,
    })
  })

  const hasPins = pins.some(p => p.lat != null && p.lng != null)

  if (!hasPins) {
    return (
      <div style={{
        width: '100%', height: `${height}px`,
        background: 'var(--bg)', borderRadius: 8,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: 'var(--muted)', textAlign: 'center', padding: 32,
      }}>
        <div style={{fontSize: 32, marginBottom: 12}}>📍</div>
        <div style={{fontWeight: 600, marginBottom: 6}}>No coordinates yet</div>
        <div style={{fontSize: 13}}>
          Run the SQL patch (patch_001_coordinates.sql) to add coordinates to existing records.
          New providers and clients are geocoded automatically when saved.
        </div>
      </div>
    )
  }

  return <LeafletMap pins={pins} height={height} />
}
