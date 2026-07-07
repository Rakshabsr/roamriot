'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { MapPin, Sparkles, ArrowRight, ChevronRight, GripVertical, Heart, BookOpen, Map, Utensils, Star, Compass } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TravelBackground } from '@/components/ui/TravelBackground'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const features = [
  {
    icon: Map,
    title: 'Live map view',
    description: 'Every stop plotted on an interactive map. Spot clusters, plan smart routes, never backtrack.',
    color: 'from-sea-500 to-sea-600',
  },
  {
    icon: Utensils,
    title: 'Diet-aware planning',
    description: 'Veg, Jain, or vegan? Every food stop filtered to match your preference — zero awkward moments.',
    color: 'from-sage-400 to-sage-600',
  },
  {
    icon: Heart,
    title: 'Trip variants',
    description: 'Couple getaway, girls gang, family, solo female — itinerary tone adapts to who\'s travelling.',
    color: 'from-rose-400 to-pink-500',
  },
  {
    icon: GripVertical,
    title: 'Drag & reorder',
    description: 'Plans change. Drag any stop to a new time slot — your itinerary updates instantly.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: BookOpen,
    title: 'Saved trips',
    description: 'Your itineraries live in your account. Come back, tweak, reshare — never lost.',
    color: 'from-amber-400 to-orange-500',
  },
  {
    icon: MapPin,
    title: 'Real places',
    description: 'Stops from OpenStreetMap + Wikipedia context — actual places, not AI hallucinations.',
    color: 'from-sea-400 to-sea-600',
  },
]

const destinations = [
  { name: 'Jaipur',  flag: '🏯', tag: 'Pink City magic'  },
  { name: 'Bali',    flag: '🌴', tag: 'Tropical paradise' },
  { name: 'Kyoto',   flag: '⛩️', tag: 'Zen & temples'    },
  { name: 'Lisbon',  flag: '🏙️', tag: 'Pastel streets'   },
  { name: 'Udaipur', flag: '🏰', tag: 'City of lakes'    },
  { name: 'Oaxaca',  flag: '🌮', tag: 'Culture & food'   },
]

const ROTATING_WORDS = ['Unforgettable', 'Legendary', 'Personal', 'Spontaneous', 'Perfect']

export default function LandingPage() {
  const [destination, setDestination] = useState('')
  const [wordIdx, setWordIdx]         = useState(0)
  const [wordVisible, setWordVisible] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Rotate headline word
  useEffect(() => {
    const interval = setInterval(() => {
      setWordVisible(false)
      setTimeout(() => {
        setWordIdx(i => (i + 1) % ROTATING_WORDS.length)
        setWordVisible(true)
      }, 400)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#FDFAF6] dark:bg-[#0f0a07] overflow-x-hidden">

      {/* ─── Nav ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-white drop-shadow-lg [text-shadow:0_2px_8px_rgba(0,0,0,0.5)]">Roam</span>
            <span className="text-sea-300 drop-shadow-lg [text-shadow:0_2px_8px_rgba(0,0,0,0.5)]">Riot</span>
          </span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-semibold text-white/80 hover:text-white transition-colors drop-shadow">
              Sign in
            </Link>
            <Link href="/signup" className="flex items-center gap-1.5 bg-sea-500 hover:bg-sea-400 text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors shadow-lg">
              Get started <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Travel photo background */}
        <TravelBackground fixed />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center gap-7 pt-16">

          {/* Badge */}
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white/90 text-xs font-bold tracking-widest uppercase">
              <Sparkles size={11} className="text-sea-300" />
              AI-Powered Travel Planner
            </span>
          </div>

          {/* Headline */}
          <div className="animate-fade-up space-y-2" style={{ animationDelay: '0.06s' }}>
            <h1 className="text-5xl sm:text-7xl font-extrabold text-white leading-[1.05] tracking-tight [text-shadow:0_4px_24px_rgba(0,0,0,0.5)]">
              Make Every Trip
            </h1>
            <h1 className="text-5xl sm:text-7xl font-extrabold leading-[1.05] tracking-tight [text-shadow:0_4px_24px_rgba(0,0,0,0.5)]">
              <span
                className="text-sea-300"
                style={{
                  opacity: wordVisible ? 1 : 0,
                  transform: wordVisible ? 'translateY(0)' : 'translateY(8px)',
                  display: 'inline-block',
                  transition: 'opacity 0.4s ease, transform 0.4s ease',
                }}
              >
                {ROTATING_WORDS[wordIdx]}.
              </span>
            </h1>
          </div>

          <p className="text-white/75 text-base sm:text-lg max-w-lg leading-relaxed animate-fade-up [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]" style={{ animationDelay: '0.12s' }}>
            Tell RoamRiot where you&apos;re headed — get a day-by-day itinerary, live map, weather, budget tracker and more. All in one place.
          </p>

          {/* Search */}
          <div className="w-full max-w-xl animate-fade-up" style={{ animationDelay: '0.18s' }}>
            <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <div className="relative flex-1">
                <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-sea-300" />
                <input
                  className="w-full pl-10 pr-4 py-3 bg-transparent text-white placeholder:text-white/50 text-base focus:outline-none"
                  placeholder="Where to? Jaipur, Bali, Tokyo…"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && destination && (window.location.href = `/trips/new?destination=${encodeURIComponent(destination)}`)}
                />
              </div>
              <Link
                href={destination ? `/trips/new?destination=${encodeURIComponent(destination)}` : '/trips/new'}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sea-500 hover:bg-sea-400 text-white font-bold text-sm whitespace-nowrap transition-colors shadow-lg"
              >
                Plan my trip <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Destination chips */}
          <div className="flex flex-wrap gap-2 justify-center animate-fade-up" style={{ animationDelay: '0.24s' }}>
            {destinations.map(d => (
              <button
                key={d.name}
                onClick={() => setDestination(d.name)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-150',
                  destination === d.name
                    ? 'bg-white text-slate-900 border-white shadow-lg'
                    : 'bg-white/10 backdrop-blur-sm text-white/80 border-white/20 hover:bg-white/20 hover:text-white'
                )}
              >
                <span>{d.flag}</span> {d.name}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-50">
          <span className="text-white text-[10px] font-bold uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white to-transparent" />
        </div>
      </section>

      {/* ─── Destinations strip ─── */}
      <section className="py-16 px-6 bg-[#FDFAF6] dark:bg-[#0f0a07]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sea-500 font-bold text-sm uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Compass size={13} /> Popular destinations
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                Where will you go next?
              </h2>
            </div>
            <Link href="/trips/new" className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-sea-600 hover:text-sea-500 transition-colors">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {destinations.map((d, i) => (
              <Link
                key={d.name}
                href={`/trips/new?destination=${encodeURIComponent(d.name)}`}
                className="group relative overflow-hidden rounded-2xl aspect-[3/4] flex flex-col justify-end p-3 animate-fade-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {/* Photo */}
                <img
                  src={`https://picsum.photos/seed/${d.name.toLowerCase()}-travel/400/533`}
                  alt={d.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {/* Text */}
                <div className="relative z-10">
                  <p className="font-extrabold text-white text-sm leading-tight">{d.name}</p>
                  <p className="text-white/60 text-xs mt-0.5">{d.tag}</p>
                </div>
                {/* Hover arrow */}
                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/0 group-hover:bg-white/20 flex items-center justify-center transition-all duration-200">
                  <ArrowRight size={12} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features — dark editorial section ─── */}
      <section className="py-20 px-6 bg-[#0D0D0D] dark:bg-[#080808]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sea-400 font-bold text-sm uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
              <Sparkles size={13} /> What RoamRiot does
            </p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
              Everything your trip needs,<br />
              <span className="text-sea-400">nothing it doesn&apos;t.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group p-6 rounded-3xl border border-white/8 bg-white/4 hover:bg-white/8 hover:border-white/15 transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-20 px-6 bg-[#FDFAF6] dark:bg-[#0f0a07]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sea-500 font-bold text-sm uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-12">
            Your trip in 3 steps.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { n: '01', title: 'Tell us where',  desc: 'Destination, dates, budget, who\'s coming.',  icon: MapPin    },
              { n: '02', title: 'We build it',     desc: 'Real places from OpenStreetMap + AI craft your day-by-day plan.', icon: Sparkles  },
              { n: '03', title: 'Tweak & share',   desc: 'Drag stops, delete, add — then share with your group.', icon: Star },
            ].map((step, i) => (
              <div key={step.n} className="flex flex-col items-center gap-4 animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sea-500 to-sea-600 flex items-center justify-center shadow-lg">
                    <step.icon size={26} className="text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-extrabold flex items-center justify-center">
                    {step.n.replace('0', '')}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{step.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="py-0">
        <div className="relative overflow-hidden min-h-[380px] flex items-center justify-center">
          {/* Background image */}
          <img
            src="https://picsum.photos/seed/travel-cta/1920/600"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D]/90 via-[#0D0D0D]/60 to-transparent" />
          <div className="relative z-10 max-w-2xl mx-auto px-6 text-left py-20">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
              Ready to plan your next adventure?
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-md">
              Join thousands of travellers who plan smarter with RoamRiot.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-sea-500 hover:bg-sea-400 text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors shadow-xl">
                Start planning free <ArrowRight size={18} />
              </Link>
              <Link href="/trips/new" className="inline-flex items-center justify-center gap-2 bg-white/15 backdrop-blur border border-white/25 hover:bg-white/25 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-colors">
                Try without signing up
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-[#0D0D0D] py-8 px-6 text-center text-xs text-white/30">
        © {new Date().getFullYear()} RoamRiot · Built for travellers, by travellers
      </footer>
    </div>
  )
}
