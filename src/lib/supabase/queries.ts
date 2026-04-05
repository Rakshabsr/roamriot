import { SupabaseClient } from '@supabase/supabase-js'
import { Trip, ItineraryDay, Activity } from '@/lib/types'

export type TripWithDays = Trip & { days: ItineraryDay[] }

export async function fetchTripWithDays(
  supabase: SupabaseClient,
  tripId: string
): Promise<TripWithDays | null> {
  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      itinerary_days (
        *,
        activities ( * )
      )
    `)
    .eq('id', tripId)
    .order('day_number', { referencedTable: 'itinerary_days', ascending: true })
    .order('order_index', { referencedTable: 'itinerary_days.activities', ascending: true })
    .single()

  if (error || !data) return null

  // Remap Supabase's nested key names to our type shape
  const days: ItineraryDay[] = (data.itinerary_days ?? []).map((d: Record<string, unknown>) => ({
    id: d.id as string,
    trip_id: d.trip_id as string,
    day_number: d.day_number as number,
    date: d.date as string,
    activities: ((d.activities ?? []) as Record<string, unknown>[]).map((a) => ({
      id: a.id,
      day_id: a.day_id,
      name: a.name,
      description: a.description ?? '',
      location: a.location ?? '',
      address: a.address,
      latitude: a.latitude,
      longitude: a.longitude,
      start_time: a.start_time,
      end_time: a.end_time,
      duration_minutes: a.duration_minutes ?? 60,
      category: a.category,
      price_range: a.price_range,
      estimated_cost: a.estimated_cost,
      rating: a.rating,
      source_videos: a.source_videos ?? [],
      order_index: a.order_index ?? 0,
      tips: a.tips,
      is_fixed: a.is_fixed ?? false,
      notes: a.notes,
    } as Activity)),
  }))

  const { itinerary_days: _removed, ...tripFields } = data as Record<string, unknown> & { itinerary_days: unknown }
  void _removed

  return { ...(tripFields as unknown as Trip), days }
}
