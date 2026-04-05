import { YouTubeSearchResult } from '@/lib/types'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

/**
 * Build search queries tailored to the destination and dietary preference
 */
function buildSearchQueries(destination: string, dietary: string): string[] {
  const base = destination.trim()
  const queries = [
    `${base} travel vlog best places to visit`,
    `${base} hidden gems travel guide`,
    `${base} food guide travel`,
    `${base} things to do travel itinerary`,
  ]
  if (dietary === 'vegetarian' || dietary === 'vegan' || dietary === 'jain') {
    queries.push(`${base} vegetarian veg food guide`)
    queries.push(`${base} veg restaurants street food`)
  }
  return queries
}

/**
 * Fetch travel vlogs from YouTube for a destination
 */
export async function searchYouTubeVlogs(
  destination: string,
  dietary: string,
  maxResults = 10
): Promise<YouTubeSearchResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY

  // Fall back to rich mock data if no API key is configured
  if (!apiKey || apiKey === 'your-youtube-api-key') {
    return getMockVideos(destination)
  }

  const queries = buildSearchQueries(destination, dietary)
  const allResults: YouTubeSearchResult[] = []
  const seen = new Set<string>()

  for (const query of queries.slice(0, 3)) {
    try {
      const params = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        videoCategoryId: '19', // Travel & Events
        maxResults: String(maxResults),
        order: 'relevance',
        key: apiKey,
      })

      const res = await fetch(`${YOUTUBE_API_BASE}/search?${params}`)
      if (!res.ok) continue

      const data = await res.json()
      for (const item of data.items ?? []) {
        const videoId = item.id?.videoId
        if (!videoId || seen.has(videoId)) continue
        seen.add(videoId)

        allResults.push({
          videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          channelTitle: item.snippet.channelTitle,
          thumbnailUrl: item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.default?.url,
          publishedAt: item.snippet.publishedAt,
        })
      }
    } catch {
      // continue to next query on error
    }
  }

  return allResults.slice(0, 20)
}

/**
 * Extract potential place names from a video's title and description.
 * Uses heuristics: capitalized multi-word phrases, numbers + place patterns, etc.
 */
export function extractPlacesFromVideo(video: YouTubeSearchResult): string[] {
  const text = `${video.title} ${video.description}`.toLowerCase()
  const rawText = `${video.title} ${video.description}`

  const places: string[] = []

  // Pattern: "Visit X", "Explore X", "Go to X", "at X", "in X"
  const actionPatterns = [
    /(?:visit|explore|see|check out|stop at|head to|try)\s+([A-Z][a-zA-Z\s']{3,30}?)(?:[,.\n!?]|$)/g,
    /(?:^|\n|\.\s)([A-Z][a-zA-Z\s']{3,25}?)(?:\s*[-–—]\s*[a-z])/g, // "Place Name - description"
  ]

  for (const pattern of actionPatterns) {
    const matches = Array.from(rawText.matchAll(pattern))
    for (const m of matches) {
      const candidate = m[1]?.trim()
      if (candidate && candidate.split(' ').length <= 5 && candidate.length > 3) {
        places.push(candidate)
      }
    }
  }

  // Pattern: numbered lists "1. X" or "• X" in descriptions
  const listPattern = /(?:\d+[.)]\s*|[•·]\s*)([A-Z][a-zA-Z\s']{3,30}?)(?:[,.\n]|$)/g
  const listMatches = Array.from(rawText.matchAll(listPattern))
  for (const m of listMatches) {
    const candidate = m[1]?.trim()
    if (candidate && candidate.split(' ').length <= 6) {
      places.push(candidate)
    }
  }

  // Deduplicate and clean
  const unique = Array.from(new Set(places))
    .filter(p => !commonWords.has(p.toLowerCase()))
    .slice(0, 8)

  return unique
}

const commonWords = new Set([
  'this', 'that', 'these', 'those', 'with', 'from', 'here', 'there',
  'when', 'what', 'where', 'which', 'watch', 'part', 'best', 'most',
  'some', 'more', 'like', 'just', 'also', 'even', 'back', 'next',
  'first', 'last', 'make', 'take', 'come', 'know', 'time', 'plus',
])

// ─── Rich mock data for development without API keys ───────────────────────

export function getMockVideos(destination: string): YouTubeSearchResult[] {
  const dest = destination.toLowerCase()

  const mockSets: Record<string, YouTubeSearchResult[]> = {
    default: [
      {
        videoId: 'dQw4w9WgXcQ',
        title: `${destination} Travel Guide - Top 10 Must-Visit Places`,
        description: `Complete travel guide for ${destination}! We visit the Old Market, City Palace, Sunset Viewpoint, the famous Street Food Lane, and the beautiful River Walk. Don't miss the Night Bazaar and the hidden Spice Garden.`,
        channelTitle: 'Wander With Us',
        thumbnailUrl: `https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg`,
        publishedAt: '2024-08-15T10:00:00Z',
      },
      {
        videoId: 'ScMzIvxBSi4',
        title: `${destination} Hidden Gems - Places Locals Love`,
        description: `Skip the tourist traps! We show you the Artist Quarter, the rooftop cafes near the old fort, Sunrise Hill trek, the colonial heritage walk, and our favorite local chai spots.`,
        channelTitle: 'Off The Beaten Path',
        thumbnailUrl: `https://i.ytimg.com/vi/ScMzIvxBSi4/hqdefault.jpg`,
        publishedAt: '2024-07-20T08:00:00Z',
      },
      {
        videoId: 'L_jWHffIx5E',
        title: `Best Vegetarian Food in ${destination} - Full Day Eating`,
        description: `A complete veg food tour! We try the famous Thali at Shree Ram Bhojanalaya, street side pav bhaji, the best lassi in town at Rajwada Sweet House, and end the day at the rooftop restaurant with panoramic views.`,
        channelTitle: 'Veg Travel Diaries',
        thumbnailUrl: `https://i.ytimg.com/vi/L_jWHffIx5E/hqdefault.jpg`,
        publishedAt: '2024-09-01T09:00:00Z',
      },
      {
        videoId: 'fJ9rUzIMcZQ',
        title: `${destination} 3 Day Itinerary - Everything You Need`,
        description: `Day 1: Arrive, check in, explore the Main Bazaar and try street food. Day 2: Morning at the Fort, lunch at Garden Café, afternoon museum visit, evening boat ride. Day 3: Day trip to the nearby waterfall, local market shopping.`,
        channelTitle: 'Budget Travel India',
        thumbnailUrl: `https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg`,
        publishedAt: '2024-06-10T12:00:00Z',
      },
      {
        videoId: 'ZbZSe6N_BXs',
        title: `${destination} Budget Travel Tips & Cheap Eats`,
        description: `How to do ${destination} on a budget! Cheap hostels near Station Road, free attractions like the Lakeside Park, affordable local transport, and the best ₹50 meals at Annapurna Dhaba and Morning Glory Cafe.`,
        channelTitle: 'The Broke Traveler',
        thumbnailUrl: `https://i.ytimg.com/vi/ZbZSe6N_BXs/hqdefault.jpg`,
        publishedAt: '2024-05-25T14:00:00Z',
      },
    ],
    bali: [
      {
        videoId: 'YTbali001',
        title: 'Bali Travel Vlog - Ubud, Temples & Rice Terraces',
        description: 'We explore Ubud Monkey Forest, Tirta Empul temple, Tegalalang Rice Terraces, the famous Kecak Fire Dance, and have breakfast at Locavore. Hidden gem: Campuhan Ridge Walk at sunrise.',
        channelTitle: 'Bali Life',
        thumbnailUrl: 'https://i.ytimg.com/vi/YTbali001/hqdefault.jpg',
        publishedAt: '2024-09-10T08:00:00Z',
      },
      {
        videoId: 'YTbali002',
        title: 'Best Vegetarian & Vegan Food in Bali 2024',
        description: 'Full vegan food tour of Bali. Must try: Alchemy Raw in Ubud, Sayuri Healing Food, the Jungle Fish restaurant, Zin Cafe, and the local warungs serving authentic nasi campur without meat.',
        channelTitle: 'Vegan Wanderer',
        thumbnailUrl: 'https://i.ytimg.com/vi/YTbali002/hqdefault.jpg',
        publishedAt: '2024-08-01T09:00:00Z',
      },
    ],
    jaipur: [
      {
        videoId: 'YTjaipur001',
        title: 'Jaipur Pink City - Complete Travel Guide',
        description: 'Everything to see in Jaipur! Amber Fort, Hawa Mahal, City Palace, Jantar Mantar (UNESCO), Nahargarh Fort sunset, the pink old city lanes, and shopping for block prints at Bapu Bazaar.',
        channelTitle: 'Incredible India Tours',
        thumbnailUrl: 'https://i.ytimg.com/vi/YTjaipur001/hqdefault.jpg',
        publishedAt: '2024-10-05T07:00:00Z',
      },
      {
        videoId: 'YTjaipur002',
        title: 'Jaipur Street Food & Vegetarian Thali Guide',
        description: 'Best veg food in Jaipur: Dal Baati Churma at Laxmi Misthan Bhandar, pyaaz kachori at Rawat Mishthan Bhandar, rooftop thali at Peacock Rooftop, lassi at Lassiwala, and the famous Masala Chai at Chokhi Dhani.',
        channelTitle: 'Foodie in India',
        thumbnailUrl: 'https://i.ytimg.com/vi/YTjaipur002/hqdefault.jpg',
        publishedAt: '2024-07-18T10:00:00Z',
      },
      {
        videoId: 'YTjaipur003',
        title: 'Jaipur Hidden Gems & Off-Beat Places',
        description: 'Beyond the tourist spots: Panna Meena Ka Kund stepwell, Galtaji Monkey Temple, Sisodia Rani Garden, Jawahar Circle, and the lesser-known Sheesh Mahal. Also check out the Anokhi Museum of Hand Printing.',
        channelTitle: 'Travel Offbeat',
        thumbnailUrl: 'https://i.ytimg.com/vi/YTjaipur003/hqdefault.jpg',
        publishedAt: '2024-06-22T11:00:00Z',
      },
    ],
  }

  for (const key of Object.keys(mockSets)) {
    if (key !== 'default' && dest.includes(key)) {
      return mockSets[key]
    }
  }
  return mockSets.default.map(v => ({
    ...v,
    title: v.title,
    description: v.description,
  }))
}
