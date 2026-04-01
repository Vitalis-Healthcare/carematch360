import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const siteNumber = searchParams.get('site') || process.env.AXISCARE_SITE_NUMBER
    const token = searchParams.get('token') || process.env.AXISCARE_API_TOKEN
    const startAfterId = searchParams.get('startAfterId')
    const limit = searchParams.get('limit') || '200'
    const statuses = searchParams.get('statuses') || 'Active'

    if (!siteNumber || !token) {
      return NextResponse.json({ error: 'Missing AxisCare site number or API token' }, { status: 400 })
    }

    const url = new URL(`https://${siteNumber}.axiscare.com/api/clients`)
    url.searchParams.set('limit', limit)
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
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
