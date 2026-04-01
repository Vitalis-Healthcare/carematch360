import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const siteNumber = searchParams.get('site') || process.env.AXISCARE_SITE_NUMBER
    const token = searchParams.get('token') || process.env.AXISCARE_API_TOKEN
    const startAfterId = searchParams.get('startAfterId')
    const statuses = searchParams.get('statuses') || 'Active'

    if (!siteNumber || !token) {
      return NextResponse.json({ error: 'Missing AxisCare site number or API token' }, { status: 400 })
    }

    // limit=500 is required — AxisCare returns null caregivers below this threshold
    const url = new URL(`https://${siteNumber}.axiscare.com/api/caregivers`)
    url.searchParams.set('limit', '500')
    url.searchParams.set('statuses', statuses)
    if (startAfterId) url.searchParams.set('startAfterId', startAfterId)

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-AxisCare-Api-Version': '2023-10-01',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `AxisCare error ${res.status}: ${text}` }, { status: res.status })
    }

    const data = await res.json()

    // AxisCare returns caregivers as a KEYED OBJECT {1:{...},2:{...}} not an array.
    // Normalise to array so client code works consistently.
    const raw = data?.results?.caregivers
    let caregivers: any[] = []
    if (raw != null) {
      caregivers = Array.isArray(raw) ? raw : Object.values(raw)
    }

    return NextResponse.json({
      ...data,
      results: {
        ...data.results,
        caregivers,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
