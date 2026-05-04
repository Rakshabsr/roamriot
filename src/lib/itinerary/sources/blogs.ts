import { PlaceSignal } from './types'

// Indian travel blogs: Tripoto + The Shooting Star + Backpacker India
// These have great budget-specific content for Indian and Asian destinations
// Uses RSS feeds where available, destination search pages otherwise

const BLOG_SOURCES = [
  {
    name: 'tripoto',
    searchUrl: (dest: string) =>
      `https://www.tripoto.com/places/${dest.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    rss: null,
  },
  {
    name: 'shootingstar',
    searchUrl: () => null,
    rss: 'https://www.theshootingstar.in/feed/',
  },
  {
    name: 'nomadicmatt',
    searchUrl: (dest: string) =>
      `https://nomadicmatt.com/travel-guides/${dest.toLowerCase().replace(/\s+/g, '-')}/`,
    rss: null,
  },
]

// Patterns for extracting place names from blog content
const PLACE_PATTERNS = [
  // "Visit X", "Check out X", "Head to X" at start of sentence
  /(?:^|\.\s+|,\s+)(?:visit|head\s+to|check\s+out|explore|stop\s+at|go\s+to)\s+(?:the\s+)?([A-Z][A-Za-zÀ-ÿ\s']{3,40}?)(?:[,.\n!])/gm,
  // Numbered list entries
  /(?:^|\n)\s*\d+[.)]\s+(?:the\s+)?([A-Z][A-Za-zÀ-ÿ\s']{3,40}?)(?:\s*[-–:]|\s*\n)/gm,
  // Bold/italic place names (common in blog formatting)
  /\*\*([A-Z][A-Za-zÀ-ÿ\s']{3,40}?)\*\*/g,
]

const BUDGET_PATTERN = /(?:free|₹\s*[\d,]+(?:\s*[-–]\s*[\d,]+)?|INR\s*[\d,]+|\$\s*[\d.]+|USD\s*[\d.]+|entry fee|no charge)/gi

function extractFromText(text: string, sourceName: string): PlaceSignal[] {
  const signals: PlaceSignal[] = []
  const seen = new Set<string>()

  for (const pattern of PLACE_PATTERNS) {
    pattern.lastIndex = 0
    for (const m of Array.from(text.matchAll(pattern))) {
      const name = (m[1] ?? '').trim().replace(/\s+/g, ' ')
      if (name.length < 4 || name.length > 60 || seen.has(name.toLowerCase())) continue
      seen.add(name.toLowerCase())

      // Extract nearby budget info
      const pos = text.indexOf(name)
      const context = text.slice(Math.max(0, pos - 150), pos + 200)
      const budgetMatch = context.match(BUDGET_PATTERN)

      signals.push({
        name,
        description: context.slice(0, 200).trim(),
        score:       8,
        source:      sourceName,
        budgetNote:  budgetMatch?.[0] ?? undefined,
      })
    }
  }

  return signals
}

async function fetchRSS(rssUrl: string, destination: string, sourceName: string): Promise<PlaceSignal[]> {
  try {
    const res = await fetch(rssUrl, {
      headers: { 'User-Agent': 'RoamRiot/1.0 travel planner' },
    })
    if (!res.ok) return []
    const text = await res.text()

    // Find items that mention the destination
    const itemPattern = /<item>([\s\S]*?)<\/item>/gi
    const dest = destination.toLowerCase()
    const signals: PlaceSignal[] = []

    for (const m of Array.from(text.matchAll(itemPattern))) {
      const item = m[1]
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)
      const descMatch  = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/)

      const title = (titleMatch?.[1] ?? titleMatch?.[2] ?? '').toLowerCase()
      const desc  = descMatch?.[1] ?? descMatch?.[2] ?? ''

      if (!title.includes(dest) && !desc.toLowerCase().includes(dest)) continue

      const extracted = extractFromText(desc.replace(/<[^>]+>/g, ' '), sourceName)
      signals.push(...extracted)
    }

    return signals.slice(0, 20)
  } catch {
    return []
  }
}

async function fetchTripotoPage(destination: string): Promise<PlaceSignal[]> {
  try {
    const slug = destination.split(',')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const url = `https://www.tripoto.com/places/${slug}`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RoamRiot/1.0)',
        'Accept': 'text/html',
      },
    })
    if (!res.ok) return []
    const html = await res.text()
    // Strip tags, extract text
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    return extractFromText(text, 'tripoto').slice(0, 20)
  } catch {
    return []
  }
}

async function fetchNomadicMatt(destination: string): Promise<PlaceSignal[]> {
  try {
    const slug = destination.split(',')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const url = `https://nomadicmatt.com/travel-guides/${slug}/`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RoamRiot/1.0)',
        'Accept': 'text/html',
      },
    })
    if (!res.ok) return []
    const html = await res.text()
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    return extractFromText(text, 'blog').slice(0, 15)
  } catch {
    return []
  }
}

export async function fetchBlogSignals(destination: string): Promise<PlaceSignal[]> {
  const [tripoto, shootingStar, nomadicMatt] = await Promise.allSettled([
    fetchTripotoPage(destination),
    fetchRSS('https://www.theshootingstar.in/feed/', destination, 'shootingstar'),
    fetchNomadicMatt(destination),
  ])

  return [
    ...(tripoto.status      === 'fulfilled' ? tripoto.value      : []),
    ...(shootingStar.status === 'fulfilled' ? shootingStar.value : []),
    ...(nomadicMatt.status  === 'fulfilled' ? nomadicMatt.value  : []),
  ]
}
