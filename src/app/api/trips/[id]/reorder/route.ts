import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { dayId, activities } = await req.json() as {
      dayId: string
      activities: { id: string; order_index: number }[]
    }

    if (!dayId || !Array.isArray(activities)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Verify ownership: the day must belong to a trip owned by this user
    const { data: day } = await supabase
      .from('itinerary_days')
      .select('trip_id, trips!inner(user_id)')
      .eq('id', dayId)
      .single()

    const tripUserId = (day?.trips as unknown as { user_id: string } | null)?.user_id
    if (!day || tripUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Also verify the tripId in the URL matches
    if (day.trip_id !== params.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Batch update order_index for each activity
    await Promise.all(
      activities.map(({ id, order_index }) =>
        supabase.from('activities').update({ order_index }).eq('id', id)
      )
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Reorder error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
