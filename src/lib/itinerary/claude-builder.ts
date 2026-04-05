import Anthropic from '@anthropic-ai/sdk'
import { ItineraryDay, Activity, TripPreferences, DaySummary } from '@/lib/types'
import { getDayDates } from '@/lib/utils'

const client = new Anthropic()

// ─── Time helpers ─────────────────────────────────────────────────────────
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function addMinutes(time: string, mins: number): string {
  const total = timeToMinutes(time) + mins
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function buildSummary(activities: Activity[], budget: string): DaySummary {
  const cats: Record<string, number> = {}
  let totalCost = 0
  activities.forEach(a => {
    cats[a.category] = (cats[a.category] ?? 0) + 1
    totalCost += a.estimated_cost ?? 0
  })
  const times = activities.map(a => a.start_time).sort()
  return {
    totalStops: activities.length,
    estimatedSpend: `₹${totalCost.toLocaleString('en-IN')}`,
    startTime: times[0] ?? '08:00',
    endTime: times[times.length - 1] ?? '22:00',
    categories: cats,
    walkingMinutes: activities.length * 12,
  }
}

// ─── Cost estimates ────────────────────────────────────────────────────────
function estimatedCost(cat: string, budget: string): number {
  const m: Record<string, Record<string, number>> = {
    budget:  { food: 200, attraction: 100, experience: 500,  accommodation: 1000, transport: 100, essentials: 0 },
    mid:     { food: 500, attraction: 350, experience: 1200, accommodation: 3000, transport: 250, essentials: 0 },
    comfort: { food: 800, attraction: 600, experience: 2000, accommodation: 5000, transport: 400, essentials: 0 },
    splurge: { food: 1500,attraction: 900, experience: 4000, accommodation: 8000, transport: 600, essentials: 0 },
  }
  return m[budget]?.[cat] ?? 300
}

// ─── Build the Claude prompt ───────────────────────────────────────────────
function buildPrompt(
  destination: string,
  startDate: string,
  endDate: string,
  prefs: TripPreferences,
  numDays: number
): string {
  const budgetDescriptions: Record<string, string> = {
    budget:  'backpacker budget (~₹1,500–3,000/day): street food, hostels, public transport, free attractions',
    mid:     'mid-range (~₹4,000–7,000/day): cafés, 3-star hotels, mix of transport, paid attractions',
    comfort: 'comfort (~₹8,000–14,000/day): restaurant dining, 4-star hotels, private cabs, guided tours',
    splurge: 'luxury (₹15,000+/day): fine dining, 5-star hotels, private transfers, premium experiences',
  }
  const dietNote = prefs.dietary !== 'none'
    ? `The traveler is ${prefs.dietary} — only include ${prefs.dietary}-friendly food options. No meat, fish, or eggs.`
    : 'No dietary restrictions.'

  const flightNote = prefs.flight
    ? `On Day 1, the traveler arrives at ${prefs.flight.arrivalAirport ?? 'the airport'} at ${prefs.flight.arrivalTime} from ${prefs.flight.departureCity}. Start the Day 1 itinerary from arrival onwards.`
    : ''

  const hotelNote = prefs.hotel
    ? `The traveler stays at ${prefs.hotel.name}. Check-in at ${prefs.hotel.checkInTime} on Day 1, check-out at ${prefs.hotel.checkOutTime} on the last day.`
    : ''

  return `You are an expert travel planner with deep local knowledge. Generate a detailed, realistic ${numDays}-day itinerary for ${destination}.

Trip details:
- Destination: ${destination}
- Dates: ${startDate} to ${endDate} (${numDays} days)
- Budget: ${budgetDescriptions[prefs.budget] ?? budgetDescriptions.mid}
- Travelers: ${prefs.travelers}
- Travel style: ${prefs.travelStyle}
- ${dietNote}
${flightNote ? `- ${flightNote}` : ''}
${hotelNote ? `- ${hotelNote}` : ''}

IMPORTANT RULES:
1. Use REAL, SPECIFIC place names that actually exist in ${destination} — real restaurants, landmarks, neighborhoods, temples, markets, museums. Not generic names like "City Museum" or "Rooftop Café".
2. Times must be realistic — don't schedule 3 major attractions back-to-back without travel/rest time.
3. Include a mix of: must-see attractions, local food spots, hidden gems, and neighbourhood exploration.
4. Morning activities should start 08:00–09:30. Evening ends by 22:00.
5. Each day should have 6–9 activities.

Return ONLY a valid JSON array (no markdown, no explanation) matching this exact structure:

[
  {
    "day_number": 1,
    "date": "${startDate}",
    "activities": [
      {
        "name": "Actual place name",
        "description": "2–3 sentence description of what makes this place special and what to do there.",
        "location": "Neighbourhood or area name",
        "start_time": "09:00",
        "duration_minutes": 90,
        "category": "attraction",
        "price_range": "₹200–500",
        "rating": 4.5,
        "tips": "One practical tip for visiting this place.",
        "is_fixed": false
      }
    ]
  }
]

Category must be one of: "food", "attraction", "transport", "accommodation", "experience", "essentials"
is_fixed should be true ONLY for flight arrival and hotel check-in/check-out activities.
Generate all ${numDays} days.`
}

// ─── Main Claude builder ───────────────────────────────────────────────────
export async function buildItineraryWithClaude(
  destination: string,
  startDate: string,
  endDate: string,
  prefs: TripPreferences
): Promise<ItineraryDay[]> {
  const numDays = Math.max(1, Math.round(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
  ) + 1)
  const dates = getDayDates(startDate, numDays)

  const prompt = buildPrompt(destination, startDate, endDate, prefs, numDays)

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })

  const rawText = message.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('')

  // Strip any markdown code fences if Claude wraps the JSON
  const jsonText = rawText
    .replace(/^```(?:json)?\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim()

  let rawDays: {
    day_number: number
    date?: string
    activities: {
      name: string
      description: string
      location: string
      start_time: string
      duration_minutes: number
      category: string
      price_range?: string
      rating?: number
      tips?: string
      is_fixed?: boolean
    }[]
  }[]

  try {
    rawDays = JSON.parse(jsonText)
  } catch {
    throw new Error('Claude returned invalid JSON for itinerary')
  }

  // Normalise to ItineraryDay[]
  return rawDays.map((raw, dayIdx) => {
    const date = dates[dayIdx] ?? raw.date ?? startDate
    const dayId = `day-${dayIdx + 1}`

    const activities: Activity[] = raw.activities.map((a, i) => ({
      id:               `d${dayIdx}-${i}`,
      day_id:           dayId,
      name:             a.name,
      description:      a.description ?? '',
      location:         a.location ?? a.name,
      start_time:       a.start_time ?? '09:00',
      end_time:         addMinutes(a.start_time ?? '09:00', a.duration_minutes ?? 60),
      duration_minutes: a.duration_minutes ?? 60,
      category:         (a.category as Activity['category']) ?? 'attraction',
      price_range:      a.price_range,
      estimated_cost:   estimatedCost(a.category, prefs.budget),
      rating:           a.rating,
      source_videos:    [],
      order_index:      i,
      tips:             a.tips,
      is_fixed:         a.is_fixed ?? false,
    }))

    // Sort by start_time
    activities.sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
    activities.forEach((a, i) => { a.order_index = i })

    return {
      id:         dayId,
      trip_id:    '',
      day_number: raw.day_number ?? dayIdx + 1,
      date,
      activities,
      summary:    buildSummary(activities, prefs.budget),
    }
  })
}
