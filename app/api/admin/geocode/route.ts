import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

async function geocodeAddress(address: string, city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  const query = [address, city, state, 'USA'].filter(Boolean).join(', ')
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=US&limit=1&types=address`

  try {
    const res = await fetch(url)
    const data = await res.json()
    if (data.features?.length > 0) {
      const [lng, lat] = data.features[0].center
      return { lat, lng }
    }
    // Fallback: try just city + state
    const fallbackUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(`${city}, ${state}, USA`)}.json?access_token=${MAPBOX_TOKEN}&country=US&limit=1&types=place`
    const res2 = await fetch(fallbackUrl)
    const data2 = await res2.json()
    if (data2.features?.length > 0) {
      const [lng, lat] = data2.features[0].center
      return { lat, lng }
    }
  } catch {}
  return null
}

export async function POST(req: NextRequest) {
  try {
    const { type = 'all' } = await req.json().catch(() => ({}))
    const db = createServiceClient()
    const results = { providers: { updated: 0, failed: 0, skipped: 0 }, clients: { updated: 0, failed: 0, skipped: 0 } }

    // Geocode providers
    if (type === 'all' || type === 'providers') {
      const { data: providers } = await db
        .from('providers')
        .select('id, name, address, city, state, lat, lng')
        .order('name')

      for (const p of providers ?? []) {
        if (!p.city) { results.providers.skipped++; continue }
        const coords = await geocodeAddress(p.address ?? '', p.city, p.state ?? 'MD')
        if (coords) {
          await db.from('providers').update({ lat: coords.lat, lng: coords.lng }).eq('id', p.id)
          results.providers.updated++
        } else {
          results.providers.failed++
        }
        // Rate limit: Mapbox allows 600 req/min, we stay safe
        await new Promise(r => setTimeout(r, 120))
      }
    }

    // Geocode clients
    if (type === 'all' || type === 'clients') {
      const { data: clients } = await db
        .from('clients')
        .select('id, name, address, city, state, lat, lng')
        .order('name')

      for (const c of clients ?? []) {
        if (!c.city) { results.clients.skipped++; continue }
        const coords = await geocodeAddress(c.address ?? '', c.city, c.state ?? 'MD')
        if (coords) {
          await db.from('clients').update({ lat: coords.lat, lng: coords.lng }).eq('id', c.id)
          results.clients.updated++
        } else {
          results.clients.failed++
        }
        await new Promise(r => setTimeout(r, 120))
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  // Quick stats: how many records have coords vs not
  const db = createServiceClient()
  const { data: providers } = await db.from('providers').select('id, lat, lng, city')
  const { data: clients } = await db.from('clients').select('id, lat, lng, city')

  const pWithCoords = (providers ?? []).filter(p => p.lat && p.lng).length
  const cWithCoords = (clients ?? []).filter(c => c.lat && c.lng).length

  return NextResponse.json({
    providers: { total: providers?.length ?? 0, with_coords: pWithCoords, missing: (providers?.length ?? 0) - pWithCoords },
    clients: { total: clients?.length ?? 0, with_coords: cWithCoords, missing: (clients?.length ?? 0) - cWithCoords },
  })
}
