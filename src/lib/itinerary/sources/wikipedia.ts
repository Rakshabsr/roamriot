import { PlaceSignal } from './types'

// Wikipedia section extraction
// Strategy: fetch the destination article, find sections about attractions/tourism,
// extract [[WikiLink]] internal links — these are almost always real named places

const TOURISM_SECTIONS = [
  'attractions', 'tourism', 'places of interest', 'landmarks', 'sightseeing',
  'things to do', 'points of interest', 'culture', 'architecture', 'cuisine',
  'museums', 'parks', 'heritage', 'monuments', 'temples', 'churches',
]

function slugify(destination: string): string {
  return destination.trim().replace(/\s+/g, '_')
}

// Extract [[Name|display]] or [[Name]] links from wikitext
function extractWikiLinks(wikitext: string): string[] {
  const names: string[] = []
  const pattern = /\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/g
  for (const m of Array.from(wikitext.matchAll(pattern))) {
    const raw = m[1].trim()
    // Skip category/file/template links
    if (raw.startsWith('File:') || raw.startsWith('Category:') || raw.startsWith('Template:')) continue
    if (raw.length < 3 || raw.length > 60) continue
    // Skip pure year numbers or dates
    if (/^\d{4}$/.test(raw)) continue
    names.push(raw)
  }
  return names
}

interface WikiSection {
  index: string
  line: string
}

export async function fetchWikipediaSignals(destination: string): Promise<PlaceSignal[]> {
  const page = slugify(destination)

  try {
    // Step 1: Get section list
    const sectionsUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=sections&format=json&origin=*`
    const secRes = await fetch(sectionsUrl, {
      headers: { 'User-Agent': 'RoamRiot/1.0 travel planner' },
    })
    if (!secRes.ok) return []
    const secData = await secRes.json()
    const sections: WikiSection[] = secData?.parse?.sections ?? []

    // Find tourism-related sections
    const relevantSections = sections.filter(s =>
      TOURISM_SECTIONS.some(t => s.line.toLowerCase().includes(t))
    ).slice(0, 5)

    if (relevantSections.length === 0) return []

    // Step 2: Fetch wikitext of each relevant section
    const signals: PlaceSignal[] = []
    for (const section of relevantSections) {
      try {
        const textUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&section=${section.index}&prop=wikitext&format=json&origin=*`
        const textRes = await fetch(textUrl, {
          headers: { 'User-Agent': 'RoamRiot/1.0 travel planner' },
        })
        if (!textRes.ok) continue
        const textData = await textRes.json()
        const wikitext: string = textData?.parse?.wikitext?.['*'] ?? ''

        const names = extractWikiLinks(wikitext)
        for (const name of names) {
          // Wikipedia links to places are highly reliable — real named places
          const isFood = /restaurant|cafe|market|food|cuisine|dish|street/i.test(wikitext.slice(
            Math.max(0, wikitext.indexOf(name) - 100),
            wikitext.indexOf(name) + 100
          ))
          signals.push({
            name,
            description: `Listed under "${section.line}" in the ${destination} Wikipedia article.`,
            category:    isFood ? 'food' : 'attraction',
            score:       10,
            source:      'wikipedia',
          })
        }
      } catch { /* skip failed section */ }
    }

    return signals.slice(0, 30)
  } catch {
    return []
  }
}
