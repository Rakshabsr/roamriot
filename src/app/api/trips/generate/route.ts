import { NextRequest, NextResponse } from 'next/server'
import { buildItineraryWithClaude } from '@/lib/itinerary/claude-builder'
import { searchYouTubeVlogs } from '@/lib/youtube/search'
import { buildItinerary } from '@/lib/itinerary/builder'
import { createClient } from '@/lib/supabase/server'
import { GenerateItineraryRequest } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body: GenerateItineraryRequest = await req.json()
    const { destination, startDate, endDate, preferences } = body

    if (!destination || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Generate itinerary — Claude if key available, else YouTube+builder fallback
    let days
    const hasAnthropicKey = !!(process.env.ANTHROPIC_API_KEY)

    if (hasAnthropicKey) {
      days = await buildItineraryWithClaude(destination, startDate, endDate, preferences)
    } else {
      const videos = await searchYouTubeVlogs(destination, preferences.dietary)
      days = buildItinerary(destination, startDate, endDate, preferences, videos)
    }

    // 2. Save to Supabase (if user authenticated)
    let tripId: string | null = null
    const sourceVideos: [] = []

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: trip, error: tripErr } = await supabase
          .from('trips')
          .insert({ user_id: user.id, destination, start_date: startDate, end_date: endDate, preferences })
          .select('id')
          .single()

        if (tripErr) throw tripErr
        tripId = trip.id

        for (const day of days) {
          const { data: dbDay, error: dayErr } = await supabase
            .from('itinerary_days')
            .insert({ trip_id: tripId, day_number: day.day_number, date: day.date })
            .select('id')
            .single()

          if (dayErr) continue

          const activitiesToInsert = day.activities.map(a => ({
            day_id:           dbDay.id,
            name:             a.name,
            description:      a.description,
            location:         a.location,
            start_time:       a.start_time,
            duration_minutes: a.duration_minutes,
            category:         a.category,
            price_range:      a.price_range,
            rating:           a.rating,
            source_videos:    a.source_videos,
            order_index:      a.order_index,
            tips:             a.tips,
          }))

          await supabase.from('activities').insert(activitiesToInsert)
        }
      }
    } catch {
      // Supabase save failed — still return the generated itinerary
    }

    return NextResponse.json({ tripId, days, sourceVideos })
  } catch (err) {
    console.error('Generate itinerary error:', err)
    return NextResponse.json({ error: 'Failed to generate itinerary' }, { status: 500 })
  }
}
