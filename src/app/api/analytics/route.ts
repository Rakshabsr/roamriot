import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event, ...properties } = body

    if (!event || typeof event !== 'string') {
      return NextResponse.json({ error: 'Missing event' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Session ID from cookie (set client-side, helps group anonymous sessions)
    const sessionId = req.cookies.get('rr_session')?.value ?? null

    // Geo approximation from headers (Vercel injects these)
    const country = req.headers.get('x-vercel-ip-country') ?? null
    const city    = req.headers.get('x-vercel-ip-city') ?? null

    await supabase.from('analytics_events').insert({
      event_type:  event,
      user_id:     user?.id ?? null,
      session_id:  sessionId,
      properties:  properties,
      country,
      city,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    // Never surface analytics errors to the client
    console.error('[analytics]', err)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
