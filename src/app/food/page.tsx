'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Search, MapPin, Star, Clock, Leaf, Filter, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type DietFilter = 'all' | 'veg' | 'jain'
type PriceFilter = 'all' | 'budget' | 'mid' | 'splurge'
type CuisineFilter = 'all' | 'indian' | 'street food' | 'cafe' | 'international'

interface Restaurant {
  id: string; name: string; cuisine: string; isVeg: boolean; isJainFriendly: boolean
  rating: number; priceRange: string; priceKey: 'budget' | 'mid' | 'splurge'
  address: string; distanceMin: number; openNow: boolean; tags: string[]
  description: string; mustTry: string
}

// Mock restaurants — will be replaced by real API when available
const MOCK_RESTAURANTS: Restaurant[] = [
  { id: '1', name: 'Laxmi Misthan Bhandar', cuisine: 'indian', isVeg: true, isJainFriendly: true, rating: 4.7, priceRange: '₹100–300', priceKey: 'budget', address: 'MI Road, Jaipur', distanceMin: 8, openNow: true, tags: ['Dal Baati', 'Sweets', 'Thali'], description: 'Legendary pure-veg eatery beloved by locals for 60+ years.', mustTry: 'Dal Baati Churma' },
  { id: '2', name: 'Rawat Mishthan Bhandar', cuisine: 'street food', isVeg: true, isJainFriendly: false, rating: 4.6, priceRange: '₹50–150', priceKey: 'budget', address: 'Station Road', distanceMin: 5, openNow: true, tags: ['Kachori', 'Pyaz Kachori', 'Chai'], description: 'Famous for the crispiest pyaaz kachori in all of Rajasthan.', mustTry: 'Pyaaz Kachori' },
  { id: '3', name: 'Peacock Rooftop Restaurant', cuisine: 'indian', isVeg: false, isJainFriendly: false, rating: 4.4, priceRange: '₹400–900', priceKey: 'mid', address: 'Near City Palace', distanceMin: 12, openNow: true, tags: ['Rooftop', 'Views', 'Rajasthani'], description: 'Romantic rooftop with sweeping views of the Pink City.', mustTry: 'Laal Maas' },
  { id: '4', name: 'Jal Mahal Café', cuisine: 'cafe', isVeg: true, isJainFriendly: true, rating: 4.3, priceRange: '₹200–500', priceKey: 'mid', address: 'Nahargarh Rd', distanceMin: 18, openNow: false, tags: ['Coffee', 'Brunch', 'Lake View'], description: 'Charming café with a view of the iconic Jal Mahal palace.', mustTry: 'Masala chai + avocado toast' },
  { id: '5', name: 'Niros', cuisine: 'international', isVeg: false, isJainFriendly: false, rating: 4.2, priceRange: '₹600–1400', priceKey: 'splurge', address: 'MI Road', distanceMin: 9, openNow: true, tags: ['Continental', 'Fine Dining', 'Since 1949'], description: 'Jaipur institution since 1949. Continental and Indian menu.', mustTry: 'Chicken stuffed mushroom' },
  { id: '6', name: 'Anokhi Café', cuisine: 'cafe', isVeg: true, isJainFriendly: true, rating: 4.5, priceRange: '₹250–600', priceKey: 'mid', address: 'KK Square', distanceMin: 14, openNow: true, tags: ['Organic', 'Salads', 'Sandwiches'], description: 'Organic café attached to the famous Anokhi fabric store.', mustTry: 'Roasted red pepper soup' },
  { id: '7', name: 'Lassiwala', cuisine: 'street food', isVeg: true, isJainFriendly: true, rating: 4.8, priceRange: '₹30–80', priceKey: 'budget', address: 'MI Road', distanceMin: 6, openNow: true, tags: ['Lassi', 'Famous', 'Since 1944'], description: 'The most iconic lassi stall in Jaipur. Queue expected!', mustTry: 'Thick malai lassi' },
  { id: '8', name: 'Suvarna Mahal', cuisine: 'indian', isVeg: false, isJainFriendly: false, rating: 4.7, priceRange: '₹2000–5000', priceKey: 'splurge', address: 'Rambagh Palace', distanceMin: 25, openNow: true, tags: ['Palace Dining', 'Royal', 'Heritage'], description: 'Dine like royalty in the stunning Rambagh Palace.', mustTry: 'Rajasthani royal thali' },
]

const PRICE_COLORS = { budget: 'text-sage-600 bg-sage-50', mid: 'text-sea-600 bg-sea-50', splurge: 'text-amber-600 bg-amber-50' }

function dietaryToFilter(dietary?: string): DietFilter {
  if (dietary === 'vegetarian' || dietary === 'vegan') return 'veg'
  if (dietary === 'jain') return 'jain'
  return 'all'
}

function RestaurantCard({ r }: { r: Restaurant }) {
  const [saved, setSaved] = useState(false)
  return (
    <div className="card p-5 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">{r.name}</h3>
            {r.isVeg && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sage-50 border border-sage-200 text-sage-700 text-xs font-bold">
                <Leaf size={9} /> Veg
              </span>
            )}
            {r.isJainFriendly && (
              <span className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">Jain</span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <MapPin size={10} /> {r.address}
            <span className="text-slate-300">·</span>
            <Clock size={10} /> {r.distanceMin} min away
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1 justify-end mb-1">
            <Star size={12} fill="#f59e0b" className="text-amber-400" />
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{r.rating}</span>
          </div>
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', PRICE_COLORS[r.priceKey])}>
            {r.priceRange}
          </span>
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3">{r.description}</p>
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {r.tags.map(t => (
          <span key={t} className="px-2.5 py-1 bg-slate-50 rounded-full text-xs text-slate-500 dark:text-slate-400 font-medium">{t}</span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
          Must try: <span className="text-sea-600">{r.mustTry}</span>
        </div>
        <div className="flex items-center gap-2">
          {!r.openNow && <span className="text-xs text-red-400 font-semibold">Closed now</span>}
          {r.openNow && <span className="text-xs text-sage-600 font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-sage-500 rounded-full animate-pulse-soft" />Open</span>}
          <button onClick={() => setSaved(v => !v)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all',
              saved ? 'border-sea-400 bg-sea-50 text-sea-700' : 'border-slate-200 text-slate-500 dark:text-slate-400 hover:border-sea-300')}>
            {saved ? '✓ Saved' : '+ Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FoodFinderInner() {
  const searchParams = useSearchParams()
  const tripId = searchParams.get('tripId')

  const [destination, setDestination] = useState('Your destination')
  const [search, setSearch]           = useState('')
  const [dietFilter, setDietFilter]   = useState<DietFilter>('all')
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all')
  const [cuisineFilter, setCuisineFilter] = useState<CuisineFilter>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [loadingTrip, setLoadingTrip] = useState(false)

  const backHref = tripId ? `/trips/${tripId}` : '/dashboard'

  // Load trip preferences to auto-set dietary filter
  useEffect(() => {
    if (!tripId) return
    setLoadingTrip(true)
    fetch(`/api/trips/${tripId}/meta`)
      .then(r => r.json())
      .then(data => {
        if (data.trip) {
          setDestination(data.trip.destination)
          const autoFilter = dietaryToFilter(data.trip.preferences?.dietary)
          setDietFilter(autoFilter)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTrip(false))
  }, [tripId])

  const filtered = MOCK_RESTAURANTS.filter(r => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false
    if (dietFilter === 'veg' && !r.isVeg) return false
    if (dietFilter === 'jain' && !r.isJainFriendly) return false
    if (priceFilter !== 'all' && r.priceKey !== priceFilter) return false
    if (cuisineFilter !== 'all' && r.cuisine !== cuisineFilter) return false
    return true
  }).sort((a, b) => b.rating - a.rating)

  return (
    <div className="min-h-screen bg-gradient-to-b from-sea-50 to-white">
      {/* Nav */}
      <nav className="bg-white/90 dark:bg-[#111a18]/90 backdrop-blur-xl border-b border-sea-100 dark:border-[#1e2f2b] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href={backHref} className="btn-ghost text-xs px-3 py-1.5 gap-1.5">
            <ArrowLeft size={13} /> {tripId ? destination.split(',')[0] : 'Dashboard'}
          </Link>
          <span className="font-extrabold text-gradient text-lg">Food Finder</span>
          {loadingTrip && <Loader2 size={13} className="animate-spin text-sea-400" />}
          <Link href={tripId ? `/events?tripId=${tripId}` : '/events'} className="ml-auto btn-ghost text-xs px-3 py-1.5">What&apos;s On</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Dietary auto-applied banner */}
        {dietFilter !== 'all' && tripId && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sage-50 border border-sage-200 text-sage-700 text-xs font-semibold">
            <Leaf size={12} />
            {dietFilter === 'veg' ? 'Showing veg-friendly spots based on your trip preferences' : 'Showing Jain-friendly spots based on your trip preferences'}
            <button onClick={() => setDietFilter('all')} className="ml-auto underline text-sage-600">Show all</button>
          </div>
        )}

        {/* Search + filter bar */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-11 rounded-3xl h-12" placeholder="Search restaurants, dishes…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Diet quick filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {([
              { k: 'all', l: 'All' },
              { k: 'veg', l: 'Veg only' },
              { k: 'jain', l: 'Jain friendly' },
            ] as { k: DietFilter; l: string }[]).map(f => (
              <button key={f.k} onClick={() => setDietFilter(f.k)}
                className={cn('flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border-2 transition-all',
                  dietFilter === f.k ? 'border-sage-400 bg-sage-50 text-sage-700 shadow-soft' : 'border-slate-200 text-slate-500 dark:text-slate-400 hover:border-sage-300')}>
                {f.l}
              </button>
            ))}
            <button onClick={() => setShowFilters(v => !v)}
              className={cn('flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border-2 transition-all',
                showFilters ? 'border-sea-400 bg-sea-50 text-sea-700' : 'border-slate-200 text-slate-500')}>
              <Filter size={11} /> More <ChevronDown size={11} className={cn('transition-transform', showFilters && 'rotate-180')} />
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="card p-4 space-y-3 animate-fade-up">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Price range</p>
                <div className="flex gap-2 flex-wrap">
                  {([{ k: 'all', l: 'All' }, { k: 'budget', l: 'Budget ₹' }, { k: 'mid', l: 'Mid ₹₹' }, { k: 'splurge', l: 'Splurge ₹₹₹' }] as { k: PriceFilter; l: string }[]).map(f => (
                    <button key={f.k} onClick={() => setPriceFilter(f.k)}
                      className={cn('px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all',
                        priceFilter === f.k ? 'border-sea-400 bg-sea-50 text-sea-700' : 'border-slate-200 text-slate-500')}>
                      {f.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Cuisine</p>
                <div className="flex gap-2 flex-wrap">
                  {([{ k: 'all', l: 'All' }, { k: 'indian', l: 'Indian' }, { k: 'street food', l: 'Street food' }, { k: 'cafe', l: 'Café' }, { k: 'international', l: 'International' }] as { k: CuisineFilter; l: string }[]).map(f => (
                    <button key={f.k} onClick={() => setCuisineFilter(f.k)}
                      className={cn('px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all',
                        cuisineFilter === f.k ? 'border-sea-400 bg-sea-50 text-sea-700' : 'border-slate-200 text-slate-500')}>
                      {f.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results header */}
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          <span className="font-extrabold text-slate-900 dark:text-slate-100">{filtered.length}</span> restaurants found
          {dietFilter === 'veg' && <span className="ml-2 text-sage-600 font-semibold">· Veg only</span>}
          {dietFilter === 'jain' && <span className="ml-2 text-purple-600 font-semibold">· Jain friendly</span>}
        </p>

        {/* Results */}
        <div className="space-y-3">
          {filtered.length === 0
            ? <div className="card p-10 text-center text-slate-400">No restaurants match your filters. Try relaxing them!</div>
            : filtered.map(r => <RestaurantCard key={r.id} r={r} />)
          }
        </div>

        {/* Coming soon note for real data */}
        <div className="card p-4 bg-amber-50 border-amber-100 text-center text-xs text-amber-700">
          Real restaurant data for {destination.split(',')[0]} coming soon. Showing curated picks for now.
        </div>
      </div>
    </div>
  )
}

export default function FoodFinderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-sea-50 dark:bg-[#0a0f0e] flex items-center justify-center">
        <Loader2 className="animate-spin text-sea-500" size={32} />
      </div>
    }>
      <FoodFinderInner />
    </Suspense>
  )
}
