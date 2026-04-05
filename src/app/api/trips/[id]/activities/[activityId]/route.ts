import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function verifyOwnership(
  supabase: ReturnType<typeof createClient>,
  activityId: string,
  userId: string,
  tripId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('activities')
    .select('day_id, itinerary_days!inner(trip_id, trips!inner(user_id, id))')
    .eq('id', activityId)
    .single()

  if (!data) return false
  const days = data.itinerary_days as unknown as { trip_id: string; trips: { user_id: string; id: string } } | null
  return !!(days && days.trips.user_id === userId && days.trips.id === tripId)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; activityId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ok = await verifyOwnership(supabase, params.activityId, user.id, params.id)
    if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const ALLOWED = ['name', 'description', 'start_time', 'duration_minutes', 'tips', 'category']
    const patch = Object.fromEntries(
      Object.entries(body as Record<string, unknown>).filter(([k]) => ALLOWED.includes(k))
    )

    const { error } = await supabase
      .from('activities')
      .update(patch)
      .eq('id', params.activityId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Activity PATCH error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; activityId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ok = await verifyOwnership(supabase, params.activityId, user.id, params.id)
    if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', params.activityId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Activity DELETE error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
