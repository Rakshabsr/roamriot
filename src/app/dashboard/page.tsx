'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus, MapPin, Calendar, LogOut, Utensils, Wallet,
  Clock, Users, Sparkles, ChevronRight, Star, Globe,
  TrendingUp, Compass, Music
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Trip } from '@/lib/types'
import { formatDate, getTripDays } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { TripCardSkeleton } from '@/components/ui/SkeletonCard'

// ─── destination emoji / gradient lookup ────────────────────────────────────
const DEST_THEMES: Record<string, { emoji: string; gradient: string; accent: string }> = {
  jaipur:     { emoji: '🏯', gradient: 'from-orange-400 to-pink-500',    accent: 'bg-orange-50 text-orange-700 border-orange-200' },
  bali:       { emoji: '🌴', gradient: 'from-emerald-400 to-teal-500',   accent: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  goa:        { emoji: '🏖️', gradient: 'from-cyan-400 to-blue-500',      accent: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  mumbai:     { emoji: '🌆', gradient: 'from-purple-400 to-indigo-500',  accent: 'bg-purple-50 text-purple-700 border-purple-200' },
  delhi:      { emoji: '🕌', gradient: 'from-red-400 to-orange-500',     accent: 'bg-red-50 text-red-700 border-red-200' },
  kyoto:      { emoji: '⛩️', gradient: 'from-rose-400 to-pink-500',      accent: 'bg-rose-50 text-rose-700 border-rose-200' },
  paris:      { emoji: '🗼', gradient: 'from-blue-400 to-indigo-500',    accent: 'bg-blue-50 text-blue-700 border-blue-200' },
  lisbon:     { emoji: '🏙️', gradient: 'from-yellow-400 to-orange-500',  accent: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  bangkok:    { emoji: '🛕', gradient: 'from-amber-400 to-yellow-500',   accent: 'bg-amber-50 text-amber-700 border-amber-200' },
  singapore:  { emoji: '🌃', gradient: 'from-sea-400 to-cyan-500',       accent: 'bg-sea-50 text-sea-700 border-sea-200' },
  default:    { emoji: '✈️', gradient: 'from-sea-400 to-sage-500',       accent: 'bg-sea-50 text-sea-700 border-sea-200' },
}

function getTheme(dest: string) {
  const key = dest.toLowerCase().split(',')[0].trim()
  return DEST_THEMES[key] ?? DEST_THEMES.default
}

function getTripStatus(start: string, end: string): { label: string; color: string } {
  const now  = new Date()
  const s    = new Date(start)
  const e    = new Date(end)
  if (now < s) {
    const daysUntil = Math.ceil((s.getTime() - now.getTime()) / 86_400_000)
    if (daysUntil <= 7)  return { label: `In ${daysUntil}d`, color: 'bg-amber-100 text-amber-700' }
    if (daysUntil <= 30) return { label: `In ${daysUntil}d`, color: 'bg-sea-100 text-sea-700' }
    return { label: 'Upcoming', color: 'bg-slate-100 text-slate-600' }
  }
  if (now <= e) return { label: '🟢 Active', color: 'bg-sage-100 text-sage-700' }
  return { label: 'Completed', color: 'bg-slate-100 text-slate-500' }
}

function getDietLabel(dietary?: string): { emoji: string; label: string } | null {
  if (!dietary || dietary === 'none') return null
  if (dietary === 'veg')  return { emoji: '🥗', label: 'Veg' }
  if (dietary === 'jain') return { emoji: '☯️', label: 'Jain' }
  if (dietary === 'vegan') return { emoji: '🌱', label: 'Vegan' }
  return null
}

// ─── Mock trips shown when Supabase is empty ────────────────────────────────
const MOCK_TRIPS: Trip[] = [
  { id: 'mock-1', user_id: '', destination: 'Jaipur, Rajasthan', start_date: '2026-04-10', end_date: '2026-04-14', preferences: { dietary: 'vegetarian', budget: 'budget', travelStyle: 'comfort', travelers: 2 } as Trip['preferences'], created_at: new Date().toISOString() },
  { id: 'mock-2', user_id: '', destination: 'Bali, Indonesia',   start_date: '2026-05-20', end_date: '2026-05-26', preferences: { dietary: 'none',        budget: 'mid',    travelStyle: 'comfort', travelers: 1 } as Trip['preferences'], created_at: new Date().toISOString() },
]

// ─── Trip card ───────────────────────────────────────────────────────────────
function TripCard({ trip, isMock }: { trip: Trip; isMock?: boolean }) {
  const theme   = getTheme(trip.destination)
  const days    = getTripDays(trip.start_date, trip.end_date)
  const status  = getTripStatus(trip.start_date, trip.end_date)
  const diet    = getDietLabel(trip.preferences?.dietary)
  const href    = isMock ? '/trips/preview' : `/trips/${trip.id}`

  return (
    <div className="card shadow-card hover:shadow-lift hover:-translate-y-1 transition-all duration-200 overflow-hidden">
      {/* Gradient header */}
      <div className={cn('bg-gradient-to-br h-28 relative flex items-center justify-center', theme.gradient)}>
        <span className="text-5xl drop-shadow-sm">{theme.emoji}</span>
        {/* Status badge */}
        <span className={cn('absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full', status.color)}>
          {status.label}
        </span>
        {/* Day count */}
        <span className="absolute bottom-3 left-3 bg-black/20 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
          {days} day{days !== 1 ? 's' : ''}
        </span>
        {isMock && (
          <span className="absolute top-3 left-3 bg-black/20 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            Demo
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base leading-tight">{trip.destination}</h3>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <Calendar size={10} />
              {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
            </p>
          </div>
          {diet && (
            <span className={cn('flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border', theme.accent)}>
              {diet.emoji} {diet.label}
            </span>
          )}
        </div>

        {/* Meta chips */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {trip.preferences?.travelers && (
            <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
              <Users size={10} /> {trip.preferences.travelers} traveler{trip.preferences.travelers > 1 ? 's' : ''}
            </span>
          )}
          {trip.preferences?.budget && (
            <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
              <Wallet size={10} /> {trip.preferences.budget === 'budget' ? 'Budget ₹' : trip.preferences.budget === 'mid' ? 'Mid ₹₹' : 'Splurge ₹₹₹'}
            </span>
          )}
          {trip.preferences?.travelStyle && (
            <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
              <Compass size={10} /> {trip.preferences.travelStyle}
            </span>
          )}
        </div>

        {/* Quick action links */}
        <div className="flex gap-2">
          <Link href={href}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl bg-gradient-to-r from-sea-500 to-sea-600 text-white text-xs font-bold hover:from-sea-600 hover:to-sea-700 transition-all shadow-soft">
            <Clock size={11} /> Itinerary
          </Link>
          <Link href="/expenses"
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold hover:border-sea-300 hover:text-sea-600 transition-all">
            <Wallet size={11} />
          </Link>
          <Link href="/food"
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold hover:border-sage-300 hover:text-sage-600 transition-all">
            <Utensils size={11} />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Stats strip ─────────────────────────────────────────────────────────────
function StatsStrip({ trips }: { trips: Trip[] }) {
  const totalDays   = trips.reduce((s, t) => s + getTripDays(t.start_date, t.end_date), 0)
  const destinations = new Set(trips.map(t => t.destination.split(',')[0].trim())).size
  const upcoming    = trips.filter(t => new Date(t.start_date) > new Date()).length

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { icon: Globe,     value: trips.length, label: 'Trips planned' },
        { icon: Clock,     value: totalDays,    label: 'Days explored' },
        { icon: TrendingUp,value: upcoming,     label: 'Upcoming' },
      ].map(({ icon: Icon, value, label }) => (
        <div key={label} className="card p-3 text-center shadow-soft">
          <Icon size={16} className="text-sea-500 mx-auto mb-1" />
          <p className="text-2xl font-extrabold text-slate-900 leading-none">{value}</p>
          <p className="text-xs text-slate-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Inspiration card (empty / bottom) ───────────────────────────────────────
const INSPO = [
  { dest: 'Jaipur', tag: 'Pink City magic', emoji: '🏯' },
  { dest: 'Bali',   tag: 'Tropical vibes',  emoji: '🌴' },
  { dest: 'Kyoto',  tag: 'Zen & temples',   emoji: '⛩️' },
  { dest: 'Lisbon', tag: 'Pastel streets',  emoji: '🏙️' },
]

function InspoRow() {
  return (
    <div className="mt-8">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <Sparkles size={12} /> Trending destinations
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {INSPO.map(i => {
          const theme = getTheme(i.dest)
          return (
            <Link key={i.dest} href="/trips/new"
              className="card p-3 flex items-center gap-2.5 hover:shadow-card hover:-translate-y-0.5 transition-all duration-150">
              <span className={cn('w-9 h-9 rounded-2xl bg-gradient-to-br flex items-center justify-center text-lg flex-shrink-0', theme.gradient)}>
                {i.emoji}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{i.dest}</p>
                <p className="text-xs text-slate-400 truncate">{i.tag}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [trips, setTrips]   = useState<Trip[]>([])
  const [user, setUser]     = useState<{ email?: string; user_metadata?: { full_name?: string } } | null>(null)
  const [loading, setLoading] = useState(true)
  const [useMock, setUseMock] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (user) {
          const { data } = await supabase
            .from('trips')
            .select('*')
            .order('created_at', { ascending: false })
          if (data && data.length > 0) {
            setTrips(data)
          } else {
            setTrips(MOCK_TRIPS)
            setUseMock(true)
          }
        } else {
          setTrips(MOCK_TRIPS)
          setUseMock(true)
        }
      } catch {
        setTrips(MOCK_TRIPS)
        setUseMock(true)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } finally {
      window.location.href = '/'
    }
  }

  const name  = user?.user_metadata?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Traveler'
  const greet = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="min-h-screen bg-gradient-to-b from-sea-50 via-white to-white">

      {/* Nav */}
      <nav className="bg-white/90 backdrop-blur-xl border-b border-sea-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="text-xl">🌍</span>
            <span className="font-extrabold text-slate-900 text-lg">
              Roam<span className="text-gradient">Riot</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/trips/new"
              className="btn-primary text-xs px-4 py-2 gap-1.5 hidden sm:flex">
              <Plus size={13} /> New trip
            </Link>
            <button onClick={handleLogout}
              className="btn-ghost text-xs px-3 py-1.5 gap-1.5 text-slate-500">
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Hero greeting */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {greet}, {name} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {useMock
                ? 'Here are some demo trips — create your own to get started!'
                : trips.length === 0
                  ? 'Ready to plan your next adventure?'
                  : `You have ${trips.length} trip${trips.length > 1 ? 's' : ''} planned. Where to next?`}
            </p>
          </div>
          <Link href="/trips/new"
            className="btn-primary text-sm px-5 py-2.5 gap-2 flex-shrink-0 sm:hidden">
            <Plus size={14} /> Plan
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TripCardSkeleton />
            <TripCardSkeleton />
          </div>
        ) : (
          <>
            {/* Stats strip — only when there are real trips */}
            {trips.length > 0 && !useMock && <StatsStrip trips={trips} />}

            {/* Empty state for authenticated users with no trips */}
            {user && trips.length === 0 && !useMock && (
              <div className="py-16 text-center space-y-4 animate-fade-up">
                <div className="text-6xl">🗺️</div>
                <h2 className="font-extrabold text-slate-800 text-xl">No trips yet</h2>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                  Build your first itinerary in under a minute — just tell us where you&apos;re headed.
                </p>
                <Link href="/trips/new" className="btn-primary inline-flex gap-2 mt-2">
                  <Sparkles size={15} /> Plan my first trip
                </Link>
              </div>
            )}

            {/* Demo banner */}
            {useMock && (
              <div className="mb-5 p-4 rounded-3xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                <Sparkles size={18} className="text-amber-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-amber-800">Showing demo trips</p>
                  <p className="text-xs text-amber-600">Connect Supabase or create a new trip to see your real plans here.</p>
                </div>
                <Link href="/trips/new" className="flex-shrink-0 flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900">
                  Start <ChevronRight size={12} />
                </Link>
              </div>
            )}

            {/* Trip grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-up">
              {trips.map(trip => (
                <TripCard key={trip.id} trip={trip} isMock={useMock} />
              ))}

              {/* "New trip" add card */}
              <Link href="/trips/new"
                className="card border-2 border-dashed border-sea-200 hover:border-sea-400 hover:bg-sea-50 transition-all duration-200 flex flex-col items-center justify-center gap-3 p-8 min-h-[220px]">
                <div className="w-12 h-12 rounded-full bg-sea-100 flex items-center justify-center">
                  <Plus size={22} className="text-sea-600" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-700 text-sm">Plan a new trip</p>
                  <p className="text-xs text-slate-400 mt-0.5">Get a full itinerary in seconds</p>
                </div>
              </Link>
            </div>

            {/* Bottom inspiration row */}
            <InspoRow />

            {/* Feature quick-access pills */}
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              {[
                { href: '/food',     icon: Utensils, label: 'Food Finder',    color: 'text-sage-600 bg-sage-50 border-sage-200' },
                { href: '/expenses', icon: Wallet,   label: 'Budget Tracker', color: 'text-sea-600 bg-sea-50 border-sea-200' },
                { href: '/events',   icon: Music,    label: "What's On",      color: 'text-purple-600 bg-purple-50 border-purple-200' },
                { href: '/trips/new',icon: Star,     label: 'New Adventure',  color: 'text-amber-600 bg-amber-50 border-amber-200' },
              ].map(({ href, icon: Icon, label, color }) => (
                <Link key={href} href={href}
                  className={cn('flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold hover:shadow-soft transition-all', color)}>
                  <Icon size={14} /> {label}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
