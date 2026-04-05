import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchTripWithDays, TripWithDays } from '@/lib/supabase/queries'
import TripView from './TripView'

export default async function TripPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/trips/${params.id}`)
  }

  const trip = await fetchTripWithDays(supabase, params.id)
  if (!trip) notFound()

  // Verify the trip belongs to this user
  if (trip.user_id !== user.id) notFound()

  return <TripView trip={trip} />
}
