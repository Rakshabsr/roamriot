import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/trips/[id]/today — returns today's itinerary day + activities
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const today = new Date().toISOString().split('T')[0]

    const { data: day, error } = await supabase
      .from('itinerary_days')
      .select(`
        id, trip_id, day_number, date,
        activities ( id, name, start_time, duration_minutes, category, location, order_index )
      `)
      .eq('trip_id', params.id)
      .eq('date', today)
      .order('order_index', { referencedTable: 'activities', ascending: true })
      .single()

    if (error || !day) return NextResponse.json({ day: null })

    // Verify ownership
    const { data: trip } = await supabase
      .from('trips')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (!trip || trip.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    return NextResponse.json({ day })
  } catch (err) {
    console.error('Today GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
