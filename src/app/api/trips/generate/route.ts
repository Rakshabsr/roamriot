import { NextRequest } from 'next/server'
import { buildItineraryWithClaude } from '@/lib/itinerary/claude-builder'
import { buildItineraryWithOSM } from '@/lib/itinerary/osm-builder'
import { searchYouTubeVlogs } from '@/lib/youtube/search'
import { createClient } from '@/lib/supabase/server'
import { GenerateItineraryRequest } from '@/lib/types'

// Allow up to 60 s on Vercel Pro / 10 s on Hobby (streams partial data either way)
export const maxDuration = 60

function encode(obj: object): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(obj) + '\n')
}

export async function POST(req: NextRequest) {
  const body: GenerateItineraryRequest = await req.json()
  const { destination, startDate, endDate, preferences } = body

  if (!destination || !startDate || !endDate) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const hasAnthropicKey = !!(process.env.ANTHROPIC_API_KEY)
        let days

        if (hasAnthropicKey) {
          controller.enqueue(encode({ type: 'progress', message: 'Building your itinerary with AI...' }))
          days = await buildItineraryWithClaude(destination, startDate, endDate, preferences)
        } else {
          controller.enqueue(encode({ type: 'progress', message: 'Scanning YouTube travel vlogs...' }))

          const ytTitles = await searchYouTubeVlogs(destination, preferences.dietary)
            .then(videos => videos.map(v => v.title))
            .catch(() => [] as string[])

          controller.enqueue(encode({ type: 'progress', message: 'Discovering real places from OpenStreetMap...' }))

          days = await buildItineraryWithOSM(destination, startDate, endDate, preferences, ytTitles)

          if (!days || !days.some(d => d.activities.length > 0)) {
            controller.enqueue(encode({
              type: 'error',
              error: `We couldn't find enough real places for "${destination}" yet. Try a nearby larger city or check the spelling.`,
            }))
            controller.close()
            return
          }
        }

        controller.enqueue(encode({ type: 'progress', message: 'Saving your trip...' }))

        let tripId: string | null = null
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

        controller.enqueue(encode({ type: 'done', tripId, days, sourceVideos: [] }))
      } catch (err) {
        console.error('Generate itinerary error:', err)
        controller.enqueue(encode({ type: 'error', error: 'Failed to generate itinerary' }))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',  // disables nginx buffering on some hosts
    },
  })
}
