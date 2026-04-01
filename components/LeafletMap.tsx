"use client"
import { useEffect, useRef } from 'react'

export type MapPin = {
  id: string
  lat: number
  lng: number
  type: 'client' | 'provider'
  label: string
  sublabel?: string
  color: string
  score?: number
  radius?: number       // service radius in miles
  showRadius?: boolean
  popupHtml: string
}

interface Props {
  pins: MapPin[]
  center?: [number, number]
  zoom?: number
  height?: number | string
  onPinClick?: (id: string) => void
}

export default function LeafletMap({ pins, center, zoom = 11, height = 480, onPinClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Inject Leaflet CSS once
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    let map: any
    let cancelled = false

    import('leaflet').then(({ default: L }) => {
      if (cancelled || !containerRef.current) return
      if (mapRef.current) { mapRef.current.remove() }

      // Determine center
      const defaultCenter: [number, number] = center ?? [39.05, -77.05]
      map = L.map(containerRef.current!, { zoomControl: true, scrollWheelZoom: true })
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

      const bounds: [number, number][] = []

      pins.forEach(pin => {
        if (!pin.lat || !pin.lng) return

        // Draw service radius circle for providers
        if (pin.showRadius && pin.radius) {
          const radiusMeters = pin.radius * 1609.34
          L.circle([pin.lat, pin.lng], {
            radius: radiusMeters,
            color: pin.color,
            fillColor: pin.color,
            fillOpacity: 0.06,
            weight: 1.5,
            opacity: 0.4,
            dashArray: '4 4',
          }).addTo(map)
        }

        // Create custom div icon
        const isClient = pin.type === 'client'
        const iconHtml = isClient
          ? `<div style="
              width:34px;height:34px;
              background:${pin.color};
              border:3px solid #fff;
              border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);
              box-shadow:0 2px 8px rgba(0,0,0,0.3);
            "></div>`
          : `<div style="
              width:30px;height:30px;
              background:${pin.color};
              border:2.5px solid #fff;
              border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              font-size:11px;font-weight:700;color:#fff;
              box-shadow:0 2px 6px rgba(0,0,0,0.25);
              font-family:sans-serif;
            ">${pin.label.charAt(0)}</div>`

        const icon = L.divIcon({
          html: iconHtml,
          iconSize: isClient ? [34, 34] : [30, 30],
          iconAnchor: isClient ? [17, 34] : [15, 15],
          className: '',
        })

        const marker = L.marker([pin.lat, pin.lng], { icon })
          .addTo(map)
          .bindPopup(pin.popupHtml, { maxWidth: 240 })

        if (onPinClick) {
          marker.on('click', () => onPinClick(pin.id))
        }

        bounds.push([pin.lat, pin.lng])
      })

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [50, 50] })
      } else if (bounds.length === 1) {
        map.setView(bounds[0], zoom)
      } else {
        map.setView(defaultCenter, zoom)
      }
    })

    return () => {
      cancelled = true
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [pins, center, zoom, onPinClick])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: 8,
        overflow: 'hidden',
        background: '#E8F4F8',
      }}
    />
  )
}
