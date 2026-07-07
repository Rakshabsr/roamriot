import { NextRequest, NextResponse } from 'next/server'

// GET /api/currency?from=INR&to=JPY
// Uses exchangerate-api.io open endpoint — free, no key needed
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = (searchParams.get('from') ?? 'INR').toUpperCase()
  const to   = (searchParams.get('to')   ?? 'USD').toUpperCase()

  if (from === to) return NextResponse.json({ rate: 1, from, to })

  try {
    const res = await fetch(
      `https://open.er-api.com/v6/latest/${from}`,
      { next: { revalidate: 3600 } } // cache 1h
    )
    const data = await res.json()
    if (data.result !== 'success' || !data.rates?.[to]) {
      return NextResponse.json({ error: 'Rate not available' }, { status: 404 })
    }
    return NextResponse.json({ rate: data.rates[to], from, to, updated: data.time_last_update_utc })
  } catch (err) {
    console.error('Currency error:', err)
    return NextResponse.json({ error: 'Failed to fetch rate' }, { status: 500 })
  }
}
