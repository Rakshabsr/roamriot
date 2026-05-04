import { ItineraryDay, Activity, ActivityCategory, TripPreferences } from '@/lib/types'
import { getDayDates } from '@/lib/utils'
import { enrichPlaces, EnrichablePlace } from './enrichment'

// ─── Types ────────────────────────────────────────────────────────────────
interface OSMNode {
  id: number
  lat: number
  lon: number
  tags: Record<string, string>
}

interface RankedPlace {
  id: number
  name: string
  lat: number
  lon: number
  category: ActivityCategory
  description: string
  duration: number   // minutes
  score: number      // higher = more notable
  priceRange?: string
}

// ─── Category mapping ─────────────────────────────────────────────────────
function osmCategory(tags: Record<string, string>): ActivityCategory | null {
  if (tags.tourism === 'museum' || tags.tourism === 'gallery') return 'attraction'
  if (tags.tourism === 'attraction' || tags.tourism === 'viewpoint') return 'attraction'
  if (tags.historic) return 'attraction'
  if (tags.tourism === 'theme_park' || tags.leisure === 'water_park') return 'experience'
  if (tags.leisure === 'park' || tags.leisure === 'garden' || tags.leisure === 'beach') return 'experience'
  if (tags.amenity === 'restaurant' || tags.amenity === 'cafe' || tags.amenity === 'food_court') return 'food'
  if (tags.shop === 'mall' || tags.shop === 'market' || tags.amenity === 'marketplace') return 'essentials'
  if (tags.tourism === 'zoo' || tags.tourism === 'aquarium') return 'experience'
  return null
}

function defaultDuration(cat: ActivityCategory, tags: Record<string, string>): number {
  if (tags.tourism === 'museum' || tags.tourism === 'gallery') return 90
  if (tags.historic) return 75
  if (cat === 'attraction') return 90
  if (cat === 'experience') return 120
  if (cat === 'food') return 60
  if (cat === 'essentials') return 45
  return 60
}

function priceRange(tags: Record<string, string>): string | undefined {
  const fee = tags.fee ?? tags['entrance:fee']
  if (fee === 'no' || fee === 'free') return 'Free entry'
  if (tags['charge']) return tags['charge']
  return undefined
}

// Score how notable a place is (more tags = more data = more known)
function scorePlace(tags: Record<string, string>): number {
  let s = Object.keys(tags).length * 2
  if (tags.wikidata) s += 20
  if (tags.wikipedia) s += 15
  if (tags.image) s += 5
  if (tags.website) s += 5
  if (tags.name) s += 10
  if (tags['name:en']) s += 5
  return s
}

// ─── Nominatim geocode ────────────────────────────────────────────────────
async function geocodeDestination(destination: string): Promise<{
  lat: number; lon: number; bbox: [number, number, number, number]
} | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1&addressdetails=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'RoamRiot/1.0 (travel planner app)' },
    })
    const data = await res.json()
    if (!data?.[0]) return null
    const place = data[0]
    const bbox = place.boundingbox as [string, string, string, string]
    // bbox is [south, north, west, east]
    return {
      lat: parseFloat(place.lat),
      lon: parseFloat(place.lon),
      bbox: [parseFloat(bbox[0]), parseFloat(bbox[1]), parseFloat(bbox[2]), parseFloat(bbox[3])],
    }
  } catch {
    return null
  }
}

// ─── Overpass query ───────────────────────────────────────────────────────
async function fetchOSMPlaces(bbox: [number, number, number, number]): Promise<OSMNode[]> {
  const [south, north, west, east] = bbox
  const bboxStr = `${south},${west},${north},${east}`

  const query = `
[out:json][timeout:30];
(
  node["tourism"~"^(attraction|museum|gallery|viewpoint|theme_park|aquarium|zoo)$"]["name"](${bboxStr});
  node["historic"~"^(monument|castle|ruins|building|fort|temple|church|mosque|palace|memorial)$"]["name"](${bboxStr});
  node["leisure"~"^(park|garden|beach|nature_reserve)$"]["name"](${bboxStr});
  node["amenity"~"^(restaurant|cafe|food_court|marketplace)$"]["name"]["cuisine"](${bboxStr});
  node["shop"~"^(mall|market|bazaar)$"]["name"](${bboxStr});
);
out body;
  `.trim()

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    })
    const data = await res.json()
    return (data.elements ?? []) as OSMNode[]
  } catch {
    return []
  }
}

// ─── Wikipedia description ────────────────────────────────────────────────
async function getWikiDescription(name: string): Promise<string> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'RoamRiot/1.0' } })
    if (!res.ok) return ''
    const data = await res.json()
    return data.extract ? data.extract.split('.').slice(0, 2).join('.') + '.' : ''
  } catch {
    return ''
  }
}

// ─── Proximity clustering ─────────────────────────────────────────────────
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function clusterByDay(places: RankedPlace[], numDays: number): RankedPlace[][] {
  if (places.length === 0) return Array.from({ length: numDays }, () => [])

  const used = new Set<number>()
  const days: RankedPlace[][] = []

  for (let d = 0; d < numDays; d++) {
    const dayPlaces: RankedPlace[] = []
    const TARGET_MINUTES = 480 // 8h of activity per day
    let usedMinutes = 0

    // Seed: pick the best unused place as anchor for the day
    const seed = places.find(p => !used.has(p.id))
    if (!seed) break
    dayPlaces.push(seed)
    used.add(seed.id)
    usedMinutes += seed.duration

    // Greedily pick nearby places until the day is full
    while (usedMinutes < TARGET_MINUTES) {
      const last = dayPlaces[dayPlaces.length - 1]
      const next = places
        .filter(p => !used.has(p.id))
        .map(p => ({ p, dist: distanceKm(last.lat, last.lon, p.lat, p.lon) }))
        .sort((a, b) => a.dist - b.dist)
        .find(({ p }) => usedMinutes + p.duration <= TARGET_MINUTES + 60)

      if (!next) break
      dayPlaces.push(next.p)
      used.add(next.p.id)
      usedMinutes += next.p.duration
    }

    days.push(dayPlaces)
  }

  return days
}

// ─── Time assignment ──────────────────────────────────────────────────────
function assignTimes(places: RankedPlace[], isDay1: boolean, isLastDay: boolean, prefs: TripPreferences): Activity[] {
  let currentMinutes = isDay1 && prefs.flight ? timeToMin(prefs.flight.arrivalTime) + 90 : 8 * 60 // 8am default
  const activities: Activity[] = []

  // Separate food from non-food, interleave meals naturally
  const nonFood = places.filter(p => p.category !== 'food')
  const food = places.filter(p => p.category === 'food')

  let foodIdx = 0
  const insertMeal = (targetMin: number) => {
    if (foodIdx < food.length) {
      const meal = food[foodIdx++]
      activities.push(makeActivity(meal, minutesToTime(targetMin), activities.length))
      currentMinutes = targetMin + meal.duration + 10
    }
  }

  for (let i = 0; i < nonFood.length; i++) {
    const place = nonFood[i]

    // Insert lunch around 1pm
    if (currentMinutes < 13 * 60 && currentMinutes + place.duration > 13 * 60) {
      insertMeal(13 * 60)
    }
    // Insert dinner around 7pm
    if (currentMinutes < 19 * 60 && currentMinutes + place.duration > 19 * 60) {
      insertMeal(19 * 60)
    }
    // Stop by 9pm
    if (currentMinutes >= 21 * 60) break

    activities.push(makeActivity(place, minutesToTime(currentMinutes), activities.length))
    currentMinutes += place.duration + 15 // 15 min travel between stops
  }

  // Add remaining food if not yet inserted
  while (foodIdx < food.length && currentMinutes < 21 * 60) {
    insertMeal(currentMinutes)
  }

  return activities
}

function makeActivity(place: RankedPlace, startTime: string, orderIndex: number): Activity {
  const endMin = timeToMin(startTime) + place.duration
  return {
    id: `osm-${place.id}-${orderIndex}`,
    day_id: '',
    name: place.name,
    description: place.description,
    location: place.name,
    latitude: place.lat,
    longitude: place.lon,
    start_time: startTime,
    end_time: minutesToTime(endMin),
    duration_minutes: place.duration,
    category: place.category,
    price_range: place.priceRange,
    source_videos: [],
    order_index: orderIndex,
    tips: '',
    is_fixed: false,
  }
}

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function minutesToTime(mins: number): string {
  const h = Math.floor(Math.min(mins, 23 * 60) / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// ─── Main builder ─────────────────────────────────────────────────────────
export async function buildItineraryWithOSM(
  destination: string,
  startDate: string,
  endDate: string,
  preferences: TripPreferences,
  youTubeTitles: string[] = [],
): Promise<ItineraryDay[] | null> {
  // 1. Geocode destination
  const geo = await geocodeDestination(destination)
  if (!geo) return null

  // Clamp bounding box to a city-sized area (max ~30km across)
  const cityBbox: [number, number, number, number] = [
    Math.max(geo.bbox[0], geo.lat - 0.25),
    Math.min(geo.bbox[1], geo.lat + 0.25),
    Math.max(geo.bbox[2], geo.lon - 0.25),
    Math.min(geo.bbox[3], geo.lon + 0.25),
  ]

  // 2. Fetch real places from OpenStreetMap
  let nodes = await fetchOSMPlaces(cityBbox)

  // If sparse data, retry with a wider bbox (covers smaller towns / offbeat destinations)
  if (nodes.length < 5) {
    const wideBbox: [number, number, number, number] = [
      geo.lat - 0.5, geo.lat + 0.5,
      geo.lon - 0.5, geo.lon + 0.5,
    ]
    nodes = await fetchOSMPlaces(wideBbox)
  }

  // 3. Rank and filter OSM places
  const ranked: RankedPlace[] = nodes
    .filter(n => n.tags?.name)
    .reduce<RankedPlace[]>((acc, n) => {
      const cat = osmCategory(n.tags)
      if (!cat) return acc
      acc.push({
        id: n.id,
        name: n.tags['name:en'] ?? n.tags.name,
        lat: n.lat,
        lon: n.lon,
        category: cat,
        description: '',
        duration: defaultDuration(cat, n.tags),
        score: scorePlace(n.tags),
        priceRange: priceRange(n.tags),
      })
      return acc
    }, [])
    .sort((a, b) => b.score - a.score)
    .slice(0, 80)

  // 4. Fetch Wikipedia descriptions for top attractions
  const topForWiki = ranked.filter(p => p.category === 'attraction').slice(0, 12)
  await Promise.all(
    topForWiki.map(async p => {
      p.description = await getWikiDescription(p.name)
    }),
  )

  // 5. Enrich with external sources (Reddit, Atlas Obscura, Wikipedia sections, blogs, YouTube titles)
  //    External sources boost scores of real OSM places + add validated new places
  //    This step is optional — itinerary is built even if enrichment fails
  const enrichableOSM: EnrichablePlace[] = ranked.map(p => ({ ...p, sources: ['osm'] }))
  let finalPlaces: RankedPlace[]

  try {
    const enriched = await enrichPlaces(enrichableOSM, destination, cityBbox, youTubeTitles)
    // Convert back to RankedPlace format, preserving enrichment scores
    finalPlaces = enriched.map(p => ({
      id:          typeof p.id === 'number' ? p.id : 0,
      name:        p.name,
      lat:         p.lat,
      lon:         p.lon,
      category:    p.category as RankedPlace['category'],
      description: p.description,
      duration:    p.duration,
      score:       p.score,
      priceRange:  p.priceRange,
    }))
  } catch {
    finalPlaces = ranked
  }

  if (finalPlaces.length < 3) return null

  // 6. Cluster by day using proximity
  const numDays = Math.max(1, Math.round(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
  ) + 1)
  const dates = getDayDates(startDate, numDays)
  const dayPlaces = clusterByDay(finalPlaces, numDays)

  // 7. Build ItineraryDay[]
  return dates.map((date, i) => {
    const places = dayPlaces[i] ?? []
    const isDay1 = i === 0
    const isLastDay = i === numDays - 1
    const activities = assignTimes(places, isDay1, isLastDay, preferences)

    const dayId = `osm-day-${i}`
    return {
      id: dayId,
      trip_id: '',
      day_number: i + 1,
      date,
      activities: activities.map(a => ({ ...a, day_id: dayId })),
    }
  })
}
