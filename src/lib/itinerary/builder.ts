import {
  ItineraryDay, Activity, ActivityCategory, SourceVideo,
  TripPreferences, YouTubeSearchResult, DaySummary
} from '@/lib/types'
import { getDayDates } from '@/lib/utils'
import { extractPlacesFromVideo } from '@/lib/youtube/search'

// ─── Time helpers ─────────────────────────────────────────────────────────

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

function addMinutes(time: string, mins: number): string {
  return minutesToTime(timeToMinutes(time) + mins)
}

// ─── Full-day slot template ────────────────────────────────────────────────
// Each slot: { time, category, durationMin, label, tips, priceKey }

interface Slot {
  time: string
  category: ActivityCategory
  duration: number
  placeholderName: string
  tips: string
  fixed?: boolean
}

function getDaySlots(
  isDay1: boolean,
  isLastDay: boolean,
  prefs: TripPreferences
): Slot[] {
  const flight   = prefs.flight
  const hotel    = prefs.hotel
  const vegTip   = prefs.dietary !== 'none' ? 'Ask for the veg/Jain menu.' : 'Try the local specialty.'

  const slots: Slot[] = []

  // Day 1: flight arrival anchor
  if (isDay1 && flight) {
    slots.push({
      time: flight.arrivalTime,
      category: 'transport',
      duration: 45,
      placeholderName: `Land at ${flight.arrivalAirport ?? 'airport'}`,
      tips: `${flight.airline ?? ''} ${flight.flightNumber ?? ''} arriving from ${flight.departureCity}. Allow 45 min for baggage + exit.`,
      fixed: true,
    })
    const transferEnd = addMinutes(flight.arrivalTime, 60)
    slots.push({
      time: transferEnd,
      category: 'transport',
      duration: 30,
      placeholderName: 'Airport transfer to hotel',
      tips: 'Pre-book a cab or take the airport metro to save time.',
    })
  }

  // Hotel check-in anchor
  if (hotel && (isDay1 || isLastDay)) {
    const ciTime = isDay1 ? hotel.checkInTime : hotel.checkOutTime
    slots.push({
      time: ciTime,
      category: 'accommodation',
      duration: 30,
      placeholderName: isDay1 ? `Check in — ${hotel.name}` : `Check out — ${hotel.name}`,
      tips: isDay1 ? 'Drop bags and freshen up before heading out.' : 'Store luggage at the hotel after check-out.',
      fixed: true,
    })
  }

  // ── Standard full-day slots ──
  // Morning
  if (!isDay1 || !flight || timeToMinutes(flight.arrivalTime) > timeToMinutes('09:30')) {
    slots.push({ time: '08:00', category: 'accommodation', duration: 30, placeholderName: 'Rise & shine at hotel', tips: 'Start early to beat the crowds at popular spots.' })
    slots.push({ time: '08:30', category: 'food', duration: 45, placeholderName: 'Breakfast', tips: vegTip + ' Local chai with paratha is a great start.' })
    slots.push({ time: '09:30', category: 'attraction', duration: 90, placeholderName: 'Morning attraction', tips: 'Best time to visit — cool weather and smaller crowds.' })
    slots.push({ time: '11:15', category: 'experience', duration: 60, placeholderName: 'Morning experience', tips: 'Book in advance on weekends.' })
  }

  // Midday
  slots.push({ time: '12:30', category: 'food', duration: 75, placeholderName: 'Lunch', tips: vegTip })
  slots.push({ time: '14:00', category: 'attraction', duration: 90, placeholderName: 'Afternoon attraction', tips: 'Carry water — afternoons can be warm.' })
  slots.push({ time: '15:45', category: 'experience', duration: 60, placeholderName: 'Afternoon activity', tips: 'Great for shopping or a local workshop.' })

  // Late afternoon
  slots.push({ time: '17:00', category: 'essentials', duration: 30, placeholderName: 'Break / refresh', tips: 'Stop for a lassi or chai. Recharge before the evening.' })
  slots.push({ time: '17:30', category: 'attraction', duration: 75, placeholderName: 'Sunset viewpoint', tips: 'Arrive 30 min before sunset for the best spot.' })

  // Evening
  slots.push({ time: '19:00', category: 'food', duration: 90, placeholderName: 'Dinner', tips: vegTip + ' Evening is peak time — book ahead.' })
  slots.push({ time: '20:45', category: 'experience', duration: 60, placeholderName: 'Evening stroll / night market', tips: 'Great for street food and local culture.' })
  slots.push({ time: '22:00', category: 'accommodation', duration: 60, placeholderName: 'Back to hotel', tips: 'Enjoy the night view on the way back.' })

  // Sort by time
  return slots.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
}

// ─── Place → activity mapping ─────────────────────────────────────────────

function classifyPlace(name: string, description: string): ActivityCategory {
  const text = `${name} ${description}`.toLowerCase()
  if (/hotel|hostel|resort|stay|check.?in|check.?out|accommodation|guest.?house/.test(text)) return 'accommodation'
  if (/restaurant|cafe|food|eat|lunch|dinner|breakfast|thali|dhaba|lassi|chai|snack|street food|veg|biryani|dosa|kulfi|mithai/.test(text)) return 'food'
  if (/fort|palace|temple|museum|monument|heritage|unesco|mandir|masjid|church|historical|ruins|garden|park/.test(text)) return 'attraction'
  if (/trek|hike|tour|walk|cruise|boat|safari|adventure|explore|experience|workshop|class/.test(text)) return 'experience'
  if (/bus|train|metro|auto|taxi|transport|station|airport|transfer/.test(text)) return 'transport'
  return 'attraction'
}

function defaultDuration(cat: ActivityCategory): number {
  return { food: 75, attraction: 90, experience: 90, accommodation: 30, transport: 45, essentials: 30 }[cat] ?? 60
}

function priceRange(cat: ActivityCategory, budget: string): string {
  const m: Record<string, Record<string, string>> = {
    budget: { food:'₹100–300', attraction:'Free–₹200', experience:'₹300–800', accommodation:'₹500–1500', transport:'₹50–200', essentials:'Free' },
    mid:    { food:'₹300–700', attraction:'₹200–500', experience:'₹800–2000', accommodation:'₹2000–5000', transport:'₹100–400', essentials:'Free' },
    splurge:{ food:'₹700–2000', attraction:'₹500–1200', experience:'₹2000–8000', accommodation:'₹5000+', transport:'₹400+', essentials:'Free' },
  }
  return m[budget]?.[cat] ?? '₹200–500'
}

function estimatedCost(cat: ActivityCategory, budget: string): number {
  const m: Record<string, Record<string, number>> = {
    budget: { food: 200, attraction: 100, experience: 500, accommodation: 1000, transport: 100, essentials: 0 },
    mid:    { food: 500, attraction: 350, experience: 1200, accommodation: 3000, transport: 250, essentials: 0 },
    splurge:{ food: 1200, attraction: 800, experience: 4000, accommodation: 7000, transport: 500, essentials: 0 },
  }
  return m[budget]?.[cat] ?? 300
}

function generateTip(name: string, cat: ActivityCategory, prefs: TripPreferences): string {
  const vegTips = [
    'Ask for the pure-veg menu — most places have one.',
    prefs.dietary === 'jain' ? 'Mention Jain preference — they can usually accommodate.' : 'Great veg-friendly spot.',
  ]
  const tips: Record<ActivityCategory, string[]> = {
    food:          vegTips,
    attraction:    ['Visit early morning to beat the crowds.','Best light for photos is golden hour.','Hire a local guide for the best stories.'],
    experience:    ['Book ahead on weekends.','Wear comfortable shoes.','Bring water and sunscreen.'],
    accommodation: ['Check-in is usually 2–3 PM. Drop bags and head out early!', 'Ask for a room with a view.'],
    transport:     ['Negotiate fare before boarding autos.','Use Google Maps offline.'],
    essentials:    ['Save the nearest pharmacy number.','Keep small cash handy.'],
  }
  const pool = tips[cat] ?? tips.attraction
  return pool[Math.floor(Math.random() * pool.length)]
}

// ─── Day summary ──────────────────────────────────────────────────────────

function buildSummary(activities: Activity[], budget: string): DaySummary {
  const cats: Record<string, number> = {}
  let totalCost = 0
  activities.forEach(a => {
    cats[a.category] = (cats[a.category] ?? 0) + 1
    totalCost += a.estimated_cost ?? 0
  })
  const times = activities.map(a => a.start_time).filter(Boolean).sort()
  return {
    totalStops:     activities.length,
    estimatedSpend: `₹${totalCost.toLocaleString('en-IN')}`,
    startTime:      times[0] ?? '08:00',
    endTime:        times[times.length - 1] ?? '22:00',
    categories:     cats,
    walkingMinutes: activities.length * 12,
  }
}

// ─── Main builder ─────────────────────────────────────────────────────────

export function buildItinerary(
  destination: string,
  startDate: string,
  endDate: string,
  prefs: TripPreferences,
  videos: YouTubeSearchResult[]
): ItineraryDay[] {
  const numDays = Math.max(1, Math.round(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
  ) + 1)
  const dates = getDayDates(startDate, numDays)
  const videoMap = new Map(videos.map(v => [v.videoId, v]))

  // Extract places from videos and map to activities
  const placeActivities: Omit<Activity, 'id' | 'day_id' | 'order_index'>[] = []
  const seen = new Set<string>()

  for (const video of videos) {
    const places = extractPlacesFromVideo(video)
    for (const place of places) {
      const key = place.toLowerCase().replace(/\s+/g, '-')
      if (seen.has(key)) continue
      seen.add(key)
      const cat = classifyPlace(place, video.description)
      if (prefs.dietary !== 'none' && cat === 'food' && /non.?veg|chicken|mutton|fish|seafood|egg/.test(place.toLowerCase())) continue

      placeActivities.push({
        name: place,
        description: `Recommended by ${video.channelTitle}`,
        location: place,
        start_time: '10:00',
        duration_minutes: defaultDuration(cat),
        category: cat,
        price_range: priceRange(cat, prefs.budget),
        estimated_cost: estimatedCost(cat, prefs.budget),
        rating: +(3.8 + Math.random() * 1.1).toFixed(1),
        tips: generateTip(place, cat, prefs),
        is_fixed: false,
        source_videos: [{ videoId: video.videoId, title: video.title, channelTitle: video.channelTitle, thumbnailUrl: video.thumbnailUrl, publishedAt: video.publishedAt }],
      })
    }
  }

  // Pad with curated places if needed
  const target = numDays * 8
  if (placeActivities.length < target) {
    for (const p of getCuratedPlaces(prefs)) {
      if (placeActivities.length >= target) break
      const key = p.name.toLowerCase().replace(/\s+/g, '-')
      if (!seen.has(key)) { seen.add(key); placeActivities.push(p) }
    }
  }

  // Build each day
  return dates.map((date, dayIdx) => {
    const isDay1    = dayIdx === 0
    const isLastDay = dayIdx === numDays - 1
    const slots     = getDaySlots(isDay1, isLastDay, prefs)

    // Get vlog-sourced places for this day (round-robin)
    const dayPlaces = placeActivities.filter((_, i) => i % numDays === dayIdx)

    // Merge: for each non-fixed slot, try to fill with a matching vlog place
    const usedPlaces = new Set<string>()
    const activities: Activity[] = []
    let placeIdx = 0

    slots.forEach((slot, i) => {
      // Fixed slots (flight/hotel) → use as-is
      if (slot.fixed) {
        activities.push({
          id: `d${dayIdx}-${i}`,
          day_id: `day-${dayIdx + 1}`,
          name: slot.placeholderName,
          description: slot.tips,
          location: slot.placeholderName,
          start_time: slot.time,
          end_time: addMinutes(slot.time, slot.duration),
          duration_minutes: slot.duration,
          category: slot.category,
          price_range: priceRange(slot.category, prefs.budget),
          estimated_cost: estimatedCost(slot.category, prefs.budget),
          tips: slot.tips,
          is_fixed: true,
          source_videos: [],
          order_index: i,
        })
        return
      }

      // Find a vlog place matching this slot's category
      let match = dayPlaces.find(p => p.category === slot.category && !usedPlaces.has(p.name))
      // Fall back to any unused place
      if (!match) match = dayPlaces.find(p => !usedPlaces.has(p.name))

      if (match) {
        usedPlaces.add(match.name)
        activities.push({
          ...match,
          id: `d${dayIdx}-${i}`,
          day_id: `day-${dayIdx + 1}`,
          start_time: slot.time,
          end_time: addMinutes(slot.time, match.duration_minutes),
          duration_minutes: match.duration_minutes,
          category: match.category,
          order_index: i,
        })
      } else {
        // Use slot placeholder
        activities.push({
          id: `d${dayIdx}-${i}`,
          day_id: `day-${dayIdx + 1}`,
          name: slot.placeholderName,
          description: `A suggested stop for your trip to ${destination}.`,
          location: slot.placeholderName,
          start_time: slot.time,
          end_time: addMinutes(slot.time, slot.duration),
          duration_minutes: slot.duration,
          category: slot.category,
          price_range: priceRange(slot.category, prefs.budget),
          estimated_cost: estimatedCost(slot.category, prefs.budget),
          rating: +(3.5 + Math.random() * 1.4).toFixed(1),
          tips: slot.tips,
          is_fixed: false,
          source_videos: [],
          order_index: i,
        })
      }
    })

    const sorted = activities.sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
    const dayId  = `day-${dayIdx + 1}`

    return {
      id:         dayId,
      trip_id:    '',
      day_number: dayIdx + 1,
      date,
      activities: sorted,
      summary:    buildSummary(sorted, prefs.budget),
    }
  })
}

// ─── Curated fallback places ───────────────────────────────────────────────

function getCuratedPlaces(prefs: TripPreferences): Omit<Activity, 'id' | 'day_id' | 'order_index'>[] {
  const vt = prefs.dietary !== 'none'
  return [
    { name: 'Old City Heritage Walk', category: 'experience', description: 'A curated walk through historic lanes.', location: 'Old City', start_time: '08:00', duration_minutes: 120, price_range: priceRange('experience', prefs.budget), estimated_cost: estimatedCost('experience', prefs.budget), rating: 4.5, tips: 'Start early. Wear comfortable shoes.', is_fixed: false, source_videos: [] },
    { name: 'Local Morning Market', category: 'experience', description: 'Vibrant market with fresh produce, spices and street eats.', location: 'City Market', start_time: '07:00', duration_minutes: 60, price_range: 'Free', estimated_cost: 100, rating: 4.3, tips: 'Arrive before 8 AM for the freshest produce.', is_fixed: false, source_videos: [] },
    { name: 'Sunset Viewpoint', category: 'attraction', description: 'The best spot in the city to watch the sunset.', location: 'Viewpoint Hill', start_time: '17:30', duration_minutes: 60, price_range: 'Free', estimated_cost: 0, rating: 4.8, tips: 'Arrive 30 min early for the best spot.', is_fixed: false, source_videos: [] },
    { name: vt ? 'Rooftop Veg Café' : 'Rooftop Café', category: 'food', description: 'Beloved local café with panoramic views.', location: 'City Centre', start_time: '12:00', duration_minutes: 75, price_range: priceRange('food', prefs.budget), estimated_cost: estimatedCost('food', prefs.budget), rating: 4.4, tips: vt ? 'Has a dedicated veg/Jain menu.' : 'Try the house special.', is_fixed: false, source_videos: [] },
    { name: 'City Museum', category: 'attraction', description: 'Main cultural museum with exhibits on local history.', location: 'Museum Quarter', start_time: '10:00', duration_minutes: 90, price_range: priceRange('attraction', prefs.budget), estimated_cost: estimatedCost('attraction', prefs.budget), rating: 4.2, tips: 'Free entry on Sundays. Audio guides available.', is_fixed: false, source_videos: [] },
    { name: 'Street Food Lane', category: 'food', description: 'Famous lane lined with vendors serving iconic street food.', location: 'Food Street', start_time: '19:00', duration_minutes: 60, price_range: '₹50–200', estimated_cost: 150, rating: 4.6, tips: 'Best visited in the evening. Try multiple stalls.', is_fixed: false, source_videos: [] },
    { name: 'Local Spice Market', category: 'experience', description: 'Colourful market selling spices, textiles and handicrafts.', location: 'Bazaar Area', start_time: '15:00', duration_minutes: 60, price_range: 'Free–₹500', estimated_cost: 400, rating: 4.3, tips: 'Great for souvenirs. Bargain respectfully.', is_fixed: false, source_videos: [] },
    { name: 'Evening Chai Stop', category: 'food', description: 'Iconic local tea stall — the perfect pit stop.', location: 'Near main square', start_time: '17:00', duration_minutes: 30, price_range: '₹20–60', estimated_cost: 40, rating: 4.5, tips: 'Try the masala chai with biscuits.', is_fixed: false, source_videos: [] },
    { name: 'Night Bazaar', category: 'experience', description: 'Lively evening market with street food, music and local crafts.', location: 'Night Market', start_time: '20:30', duration_minutes: 90, price_range: 'Free–₹300', estimated_cost: 200, rating: 4.4, tips: 'Most vibrant after 9 PM.', is_fixed: false, source_videos: [] },
    { name: 'Historic Fort', category: 'attraction', description: 'The city\'s iconic fort with sweeping views of the surrounding landscape.', location: 'Hilltop Fort', start_time: '09:30', duration_minutes: 120, price_range: priceRange('attraction', prefs.budget), estimated_cost: estimatedCost('attraction', prefs.budget), rating: 4.7, tips: 'Hire a guide to unlock the history. Wear sunscreen.', is_fixed: false, source_videos: [] },
  ]
}
