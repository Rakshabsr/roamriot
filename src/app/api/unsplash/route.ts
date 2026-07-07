import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ url: null })

  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return NextResponse.json({ url: null })

  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(q + ' travel')}&orientation=landscape&content_filter=high`,
      { headers: { Authorization: `Client-ID ${key}` } },
    )
    if (!res.ok) return NextResponse.json({ url: null })
    const data = await res.json()
    const url = data?.urls?.regular ?? null
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ url: null })
  }
}
