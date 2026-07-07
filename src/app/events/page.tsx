'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft, MapPin, Clock, Ticket, Star, ExternalLink,
  Music, Palette, ShoppingBag, Utensils, Leaf, Zap, Heart,
  Filter, Search, Calendar, ChevronRight, Sparkles, Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
type EventCategory = 'market' | 'music' | 'art' | 'food' | 'culture' | 'nightlife' | 'outdoor' | 'popup'
type PriceType = 'free' | 'paid' | 'donation'
type Vibe = 'local' | 'trendy' | 'chill' | 'buzzing' | 'hidden gem'

interface LocalEvent {
  id: string
  name: string
  category: EventCategory
  date: string          // "Every Saturday" | "Apr 5–7" | "Ongoing"
  time: string
  location: string
  area: string
  price: PriceType
  priceNote?: string
  rating?: number
  vibes: Vibe[]
  description: string
  highlight?: string    // one bold pull quote
  tips?: string
  emoji: string
  image?: string        // gradient fallback if no image
  gradient: string
  saved?: boolean
}

// ─── Korea / Seoul events (rich mock data) ───────────────────────────────────
const KOREA_EVENTS: LocalEvent[] = [
  {
    id: 'e1',
    name: 'Hongdae Free Market',
    category: 'market',
    date: 'Every Saturday & Sunday',
    time: '1:00 PM – 6:00 PM',
    location: 'Hongik University Park, Mapo-gu',
    area: 'Hongdae',
    price: 'free',
    rating: 4.8,
    vibes: ['local', 'trendy', 'buzzing'],
    description: 'The original indie artist market in Seoul. Handmade crafts, vintage clothes, local street art, and live buskers competing for your attention on every corner.',
    highlight: '"The most authentic slice of Seoul\'s creative underground"',
    tips: 'Come hungry — food trucks line the park. Best finds before 3pm before crowds peak.',
    emoji: '🎨',
    gradient: 'from-pink-400 to-orange-400',
  },
  {
    id: 'e2',
    name: 'Seongsu Pop-Up District',
    category: 'popup',
    date: 'Ongoing (rotating brands)',
    time: '11:00 AM – 9:00 PM',
    location: 'Seongsu-dong, Seongdong-gu',
    area: 'Seongsu',
    price: 'free',
    priceNote: 'Some brand activations ticketed',
    rating: 4.7,
    vibes: ['trendy', 'hidden gem', 'local'],
    description: 'Seoul\'s "Brooklyn" — former industrial warehouses turned into rotating pop-up concept stores, K-beauty labs, and specialty coffee roasters. New brand activations open every week.',
    highlight: '"New experience every visit — impossible to see it all in one trip"',
    tips: 'Check @seongsumarket on Instagram before going to see which pop-ups are live.',
    emoji: '✨',
    gradient: 'from-purple-400 to-pink-400',
  },
  {
    id: 'e3',
    name: 'Gwangjang Market Night Food Tour',
    category: 'food',
    date: 'Every day (best Fri–Sat evening)',
    time: '5:00 PM – 11:00 PM',
    location: 'Gwangjang Market, Jongno-gu',
    area: 'Jongno',
    price: 'free',
    priceNote: 'Pay per dish ₩2,000–8,000',
    rating: 4.9,
    vibes: ['local', 'buzzing', 'chill'],
    description: 'Seoul\'s oldest traditional market transforms at night into a packed alley of grandmothers\' stalls selling bindaetteok (mung bean pancakes), mayak gimbap, and raw fermented skate. A ritual for locals.',
    highlight: '"The bindaetteok here changed how I think about Korean food"',
    tips: 'Look for the stalls with the longest queues — always the best ones. Bring cash.',
    emoji: '🥘',
    gradient: 'from-amber-400 to-red-400',
  },
  {
    id: 'e4',
    name: 'Bukchon Lantern Festival',
    category: 'culture',
    date: 'Apr 12–Apr 20',
    time: '7:00 PM – 10:00 PM',
    location: 'Bukchon Hanok Village, Jongno-gu',
    area: 'Bukchon',
    price: 'free',
    rating: 4.8,
    vibes: ['local', 'chill', 'hidden gem'],
    description: 'Traditional lanterns hung along the alleys of the 600-year-old Hanok village. Local residents place candles in hand-painted paper lanterns. One of Seoul\'s most photogenic seasonal events.',
    highlight: '"Felt like stepping back into the Joseon dynasty"',
    tips: 'Arrive after 8pm for full dark — the glow is magical. Weeknights are quieter than weekends.',
    emoji: '🏮',
    gradient: 'from-orange-400 to-yellow-400',
  },
  {
    id: 'e5',
    name: 'COEX Artium Exhibition',
    category: 'art',
    date: 'Mar 30 – May 31',
    time: '10:00 AM – 9:00 PM',
    location: 'COEX Mall, Gangnam-gu',
    area: 'Gangnam',
    price: 'paid',
    priceNote: '₩18,000 (~₹1,100)',
    rating: 4.6,
    vibes: ['trendy', 'buzzing'],
    description: 'Immersive media art installation by Studio Kimchi — 3D projection mapping fills four floors of the iconic aquarium building. Think teamLab but distinctly Korean with traditional motifs meeting generative AI visuals.',
    highlight: '"Every room is its own universe — budget 2 hours minimum"',
    tips: 'Buy tickets online — often sells out on weekends. The basement floor has the best installations.',
    emoji: '🎭',
    gradient: 'from-indigo-400 to-purple-400',
  },
  {
    id: 'e6',
    name: 'Han River Picnic & Cycling',
    category: 'outdoor',
    date: 'Every weekend (April–October)',
    time: 'Open all day',
    location: 'Yeouido Hangang Park',
    area: 'Yeouido',
    price: 'free',
    priceNote: 'Bike rental ₩3,000/hr',
    rating: 4.7,
    vibes: ['local', 'chill'],
    description: 'Seoul\'s massive riverside park is weekend HQ for locals — families, couples, and friend groups spread picnic mats, fly kites, and cycle the 40km trail. Convenience store fried chicken + Han River is a Seoul ritual you must do.',
    highlight: '"The chicken-and-beer combo with Han River views is a rite of passage"',
    tips: 'GS25 or CU convenience stores at the park sell everything you need for a picnic. Rent bikes at the main entrance.',
    emoji: '🚴',
    gradient: 'from-cyan-400 to-blue-400',
  },
  {
    id: 'e7',
    name: 'Itaewon Global Village Festival',
    category: 'culture',
    date: 'Apr 19–Apr 21',
    time: '12:00 PM – 9:00 PM',
    location: 'Itaewon-ro main street',
    area: 'Itaewon',
    price: 'free',
    rating: 4.5,
    vibes: ['buzzing', 'local', 'trendy'],
    description: 'Annual street festival celebrating Seoul\'s most multicultural neighbourhood. Food stalls from 40+ countries, live world music stages, cultural performances, and international craft vendors take over 1km of road.',
    highlight: '"100 nationalities, one street — nothing else like it in Asia"',
    tips: 'The Middle Eastern and African food stalls are hidden gems toward the far end. Come before 3pm to beat queues.',
    emoji: '🌍',
    gradient: 'from-green-400 to-teal-400',
  },
  {
    id: 'e8',
    name: 'Nanta Cooking Show',
    category: 'music',
    date: 'Daily performances',
    time: '5:00 PM & 8:00 PM',
    location: 'Nanta Theatre, Myeongdong',
    area: 'Myeongdong',
    price: 'paid',
    priceNote: '₩50,000–70,000 (~₹3,000–4,300)',
    rating: 4.6,
    vibes: ['buzzing', 'trendy'],
    description: 'Korea\'s longest-running non-verbal performance — four kitchen workers prepare a wedding banquet using drumbeats on pots, pans, and kitchen tools. Equal parts cooking demo, comedy show, and percussion concert. No language barrier.',
    highlight: '"Audience participation section had the whole theatre screaming with laughter"',
    tips: 'Sit in the front 5 rows for the full audience-participation experience. Book 2 days ahead.',
    emoji: '🥁',
    gradient: 'from-red-400 to-pink-400',
  },
  {
    id: 'e9',
    name: 'Dongdaemun Design Plaza Flea Market',
    category: 'market',
    date: 'Every Saturday',
    time: '10:00 AM – 5:00 PM',
    location: 'DDP Outdoor Plaza, Jung-gu',
    area: 'Dongdaemun',
    price: 'free',
    priceNote: 'Items from ₩5,000',
    rating: 4.5,
    vibes: ['trendy', 'hidden gem', 'local'],
    description: 'Weekend flea market set against Zaha Hadid\'s futuristic DDP building. Young Korean designers sell vintage fashion, upcycled goods, indie zines, and handmade ceramics alongside vintage camera dealers and rare vinyl records.',
    highlight: '"Best place to find Korean indie designer pieces before they go mainstream"',
    tips: 'The DDP itself has free architecture exhibitions inside — pair the two visits.',
    emoji: '🏛️',
    gradient: 'from-slate-500 to-blue-500',
  },
  {
    id: 'e10',
    name: 'Insadong Craft Street',
    category: 'culture',
    date: 'Every day',
    time: '10:00 AM – 10:00 PM',
    location: 'Insadong-gil, Jongno-gu',
    area: 'Insadong',
    price: 'free',
    priceNote: 'Pay per purchase',
    rating: 4.6,
    vibes: ['local', 'chill', 'hidden gem'],
    description: 'Seoul\'s traditional arts district with 100+ galleries, antique shops, and teahouses in hanok buildings. Street vendors sell Korean hanji paper crafts, calligraphy sets, and traditional teas. The "Ssamzie Court" maze alley is unmissable.',
    highlight: '"The kind of neighbourhood that reveals something new every time you walk through"',
    tips: 'Try the traditional desserts at Nakwon Arcade — bungeo-ppang and hotteok in winter, icy patbingsu in summer.',
    emoji: '🎎',
    gradient: 'from-amber-400 to-orange-300',
  },
]

// ─── Category config ──────────────────────────────────────────────────────────
const CAT_CONFIG: Record<EventCategory, { label: string; icon: React.ElementType; color: string }> = {
  market:    { label: 'Markets',   icon: ShoppingBag, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  music:     { label: 'Music',     icon: Music,       color: 'bg-red-50 text-red-700 border-red-200' },
  art:       { label: 'Art',       icon: Palette,     color: 'bg-purple-50 text-purple-700 border-purple-200' },
  food:      { label: 'Food',      icon: Utensils,    color: 'bg-orange-50 text-orange-700 border-orange-200' },
  culture:   { label: 'Culture',   icon: Globe,       color: 'bg-sea-50 text-sea-700 border-sea-200' },
  nightlife: { label: 'Nightlife', icon: Zap,         color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  outdoor:   { label: 'Outdoors',  icon: Leaf,        color: 'bg-sage-50 text-sage-700 border-sage-200' },
  popup:     { label: 'Pop-ups',   icon: Sparkles,    color: 'bg-pink-50 text-pink-700 border-pink-200' },
}

const VIBE_COLOR: Record<Vibe, string> = {
  'local':      'bg-sage-100 text-sage-700',
  'trendy':     'bg-pink-100 text-pink-700',
  'chill':      'bg-sea-100 text-sea-700',
  'buzzing':    'bg-amber-100 text-amber-700',
  'hidden gem': 'bg-purple-100 text-purple-700',
}

// ─── Event card ───────────────────────────────────────────────────────────────
function EventCard({ event }: { event: LocalEvent }) {
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const cat = CAT_CONFIG[event.category]
  const CatIcon = cat.icon

  return (
    <div className="card shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      {/* Gradient header */}
      <div className={cn('bg-gradient-to-br h-24 relative flex items-end px-4 pb-3', event.gradient)}>
        <span className="text-4xl drop-shadow">{event.emoji}</span>
        {/* Price badge */}
        <span className={cn(
          'absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full',
          event.price === 'free' ? 'bg-sage-500 text-white' : 'bg-slate-900/70 backdrop-blur-sm text-white'
        )}>
          {event.price === 'free' ? '✓ Free' : event.priceNote ?? 'Paid'}
        </span>
        {/* Save button */}
        <button onClick={() => setSaved(v => !v)}
          className={cn('absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center transition-all',
            saved ? 'bg-red-500 text-white' : 'bg-white/30 backdrop-blur-sm text-white/80 hover:bg-white/50')}>
          <Heart size={13} fill={saved ? 'currentColor' : 'none'} />
        </button>
        {/* Date strip */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent px-4 pb-2 pt-4">
          <div className="flex items-center gap-1.5">
            <Calendar size={10} className="text-white/80" />
            <span className="text-white text-[11px] font-bold">{event.date}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Category + area */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={cn('flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border', cat.color)}>
            <CatIcon size={10} /> {cat.label}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <MapPin size={10} /> {event.area}
          </span>
          {event.rating && (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 ml-auto">
              <Star size={10} fill="currentColor" /> {event.rating}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base leading-tight mb-1">{event.name}</h3>

        {/* Time */}
        <p className="flex items-center gap-1 text-xs text-slate-400 mb-2">
          <Clock size={10} /> {event.time}
        </p>

        {/* Vibe tags */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {event.vibes.map(v => (
            <span key={v} className={cn('text-xs px-2 py-0.5 rounded-full font-semibold capitalize', VIBE_COLOR[v])}>
              {v}
            </span>
          ))}
        </div>

        {/* Description (collapsed / expanded) */}
        <p className={cn('text-sm text-slate-600 dark:text-slate-300 leading-relaxed', !expanded && 'line-clamp-2')}>
          {event.description}
        </p>

        {expanded && (
          <div className="mt-3 space-y-2.5 animate-fade-up">
            {event.highlight && (
              <div className="p-3 rounded-2xl bg-sea-50 border border-sea-100">
                <p className="text-xs text-sea-700 italic font-medium leading-relaxed">{event.highlight}</p>
              </div>
            )}
            {event.tips && (
              <div className="flex gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-100">
                <Sparkles size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-800 mb-0.5">Local tip</p>
                  <p className="text-xs text-amber-700 leading-relaxed">{event.tips}</p>
                </div>
              </div>
            )}
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin size={10} /> {event.location}
            </p>
          </div>
        )}

        <button onClick={() => setExpanded(v => !v)}
          className="mt-3 flex items-center gap-1 text-xs font-bold text-sea-600 hover:text-sea-800 transition-colors">
          {expanded ? 'Show less' : 'Read more & tips'}
          <ChevronRight size={12} className={cn('transition-transform', expanded && 'rotate-90')} />
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function EventsInner() {
  const searchParams = useSearchParams()
  const tripId = searchParams.get('tripId')

  const [search, setSearch]   = useState('')
  const [catFilter, setCatFilter] = useState<EventCategory | 'all'>('all')
  const [priceFilter, setPriceFilter] = useState<PriceType | 'all'>('all')
  const [vibeFilter, setVibeFilter] = useState<Vibe | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [events, setEvents]       = useState<LocalEvent[]>(KOREA_EVENTS)
  const [destination, setDestination] = useState('Seoul, Korea')
  const [loading, setLoading]     = useState(false)
  const [comingSoon, setComingSoon] = useState(false)

  const backHref = tripId ? `/trips/${tripId}` : '/dashboard'

  useEffect(() => {
    // Priority 1: load from trip API (real trip context)
    if (tripId) {
      fetch(`/api/trips/${tripId}/meta`)
        .then(r => r.json())
        .then(data => {
          const dest = data.trip?.destination as string | undefined
          if (dest && dest.trim()) {
            setDestination(dest)
            setLoading(true)
            setEvents([])
            fetch(`/api/events?destination=${encodeURIComponent(dest)}`)
              .then(r => r.json())
              .then(d => {
                if (d.events?.length > 0) {
                  setEvents(d.events)
                  setComingSoon(false)
                } else {
                  setComingSoon(true)
                }
              })
              .catch(() => setComingSoon(true))
              .finally(() => setLoading(false))
          }
        })
        .catch(() => {})
      return
    }
    // Priority 2: sessionStorage fallback (preview mode)
    try {
      const raw = sessionStorage.getItem('roamriot_itinerary')
      if (raw) {
        const data = JSON.parse(raw)
        const dest = data.destination as string | undefined
        if (dest && dest.trim()) {
          setDestination(dest)
          setLoading(true)
          setEvents([])
          fetch(`/api/events?destination=${encodeURIComponent(dest)}`)
            .then(r => r.json())
            .then(d => {
              if (d.events?.length > 0) {
                setEvents(d.events)
                setComingSoon(false)
              } else {
                setComingSoon(true)
              }
            })
            .catch(() => setComingSoon(true))
            .finally(() => setLoading(false))
        }
      }
    } catch {
      // sessionStorage unavailable — keep Seoul defaults
    }
  }, [tripId])

  const filtered = events.filter(e => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) &&
        !e.area.toLowerCase().includes(search.toLowerCase()) &&
        !e.description.toLowerCase().includes(search.toLowerCase())) return false
    if (catFilter !== 'all' && e.category !== catFilter) return false
    if (priceFilter !== 'all' && e.price !== priceFilter) return false
    if (vibeFilter !== 'all' && !e.vibes.includes(vibeFilter as Vibe)) return false
    return true
  })

  const freeCount = events.filter(e => e.price === 'free').length
  const cityName = destination.split(',')[0].trim()

  return (
    <div className="min-h-screen bg-gradient-to-b from-sea-50 via-white to-white">

      {/* Nav */}
      <nav className="bg-white/90 dark:bg-[#111a18]/90 backdrop-blur-xl border-b border-sea-100 dark:border-[#1e2f2b] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href={backHref} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0">
            <ArrowLeft size={15} className="text-slate-600" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm truncate">What&apos;s On</p>
            <p className="text-xs text-slate-400 truncate flex items-center gap-1">
              <MapPin size={9} /> {destination}
            </p>
          </div>
          <Link href={tripId ? `/food?tripId=${tripId}` : '/food'} className="btn-ghost text-xs px-3 py-1.5 gap-1.5 flex-shrink-0">
            <Utensils size={12} /> Food
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Hero header */}
        <div className="mb-5">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
            What&apos;s happening in{' '}
            <span className="text-gradient">{cityName}</span>
          </h1>
          {loading ? (
            <p className="text-slate-400 text-sm mt-1.5 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-sea-300 border-t-sea-600 animate-spin inline-block" />
              Finding local events in {cityName}…
            </p>
          ) : (
            <p className="text-slate-500 text-sm mt-1.5">
              {events.length} local experiences · {freeCount} completely free · curated for outsiders who want to go deep
            </p>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="h-24 bg-gradient-to-br from-slate-200 to-slate-100" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-slate-200 rounded-full w-1/2" />
                  <div className="h-4 bg-slate-200 rounded-full w-4/5" />
                  <div className="h-3 bg-slate-100 rounded-full w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats chips */}
        {!loading && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { label: `${freeCount} free`,    color: 'bg-sage-100 text-sage-700 border-sage-200' },
            { label: 'This month',           color: 'bg-sea-100 text-sea-700 border-sea-200' },
            { label: 'Hidden gems included', color: 'bg-purple-100 text-purple-700 border-purple-200' },
          ].map(({ label, color }) => (
            <span key={label} className={cn('text-xs font-bold px-3 py-1 rounded-full border', color)}>{label}</span>
          ))}
        </div>
        )}

        {/* Search + filter bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-10 h-10 rounded-2xl text-sm"
              placeholder="Search events, areas…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            className={cn('flex items-center gap-1.5 px-4 h-10 rounded-2xl text-sm font-bold border-2 transition-all',
              showFilters ? 'border-sea-400 bg-sea-50 text-sea-700' : 'border-slate-200 text-slate-600 dark:text-slate-300 hover:border-sea-200')}>
            <Filter size={13} /> Filters
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mb-5 p-4 rounded-3xl bg-white border border-slate-100 shadow-soft space-y-4 animate-fade-up">
            {/* Category */}
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setCatFilter('all')}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all',
                    catFilter === 'all' ? 'border-sea-400 bg-sea-50 text-sea-700' : 'border-slate-200 text-slate-500')}>
                  All
                </button>
                {(Object.keys(CAT_CONFIG) as EventCategory[]).map(c => {
                  const { label, icon: Icon, color } = CAT_CONFIG[c]
                  return (
                    <button key={c} onClick={() => setCatFilter(c === catFilter ? 'all' : c)}
                      className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all',
                        catFilter === c ? 'border-sea-400 bg-sea-50 text-sea-700' : 'border-slate-200 text-slate-500 dark:text-slate-400 hover:border-sea-200')}>
                      <Icon size={10} /> {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Price */}
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Price</p>
              <div className="flex gap-2">
                {(['all', 'free', 'paid', 'donation'] as const).map(p => (
                  <button key={p} onClick={() => setPriceFilter(p)}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all capitalize',
                      priceFilter === p ? 'border-sea-400 bg-sea-50 text-sea-700' : 'border-slate-200 text-slate-500')}>
                    {p === 'all' ? 'Any price' : p}
                  </button>
                ))}
              </div>
            </div>

            {/* Vibe */}
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Vibe</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setVibeFilter('all')}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all',
                    vibeFilter === 'all' ? 'border-sea-400 bg-sea-50 text-sea-700' : 'border-slate-200 text-slate-500')}>
                  All vibes
                </button>
                {(['local', 'trendy', 'chill', 'buzzing', 'hidden gem'] as Vibe[]).map(v => (
                  <button key={v} onClick={() => setVibeFilter(v === vibeFilter ? 'all' : v)}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all capitalize',
                      vibeFilter === v ? 'border-sea-400 bg-sea-50 text-sea-700' : 'border-slate-200 text-slate-500')}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Result count */}
        {!loading && (
        <p className="text-xs text-slate-400 font-semibold mb-4">
          {filtered.length} experience{filtered.length !== 1 ? 's' : ''} {filtered.length < events.length && `(filtered from ${events.length})`}
        </p>
        )}

        {/* Category quick scroll */}
        {!loading && (
        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1">
          {(Object.keys(CAT_CONFIG) as EventCategory[]).map(c => {
            const { label, icon: Icon } = CAT_CONFIG[c]
            const count = events.filter((e: LocalEvent) => e.category === c).length
            return (
              <button key={c} onClick={() => setCatFilter(c === catFilter ? 'all' : c)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold border-2 transition-all',
                  catFilter === c
                    ? 'border-sea-400 bg-sea-500 text-white shadow-soft'
                    : 'border-slate-200 bg-white text-slate-600 dark:text-slate-300 hover:border-sea-200 hover:bg-sea-50'
                )}>
                <Icon size={12} /> {label}
                <span className={cn('text-[10px] font-bold ml-0.5', catFilter === c ? 'text-white/80' : 'text-slate-400')}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
        )}

        {/* Coming soon state */}
        {comingSoon && !loading && (
          <div className="card p-10 text-center mb-6">
            <p className="text-5xl mb-4">🗺️</p>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg mb-2">Events for {cityName} coming soon</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
              We&apos;re working on real-time event data for {cityName}. Check back closer to your trip dates.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sea-300 animate-pulse" />
              <span className="text-xs font-semibold text-sea-600">In development</span>
            </div>
          </div>
        )}

        {/* Event grid */}
        {!comingSoon && filtered.length === 0 && !loading ? (
          <div className="card p-10 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-bold text-slate-700 dark:text-slate-200">No events match your filters</p>
            <button onClick={() => { setSearch(''); setCatFilter('all'); setPriceFilter('all'); setVibeFilter('all') }}
              className="mt-4 text-sm font-bold text-sea-600 hover:underline">
              Clear all filters
            </button>
          </div>
        ) : !comingSoon ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        ) : null}

        {/* Footer note */}
        <div className="mt-8 p-4 rounded-3xl bg-slate-50 border border-slate-100 text-center">
          <p className="text-xs text-slate-400 leading-relaxed">
            Events curated using AI and local knowledge. Dates and times may change — always verify before visiting.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sea-50" />}>
      <EventsInner />
    </Suspense>
  )
}
