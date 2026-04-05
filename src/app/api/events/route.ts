import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function GET(req: NextRequest) {
  const destination = req.nextUrl.searchParams.get('destination')
  if (!destination) {
    return NextResponse.json({ error: 'destination required' }, { status: 400 })
  }

  // If no API key, return empty (page handles gracefully)
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ events: [] })
  }

  const prompt = `You are a local city expert. Generate 7 interesting local events, experiences, and activities happening in ${destination} that a traveler should know about.

Include a mix of: markets, cultural events, food experiences, nightlife, outdoor activities, art/music scenes, and neighbourhood highlights.

Return ONLY valid JSON (no markdown), an array of objects with this exact shape:
[
  {
    "id": "1",
    "name": "Event or experience name",
    "category": "market",
    "date": "Every Saturday" or "Ongoing" or "Weekends",
    "time": "9 AM – 2 PM",
    "location": "Specific venue or street name",
    "area": "Neighbourhood name",
    "price": "free",
    "priceNote": "optional note like 'some stalls paid'",
    "rating": 4.6,
    "vibes": ["local", "chill"],
    "description": "2–3 sentence description of what this is and why a traveler should go.",
    "highlight": "One bold pull-quote or standout fact.",
    "tips": "One practical tip.",
    "emoji": "🎪",
    "gradient": "from-purple-400 to-pink-500"
  }
]

Rules:
- category must be one of: "market", "music", "art", "food", "culture", "nightlife", "outdoor", "popup"
- price must be one of: "free", "paid", "donation"
- vibes must be array from: "local", "trendy", "chill", "buzzing", "hidden gem"
- gradient must be a valid Tailwind gradient string like "from-emerald-400 to-teal-500"
- Use real places and neighbourhoods in ${destination}
- Keep it practical and traveler-friendly`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')
      .replace(/^```(?:json)?\n?/m, '')
      .replace(/\n?```$/m, '')
      .trim()

    const events = JSON.parse(rawText)
    return NextResponse.json({ events })
  } catch (err) {
    console.error('Events generation error:', err)
    return NextResponse.json({ events: [] })
  }
}
