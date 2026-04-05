'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Youtube, Utensils, Users, ArrowRight, Map, Sparkles, ChevronRight, GripVertical, Heart, BookOpen } from 'lucide-react'

const features = [
  {
    icon: Youtube,
    title: 'Built from real vlogs',
    description: 'Every recommendation sourced from real YouTube travel content — with the video right beside each stop.',
    color: 'from-red-400 to-rose-500',
    bg: 'bg-red-50',
  },
  {
    icon: Map,
    title: 'Live map view',
    description: 'Every stop plotted on an interactive map. Spot clusters, plan smart routes, never backtrack.',
    color: 'from-sea-400 to-sea-600',
    bg: 'bg-sea-50',
  },
  {
    icon: Utensils,
    title: 'Diet-aware planning',
    description: 'Veg, Jain, or vegan? Every food stop is filtered to match your preference — zero awkward moments.',
    color: 'from-sage-400 to-sage-600',
    bg: 'bg-sage-50',
  },
  {
    icon: Heart,
    title: 'Trip variants for every group',
    description: 'Couple getaway, girls gang, family trip, solo female, senior friendly — itinerary tone and picks adapt to who\'s travelling.',
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
]

const destinations = ['Jaipur', 'Bali', 'Kyoto', 'Lisbon', 'Udaipur', 'Oaxaca']

export default function LandingPage() {
  const [destination, setDestination] = useState('')

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ─── Nav ─── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-sea-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-gradient">RoamRiot</span>
          </span>
          <div className="flex items-center gap-3">
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
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sea-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-72 h-72 bg-sage-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sea-50 border border-sea-200 text-sea-700 text-xs font-semibold mb-8 animate-fade-up">
            <Sparkles size={13} className="text-sand-400" />
            AI-powered · built for every kind of traveller
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.08] mb-6 animate-fade-up" style={{animationDelay:'0.05s'}}>
            Your trip, planned<br />
            <span className="text-gradient">the smart way</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 mb-10 max-w-xl mx-auto leading-relaxed animate-fade-up" style={{animationDelay:'0.1s'}}>
            Tell RoamRiot where you're going, who's coming, and how you travel —
            get a day-by-day itinerary with a live map, real transport options, and stops you'll actually want.
          </p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto animate-fade-up" style={{animationDelay:'0.15s'}}>
            <div className="relative flex-1">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sea-400" />
              <input
                className="input pl-10 h-13 text-base rounded-3xl shadow-soft"
                placeholder="Where to?"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (window.location.href = `/trips/new?destination=${encodeURIComponent(destination)}`)}
              />
            </div>
            <Link
              href={destination ? `/trips/new?destination=${encodeURIComponent(destination)}` : '/trips/new'}
              className="btn-primary h-13 px-6 text-base rounded-3xl whitespace-nowrap justify-center"
            >
              Plan my trip <ArrowRight size={16} />
            </Link>
          </div>

          {/* Destination chips */}
          <div className="flex flex-wrap gap-2 justify-center mt-5 animate-fade-up" style={{animationDelay:'0.2s'}}>
            {destinations.map(d => (
              <button
                key={d}
                onClick={() => setDestination(d)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border-2 transition-all duration-150 ${
                  destination === d
                    ? 'border-sea-400 bg-sea-50 text-sea-700 shadow-soft'
                    : 'border-slate-200 text-slate-500 hover:border-sea-300 hover:text-sea-600'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Map preview banner ─── */}
      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="card p-1 shadow-lift overflow-hidden">
            <div className="bg-gradient-to-br from-sea-500 to-sage-500 rounded-2xl aspect-[16/7] flex items-center justify-center relative overflow-hidden">
              {/* Fake map grid */}
              <div className="absolute inset-0 opacity-20"
                style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize:'40px 40px'}} />
              {/* Pins */}
              {[
                {x:'30%',y:'45%',label:'🏨 Hotel'},
                {x:'45%',y:'30%',label:'🍽️ Lunch spot'},
                {x:'60%',y:'55%',label:'📍 City Palace'},
                {x:'72%',y:'38%',label:'✨ Sunset point'},
              ].map((pin,i) => (
                <div key={i} className="absolute" style={{left:pin.x, top:pin.y}}>
                  <div className="bg-white rounded-2xl px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-lift whitespace-nowrap animate-fade-up" style={{animationDelay:`${0.1*i}s`}}>
                    {pin.label}
                  </div>
                  <div className="w-3 h-3 bg-white rounded-full mx-auto mt-1 shadow-md" />
                </div>
              ))}
              {/* Route line placeholder */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{opacity:0.4}}>
                <polyline points="30%,50% 45%,35% 60%,60% 72%,43%" stroke="white" strokeWidth="2" strokeDasharray="6,4" fill="none" />
              </svg>
              <div className="text-white/60 text-sm font-medium z-10">Live interactive map — inside the app</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-16 px-6 bg-gradient-to-b from-sea-50/60 to-white">
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

      {/* ─── Social proof / how it works ─── */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="card p-10 shadow-lift bg-gradient-to-br from-sea-50 to-sage-50 border-sea-100 text-center">
            <p className="text-sea-500 font-semibold text-sm mb-3 flex items-center justify-center gap-1.5">
              <Sparkles size={13} /> How it works
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-8">Trip planned in 3 steps</h2>
            <div className="grid grid-cols-3 gap-4 text-left">
              {[
                { n: '1', title: 'Tell us where', desc: 'Destination, dates, budget, who\'s coming.' },
                { n: '2', title: 'We build it', desc: 'AI + real travel vlogs craft your day-by-day plan.' },
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
