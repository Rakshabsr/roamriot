import { PlaceSignal } from './types'

// Atlas Obscura: the gold-standard source for offbeat / unusual places
// URL pattern: https://www.atlasobscura.com/things-to-do/{city-slug}/attractions

function toSlug(destination: string): string {
  // Extract city name (before comma) and slugify
  const city = destination.split(',')[0].trim()
  return city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function fetchAtlasObscuraSignals(destination: string): Promise<PlaceSignal[]> {
  const slug = toSlug(destination)

  try {
    const url = `https://www.atlasobscura.com/things-to-do/${slug}/attractions`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RoamRiot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })
    if (!res.ok) return []
    const html = await res.text()

    // Atlas Obscura embeds place data in JSON-LD or in data-react-props
    // Primary: look for JSON-LD with @type Place or ListItem
    const signals: PlaceSignal[] = []

    // Extract JSON-LD blocks
    const ldMatches = Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi))
    for (const m of ldMatches) {
      try {
        const json = JSON.parse(m[1])
        const items = json['@graph'] ?? (Array.isArray(json) ? json : [json])
        for (const item of items) {
          if (!item.name) continue
          if (item['@type'] === 'Place' || item['@type'] === 'TouristAttraction' || item['@type'] === 'ListItem') {
            signals.push({
              name:        item.name.trim(),
              description: item.description?.slice(0, 200) ?? 'Unusual and offbeat attraction.',
              category:    'attraction',
              score:       15, // Atlas Obscura places are hand-curated — high confidence
              source:      'atlas_obscura',
            })
          }
        }
      } catch { /* skip malformed blocks */ }
    }

    // Fallback: extract place titles from HTML using Atlas Obscura's DOM pattern
    if (signals.length < 3) {
      const titlePattern = /class="[^"]*Card__title[^"]*"[^>]*>([^<]{4,60})<\/(?:h\d|span|div|a)>/gi
      for (const m of Array.from(html.matchAll(titlePattern))) {
        const name = m[1].trim()
        if (name.length > 4 && name.length < 60) {
          signals.push({
            name,
            description: 'Offbeat attraction recommended by Atlas Obscura.',
            category:    'attraction',
            score:       12,
            source:      'atlas_obscura',
          })
        }
      }
    }

    return signals.slice(0, 20)
  } catch {
    return []
  }
}
