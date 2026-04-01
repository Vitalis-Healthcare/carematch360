// Nominatim geocoder (OpenStreetMap) — no API key required
// Rate limit: 1 req/sec max. We geocode only on save, not on every render.

export interface GeoResult {
  lat: number | null
  lng: number | null
}

export async function geocodeAddress(
  address: string | null,
  city: string | null,
  state: string | null,
  zip: string | null
): Promise<GeoResult> {
  const parts = [address, city, state, zip].filter(Boolean)
  if (parts.length === 0) return { lat: null, lng: null }

  const query = encodeURIComponent(parts.join(', ') + ', USA')
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=us`,
      { headers: { 'User-Agent': 'CareMatch360/1.0 (contact@vitalis.care)' } }
    )
    if (!res.ok) return { lat: null, lng: null }
    const data = await res.json()
    if (!data || data.length === 0) return { lat: null, lng: null }
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    }
  } catch {
    return { lat: null, lng: null }
  }
}

// Maryland city fallback coordinates (used when full geocoding fails)
const MD_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'silver spring':  { lat: 38.9907, lng: -77.0261 },
  'laurel':         { lat: 39.0993, lng: -76.8483 },
  'rockville':      { lat: 39.0840, lng: -77.1528 },
  'hyattsville':    { lat: 38.9554, lng: -76.9455 },
  'gaithersburg':   { lat: 39.1434, lng: -77.2014 },
  'beltsville':     { lat: 39.0298, lng: -76.9199 },
  'wheaton':        { lat: 39.0376, lng: -77.0577 },
  'bethesda':       { lat: 38.9847, lng: -77.0947 },
  'germantown':     { lat: 39.1732, lng: -77.2717 },
  'college park':   { lat: 38.9807, lng: -76.9369 },
  'greenbelt':      { lat: 39.0046, lng: -76.8755 },
  'takoma park':    { lat: 38.9773, lng: -77.0075 },
  'waldorf':        { lat: 38.6318, lng: -76.9197 },
  'annapolis':      { lat: 38.9784, lng: -76.4922 },
  'baltimore':      { lat: 39.2904, lng: -76.6122 },
  'columbia':       { lat: 39.2037, lng: -76.8610 },
  'ellicott city':  { lat: 39.2673, lng: -76.7983 },
}

export function cityFallback(city: string | null, state: string | null): GeoResult {
  if (!city) return { lat: null, lng: null }
  const key = city.toLowerCase().trim()
  const coords = MD_CITY_COORDS[key]
  if (coords) return coords
  // Default to Silver Spring MD if unknown
  if (state?.toUpperCase() === 'MD') return { lat: 38.9907, lng: -77.0261 }
  return { lat: null, lng: null }
}
