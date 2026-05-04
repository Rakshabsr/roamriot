import { PlaceSignal } from './types'

// ─── Place name extraction from free-text ────────────────────────────────────
// Only extract from structured patterns — numbered lists, headings, "must visit X"
// NOT loose patterns like "visit X" which cause false positives

const NUMBERED_LIST = /(?:^|\n)\s*(?:\d+[.)]\s*|[-•]\s*)([A-Z][A-Za-zÀ-ÿ\s'']{3,40}?)(?:\s*[-–:,.\n]|$)/gm
const HEADING_PLACE = /\*\*([A-Z][A-Za-zÀ-ÿ\s'']{3,40}?)\*\*/g
const BOLD_PLACE    = /(?:^|\n)#{1,3}\s*([A-Z][A-Za-zÀ-ÿ\s'']{3,40}?)(?:\n|$)/gm

const NOISE_WORDS = new Set([
  'this', 'that', 'here', 'there', 'also', 'just', 'some', 'more', 'with',
  'from', 'like', 'best', 'most', 'very', 'good', 'great', 'nice', 'first',
  'second', 'third', 'last', 'next', 'back', 'tips', 'days', 'things',
  'places', 'must', 'visit', 'see', 'check', 'great', 'amazing', 'beautiful',
  'hidden', 'gems', 'travel', 'guide', 'advice', 'budget', 'cheap', 'free',
  'day', 'week', 'time', 'morning', 'evening', 'night', 'way', 'make',
  'edit', 'update', 'thanks', 'edit2', 'part', 'note', 'also',
])

function extractPlaceNames(text: string): string[] {
  const found = new Set<string>()

  for (const pattern of [NUMBERED_LIST, HEADING_PLACE, BOLD_PLACE]) {
    pattern.lastIndex = 0
    for (const m of Array.from(text.matchAll(pattern))) {
      const raw = (m[1] ?? '').trim().replace(/\s+/g, ' ')
      if (raw.length < 4 || raw.length > 50) continue
      if (raw.split(' ').length > 6) continue
      if (NOISE_WORDS.has(raw.toLowerCase())) continue
      if (/^\d+$/.test(raw)) continue
      found.add(raw)
    }
  }

  return Array.from(found)
}

// ─── Reddit JSON API (no key needed) ─────────────────────────────────────────

async function searchSubreddit(subreddit: string, destination: string): Promise<PlaceSignal[]> {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(destination)}&restrict_sr=on&sort=top&t=year&limit=8`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'RoamRiot/1.0 travel-planner bot' },
    })
    if (!res.ok) return []
    const data = await res.json()
    const posts = data?.data?.children ?? []

    const signals: PlaceSignal[] = []
    for (const child of posts) {
      const post = child.data
      const selftext: string = post.selftext ?? ''
      const title: string    = post.title    ?? ''
      const upvotes: number  = post.ups       ?? 0

      // Skip link posts with no body
      if (selftext.length < 100) continue

      const names = extractPlaceNames(selftext)
      for (const name of names) {
        signals.push({
          name,
          description: `Mentioned in r/${subreddit}: "${title.slice(0, 120)}"`,
          score:       Math.min(20, Math.floor(upvotes / 50)) + 1,
          source:      'reddit',
        })
      }
    }
    return signals
  } catch {
    return []
  }
}

export async function fetchRedditSignals(destination: string): Promise<PlaceSignal[]> {
  const results = await Promise.allSettled([
    searchSubreddit('travel',       destination),
    searchSubreddit('solotravel',   destination),
    searchSubreddit('backpacking',  destination),
    searchSubreddit('offbeat',      destination),
  ])

  return results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
}
