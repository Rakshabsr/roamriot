export type DietaryPreference = 'none' | 'vegetarian' | 'vegan' | 'jain'
export type TravelStyle = 'backpacker' | 'comfort' | 'luxury'
export type BudgetRange = 'budget' | 'mid' | 'comfort' | 'splurge'
export type ActivityCategory = 'food' | 'attraction' | 'transport' | 'accommodation' | 'experience' | 'essentials'

export interface FlightDetails {
  airline?: string
  flightNumber?: string
  departureCity: string
  arrivalTime: string   // HH:MM
  arrivalAirport?: string
}

export interface HotelDetails {
  name: string
  address?: string
  checkInTime: string   // HH:MM
  checkOutTime: string  // HH:MM
}

export interface TripPreferences {
  dietary: DietaryPreference
  travelStyle: TravelStyle
  budget: BudgetRange
  travelers: number
  flight?: FlightDetails
  hotel?: HotelDetails
}

export interface Trip {
  id: string
  user_id: string
  destination: string
  start_date: string
  end_date: string
  preferences: TripPreferences
  created_at: string
}

export interface ItineraryDay {
  id: string
  trip_id: string
  day_number: number
  date: string
  activities: Activity[]
  summary?: DaySummary
}

export interface DaySummary {
  totalStops: number
  estimatedSpend: string
  startTime: string
  endTime: string
  categories: Record<string, number>
  walkingMinutes: number
}

export interface Activity {
  id: string
  day_id: string
  name: string
  description: string
  location: string
  address?: string
  latitude?: number
  longitude?: number
  start_time: string
  end_time?: string
  duration_minutes: number
  category: ActivityCategory
  price_range?: string
  estimated_cost?: number
  rating?: number
  source_videos: SourceVideo[]
  order_index: number
  tips?: string
  is_fixed?: boolean     // flights/hotel check-in can't be moved
  notes?: string
}

export interface SourceVideo {
  videoId: string
  title: string
  channelTitle: string
  thumbnailUrl: string
  publishedAt: string
  viewCount?: string
}

export interface YouTubeSearchResult {
  videoId: string
  title: string
  description: string
  channelTitle: string
  thumbnailUrl: string
  publishedAt: string
  tags?: string[]
}

// ─── Expense tracker ──────────────────────────────────────────────────────

export type ExpenseCategory = 'food' | 'transport' | 'accommodation' | 'shopping' | 'activities' | 'other'

export interface Expense {
  id: string
  trip_id: string
  day_number: number
  category: ExpenseCategory
  description: string
  amount: number
  currency: string
  paid_by?: string
  created_at: string
}

// ─── Food finder ──────────────────────────────────────────────────────────

export interface Restaurant {
  id: string
  name: string
  cuisine: string
  isVeg: boolean
  isJainFriendly: boolean
  rating: number
  priceRange: string
  address: string
  latitude: number
  longitude: number
  openNow?: boolean
  distanceMeters?: number
  imageUrl?: string
  tags: string[]
}

// ─── API ──────────────────────────────────────────────────────────────────

export interface GenerateItineraryRequest {
  destination: string
  startDate: string
  endDate: string
  preferences: TripPreferences
}

export interface GenerateItineraryResponse {
  days: ItineraryDay[]
  sourceVideos: SourceVideo[]
}
