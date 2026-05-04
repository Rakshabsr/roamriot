// Shared type for any text-based place signal
// These are CANDIDATE names only — they must be validated against
// OSM/Nominatim before appearing in an itinerary
export interface PlaceSignal {
  name: string
  description: string
  category?: 'attraction' | 'food' | 'experience'
  score: number       // higher = more confident / more upvoted
  source: string      // 'reddit' | 'atlas_obscura' | 'wikipedia' | 'youtube' | 'tripoto'
  budgetNote?: string // e.g. "Free entry", "₹200–500"
}
