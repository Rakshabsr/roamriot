'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { MapPin, Sparkles, ArrowRight, ChevronRight, GripVertical, Heart, BookOpen, Map, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TravelBackground } from '@/components/ui/TravelBackground'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const features = [
  {
    icon: Map,
    title: 'Live map view',
    description: 'Every stop plotted on an interactive map. Spot clusters, plan smart routes, never backtrack.',
    color: 'from-sea-500 to-sea-600',
    bg: 'bg-sea-50',
  },
  {
    icon: Utensils,
    title: 'Diet-aware planning',
    description: 'Veg, Jain, or vegan? Every food stop is filtered to match your preference — zero awkward moments.',
    color: 'from-sage-400 to-sage-500',
    bg: 'bg-sage-50',
  },
  {
    icon: Heart,
    title: 'Trip variants for every group',
    description: 'Couple getaway, girls gang, family trip, solo female, senior friendly — itinerary tone adapts to who\'s travelling.',
    color: 'from-pink-400 to-rose-400',
    bg: 'bg-pink-50',
  },
  {
    icon: GripVertical,
    title: 'Reorder on the go',
    description: 'Plans change. Drag and drop any stop to a new time slot — your itinerary updates instantly.',
    color: 'from-purple-400 to-violet-500',
    bg: 'bg-purple-50',
  },
  {
    icon: BookOpen,
    title: 'Saved trips, always accessible',
    description: 'Your itineraries live in your account. Come back, tweak, reshare — your trips are never lost.',
    color: 'from-sand-400 to-sand-500',
    bg: 'bg-sand-50',
  },
  {
    icon: MapPin,
    title: 'Real places, real routes',
    description: 'Stops sourced from OpenStreetMap with Wikipedia context — actual places, not AI hallucinations.',
    color: 'from-sea-400 to-sea-600',
    bg: 'bg-sea-50',
  },
]

const destinations = ['Jaipur', 'Bali', 'Kyoto', 'Lisbon', 'Udaipur', 'Oaxaca']

export default function LandingPage() {
  const [destination, setDestination] = useState('')
  const [heroImage, setHeroImage]     = useState<string | null>(null)
  const [imgLoaded, setImgLoaded]     = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!destination.trim() || destination.trim().length < 3) {
      setHeroImage(null)
      setImgLoaded(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/unsplash?q=${encodeURIComponent(destination)}`)
        const data = await res.json()
        if (data.url) {
          setImgLoaded(false)
          setHeroImage(data.url)
        }
      } catch {}
    }, 600)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [destination])

  return (
    <div className="min-h-screen bg-[#FEFCF8] dark:bg-[#0a0f0e] overflow-x-hidden">

      {/* ─── Nav ─── */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#111a18]/80 backdrop-blur-xl border-b border-sea-100 dark:border-[#1e2f2b]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-gradient">RoamRiot</span>
          </span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-sea-600 transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary text-sm py-2">
              Get started free <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-sea-900">
        {/* Always-on rotating travel background */}
        <TravelBackground fixed />

        {/* Destination photo overlay — fades in when user types */}
        {heroImage && (
          <>
            <img
              src={heroImage}
              alt=""
              className={cn(
                'absolute inset-0 w-full h-full object-cover transition-opacity duration-700 pointer-events-none z-0',
                imgLoaded ? 'opacity-100' : 'opacity-0',
              )}
              onLoad={() => setImgLoaded(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70 pointer-events-none z-0" />
          </>
        )}

        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center flex flex-col items-center gap-6">

          {/* Brand wordmark */}
          <div className="animate-fade-up">
            <div className="mb-3">
              <span className="text-6xl sm:text-8xl font-extrabold tracking-tighter text-white [text-shadow:0_4px_24px_rgba(0,0,0,0.6)]">
                Roam<span className="text-sage-300">Riot</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white/90 text-xs font-semibold tracking-wide">
              <Sparkles size={11} className="text-sage-300" />
              AI-powered travel planner · built for every kind of traveller
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight [text-shadow:0_2px_16px_rgba(0,0,0,0.45)] animate-fade-up" style={{animationDelay:'0.08s'}}>
            {destination && imgLoaded
              ? <>Your trip to <span className="text-sage-300">{destination}</span>,<br />planned the smart way</>
              : <>Your trip. Planned smart.<br />Enjoyed fully.</>
            }
          </h1>

          <p className="text-white/80 text-base sm:text-lg max-w-md leading-relaxed animate-fade-up [text-shadow:0_1px_8px_rgba(0,0,0,0.4)]" style={{animationDelay:'0.14s'}}>
            Tell RoamRiot where you&apos;re going — get a day-by-day itinerary, live map, weather, currency, emergency info and more. All in one app.
          </p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md animate-fade-up" style={{animationDelay:'0.18s'}}>
            <div className="relative flex-1">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sea-300" />
              <input
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 text-white placeholder:text-white/50 text-base focus:outline-none focus:border-white/60 focus:bg-white/20 transition-all"
                placeholder="Where to? e.g. Jaipur, Bali, Tokyo"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && destination && (window.location.href = `/trips/new?destination=${encodeURIComponent(destination)}`)}
              />
            </div>
            <Link
              href={destination ? `/trips/new?destination=${encodeURIComponent(destination)}` : '/trips/new'}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-sage-500 hover:bg-sage-400 text-white font-bold text-base whitespace-nowrap transition-colors shadow-lg"
            >
              Plan my trip <ArrowRight size={16} />
            </Link>
          </div>

          {/* Quick destination chips */}
          <div className="flex flex-wrap gap-2 justify-center animate-fade-up" style={{animationDelay:'0.22s'}}>
            {destinations.map(d => (
              <button
                key={d}
                onClick={() => setDestination(d)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-150',
                  destination === d
                    ? 'border-white bg-white/25 text-white backdrop-blur-sm'
                    : 'border-white/30 text-white/70 hover:border-white/60 hover:text-white hover:bg-white/10'
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce opacity-60">
          <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-white/70" />
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-16 px-6 bg-gradient-to-b from-sea-50/40 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
              Everything for your trip
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              From first plan to last meal — RoamRiot keeps you moving.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={f.title} className="card-hover p-6 group animate-fade-up" style={{animationDelay:`${0.05*i}s`}}>
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-soft group-hover:shadow-lift group-hover:scale-110 transition-all duration-200`}>
                  <f.icon size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="card p-10 shadow-lift bg-gradient-to-br from-sea-50 to-sage-50 border-sea-100 text-center">
            <p className="text-sea-600 font-semibold text-sm mb-3 flex items-center justify-center gap-1.5">
              <Sparkles size={13} /> How it works
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-8">Trip planned in 3 steps</h2>
            <div className="grid grid-cols-3 gap-4 text-left">
              {[
                { n: '1', title: 'Tell us where', desc: 'Destination, dates, budget, who\'s coming.' },
                { n: '2', title: 'We build it',   desc: 'Real places from OpenStreetMap + AI craft your day-by-day plan.' },
                { n: '3', title: 'Tweak & share', desc: 'Drag stops, delete, add — then share with your group.' },
              ].map(step => (
                <div key={step.n} className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-sea-500 text-white font-extrabold flex items-center justify-center text-lg shadow-soft">
                    {step.n}
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{step.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-sea-100 py-8 px-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} RoamRiot · Built for travelers, by travelers
      </footer>
    </div>
  )
}
