import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/trips/[id]/meta — lightweight trip info (no days/activities)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: trip, error } = await supabase
      .from('trips')
      .select('id, destination, start_date, end_date, preferences')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ trip })
  } catch (err) {
    console.error('Trip meta GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
