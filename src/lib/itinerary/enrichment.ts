/**
 * Enrichment layer — the key fix for data quality
 *
 * Architecture:
 *   OSM Overpass = ground truth for real places with lat/lng
 *   External sources (Reddit, Atlas Obscura, Wikipedia, Blogs, YouTube titles)
 *                  = scoring signals only
 *
 * Flow:
 *   1. Fetch signals from all external sources in parallel
 *   2. For each signal, fuzzy-match against existing OSM places
 *      → matched: boost that OSM place's score (it was mentioned by the community)
 *      → unmatched: queue for Nominatim validation (max 8 calls, rate-limited)
 *   3. Validated unmatched places get added to the pool with real lat/lng
 *   4. Result: EVERY place in the pool has real coordinates — no fake generic names
 */

import { ActivityCategory } from '@/lib/types'
import { PlaceSignal } from './sources/types'
import { fetchRedditSignals } from './sources/reddit'
import { fetchAtlasObscuraSignals } from './sources/atlas-obscura'
import { fetchWikipediaSignals } from './sources/wikipedia'
import { fetchBlogSignals } from './sources/blogs'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EnrichablePlace {
  id: number | string
  name: string
  lat: number
  lon: number
  category: ActivityCategory
  description: string
  duration: number
  score: number
  priceRange?: string
  sources: string[]   // which external sources mentioned this place
}

// ─── Fuzzy name matching ──────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase()
    .replace(/\bthe\b/g, '')
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenOverlap(a: string, b: string): number {
  const tokensA = normalize(a).split(' ').filter(t => t.length > 2)
  const tokensB = new Set(normalize(b).split(' ').filter(t => t.length > 2))
  let overlap = 0
  for (const t of tokensA) { if (tokensB.has(t)) overlap++ }
  const maxLen = Math.max(tokensA.length, tokensB.size)
  return maxLen > 0 ? overlap / maxLen : 0
}

// Returns the best matching OSM place if similarity >= threshold
function findOSMMatch(
  signalName: string,
  osmPlaces: EnrichablePlace[],
  threshold = 0.6,
): EnrichablePlace | null {
  let best: EnrichablePlace | null = null
  let bestScore = 0

  const normSignal = normalize(signalName)
  for (const place of osmPlaces) {
    const normPlace = normalize(place.name)

    // Exact match
    if (normSignal === normPlace) return place

    // Substring match (e.g., "Amber Fort" matches "Amer Fort" partially)
    if (normPlace.includes(normSignal) || normSignal.includes(normPlace)) {
      const sim = Math.min(normSignal.length, normPlace.length) / Math.max(normSignal.length, normPlace.length)
      if (sim > bestScore) { bestScore = sim; best = place }
      continue
    }

    const sim = tokenOverlap(signalName, place.name)
    if (sim > bestScore && sim >= threshold) { bestScore = sim; best = place }
  }

  return best
}

// ─── Nominatim validation for unmatched signals ───────────────────────────────
// Rate limit: ~1 req/sec. We cap at 8 calls max.

async function validateViaNominatim(
  name: string,
  bbox: [number, number, number, number],
): Promise<{ lat: number; lon: number } | null> {
  try {
    const [south, north, west, east] = bbox
    const url = [
      `https://nominatim.openstreetmap.org/search`,
      `?q=${encodeURIComponent(name)}`,
      `&format=json&limit=1`,
      `&bounded=1`,
      `&viewbox=${west},${north},${east},${south}`,
    ].join('')

    const res = await fetch(url, {
      headers: { 'User-Agent': 'RoamRiot/1.0 travel planner' },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.[0]) return null
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

// ─── Category inference for unmatched places ─────────────────────────────────

function inferCategory(signal: PlaceSignal): ActivityCategory {
  if (signal.category === 'food') return 'food'
  if (signal.category === 'experience') return 'experience'
  const text = `${signal.name} ${signal.description}`.toLowerCase()
  if (/restaurant|cafe|food|eat|dhaba|chai|market|bazaar|street food|thali/.test(text)) return 'food'
  if (/trek|hike|tour|walk|cruise|boat|workshop|class|adventure/.test(text)) return 'experience'
  return 'attraction'
}

function defaultDurationForCategory(cat: ActivityCategory): number {
  return { food: 60, attraction: 90, experience: 120, accommodation: 30, transport: 45, essentials: 30 }[cat] ?? 75
}

// ─── YouTube title extraction (strict — titles only, numbered lists only) ────

export function extractYouTubeSignals(videoTitles: string[]): PlaceSignal[] {
  // Extract only from numbered/structured patterns in titles
  // Video titles like "Top 10 things to do in Lisbon" don't give place names
  // But "1. Belem Tower 2. Alfama 3. LX Factory" style titles do
  const NUMBERED = /\d+[.)]\s*([A-Z][A-Za-zÀ-ÿ\s']{3,40}?)(?:[,.|]|$)/g
  const signals: PlaceSignal[] = []

  for (const title of videoTitles) {
    for (const m of Array.from(title.matchAll(NUMBERED))) {
      const name = m[1].trim()
      if (name.length > 4 && name.split(' ').length <= 5) {
        signals.push({ name, description: `Mentioned in YouTube title: "${title.slice(0, 80)}"`, score: 6, source: 'youtube' })
      }
    }
  }
  return signals
}

// ─── Main enrichment function ─────────────────────────────────────────────────

export async function enrichPlaces(
  osmPlaces: EnrichablePlace[],
  destination: string,
  bbox: [number, number, number, number],
  youTubeTitles: string[] = [],
): Promise<EnrichablePlace[]> {
  // 1. Gather all signals in parallel (with timeout protection)
  const timeout = (ms: number) => new Promise<PlaceSignal[]>(r => setTimeout(() => r([]), ms))

  const [redditSignals, atlasSignals, wikiSignals, blogSignals] = await Promise.all([
    Promise.race([fetchRedditSignals(destination),       timeout(5000)]),
    Promise.race([fetchAtlasObscuraSignals(destination), timeout(5000)]),
    Promise.race([fetchWikipediaSignals(destination),    timeout(5000)]),
    Promise.race([fetchBlogSignals(destination),         timeout(5000)]),
  ])

  const ytSignals = extractYouTubeSignals(youTubeTitles)

  const allSignals: PlaceSignal[] = [
    ...redditSignals,
    ...atlasSignals,
    ...wikiSignals,
    ...blogSignals,
    ...ytSignals,
  ]

  // 2. Make a mutable copy of OSM places to boost scores
  const enriched = osmPlaces.map(p => ({ ...p, sources: [...p.sources] }))

  // 3. For each signal, try to match an existing OSM place
  const unmatchedSignals: PlaceSignal[] = []

  for (const signal of allSignals) {
    const match = findOSMMatch(signal.name, enriched)
    if (match) {
      // Boost the matched OSM place's score and record the source
      match.score  += signal.score
      if (!match.sources.includes(signal.source)) match.sources.push(signal.source)
      if (!match.description && signal.description) match.description = signal.description
    } else {
      unmatchedSignals.push(signal)
    }
  }

  // 4. Deduplicate unmatched signals, pick top by score
  const unmatchedMap = new Map<string, PlaceSignal>()
  for (const s of unmatchedSignals) {
    const key = normalize(s.name)
    const existing = unmatchedMap.get(key)
    if (!existing || s.score > existing.score) unmatchedMap.set(key, s)
  }

  // Sort by score, take top 8 for Nominatim validation (rate limit protection)
  const topUnmatched = Array.from(unmatchedMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)

  // 5. Validate top unmatched places via Nominatim
  for (const signal of topUnmatched) {
    const coords = await validateViaNominatim(signal.name, bbox)
    if (coords) {
      const cat = inferCategory(signal)
      enriched.push({
        id:          `ext-${normalize(signal.name).replace(/\s/g, '-')}`,
        name:        signal.name,
        lat:         coords.lat,
        lon:         coords.lon,
        category:    cat,
        description: signal.description,
        duration:    defaultDurationForCategory(cat),
        score:       signal.score + 5,  // +5 for passing Nominatim validation
        priceRange:  signal.budgetNote ?? undefined,
        sources:     [signal.source],
      })
    }
    // Rate limit: 1 req/sec max
    await sleep(1100)
  }

  // 6. Re-sort by final score (OSM places boosted by external mentions rank highest)
  return enriched.sort((a, b) => b.score - a.score)
}
