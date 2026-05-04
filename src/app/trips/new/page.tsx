'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin, Calendar, Users, Utensils, Wallet, Plane,
  Hotel, ArrowRight, ArrowLeft, Loader2, Youtube, Sparkles, Check, Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DietaryPreference, TravelStyle, BudgetRange, FlightDetails, HotelDetails } from '@/lib/types'

const STEPS = [
  { label: 'Where',  icon: MapPin   },
  { label: 'Budget', icon: Wallet   },
  { label: 'When',   icon: Calendar },
  { label: 'Travel', icon: Plane    },
  { label: 'You',    icon: Sparkles },
]

// Budget tier definitions with what it gets you per day
const BUDGET_TIERS: {
  v: BudgetRange; emoji: string; label: string; subLabel: string
  daily: string; gets: string[]; color: string; accent: string
}[] = [
  {
    v: 'budget', emoji: '🎒', label: 'Backpacker', subLabel: 'Under ₹3,000/day',
    daily: '~₹1,500–3,000',
    gets: ['Street food & local dhabas', 'Hostels / budget guesthouses', 'Public transport (metro/bus)', 'Free parks & temples'],
    color: 'border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50',
    accent: 'bg-amber-100 text-amber-700',
  },
  {
    v: 'mid', emoji: '🌿', label: 'Explorer', subLabel: '₹3,000–7,000/day',
    daily: '~₹4,000–7,000',
    gets: ['Café dining + one nice dinner', '3-star hotel or good Airbnb', 'Mix of rideshare + auto', 'Paid entry attractions'],
    color: 'border-sea-400 bg-gradient-to-br from-sea-50 to-cyan-50',
    accent: 'bg-sea-100 text-sea-700',
  },
  {
    v: 'comfort', emoji: '✨', label: 'Comfort', subLabel: '₹7,000–14,000/day',
    daily: '~₹8,000–14,000',
    gets: ['Restaurant dining every meal', '4-star hotel with breakfast', 'Private cab / taxi', 'Guided tours & experiences'],
    color: 'border-sage-400 bg-gradient-to-br from-sage-50 to-green-50',
    accent: 'bg-sage-100 text-sage-700',
  },
  {
    v: 'splurge', emoji: '🏨', label: 'Luxury', subLabel: '₹14,000+/day',
    daily: '₹15,000+',
    gets: ['Fine dining & rooftop bars', '5-star hotel or resort', 'Private car & chauffeur', 'Premium curated experiences'],
    color: 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50',
    accent: 'bg-purple-100 text-purple-700',
  },
]

function OptionCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cn(
        'relative w-full text-left p-4 rounded-2xl border-2 transition-all duration-200',
        selected
          ? 'border-sea-400 bg-gradient-to-br from-sea-50 to-sea-100 shadow-soft scale-[1.02]'
          : 'border-slate-200 bg-white hover:border-sea-200 hover:shadow-soft hover:scale-[1.01]'
      )}>
      {selected && (
        <span className="absolute top-3 right-3 w-5 h-5 bg-sea-500 rounded-full flex items-center justify-center">
          <Check size={11} className="text-white" strokeWidth={3} />
        </span>
      )}
      {children}
    </button>
  )
}

function WizardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)

  // Step 0 — destination
  const [destination, setDestination] = useState(searchParams.get('destination') ?? '')
  // Step 1 — budget (now first after destination)
  const [budget, setBudget]     = useState<BudgetRange>('mid')
  // Step 2 — dates & travelers
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate]     = useState('')
  const [travelers, setTravelers] = useState(1)
  // Step 3 — logistics
  const [hasFlight, setHasFlight]         = useState(false)
  const [airline, setAirline]             = useState('')
  const [flightNum, setFlightNum]         = useState('')
  const [departureCity, setDepartureCity] = useState('')
  const [arrivalTime, setArrivalTime]     = useState('14:00')
  const [hasHotel, setHasHotel]           = useState(false)
  const [hotelName, setHotelName]         = useState('')
  const [hotelAddress, setHotelAddress]   = useState('')
  const [checkIn, setCheckIn]             = useState('15:00')
  const [checkOut, setCheckOut]           = useState('11:00')
  // Step 4 — personal prefs
  const [dietary, setDietary]         = useState<DietaryPreference>('none')
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('couple')

  const [generating, setGenerating] = useState(false)
  const [error, setError]           = useState('')

  const today   = new Date().toISOString().split('T')[0]
  const numDays = startDate && endDate
    ? Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1)
    : 0

  const canNext = [
    destination.trim().length > 1,   // step 0
    true,                             // step 1 — budget always valid
    !!(startDate && endDate && endDate >= startDate), // step 2
    true,                             // step 3
    true,                             // step 4
  ][step] ?? true

  const activeTier = BUDGET_TIERS.find(t => t.v === budget) ?? BUDGET_TIERS[1]

  async function generate() {
    setGenerating(true); setError('')
    const flight: FlightDetails | undefined = hasFlight ? { airline, flightNumber: flightNum, departureCity, arrivalTime } : undefined
    const hotel: HotelDetails | undefined   = hasHotel  ? { name: hotelName, address: hotelAddress, checkInTime: checkIn, checkOutTime: checkOut } : undefined
    try {
      const res = await fetch('/api/trips/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, startDate, endDate, preferences: { dietary, budget, travelStyle, travelers, flight, hotel } }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      sessionStorage.setItem('roamriot_itinerary', JSON.stringify({ ...data, destination, startDate, endDate }))
      if (data.tripId) {
        router.push(`/trips/${data.tripId}`)
      } else {
        router.push('/trips/preview')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setGenerating(false)
    }
  }

  function handleNext() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else generate()
  }

  const budgetLoadingLabel: Record<BudgetRange, string> = {
    budget: 'Finding free entry spots & street food gems',
    mid: 'Curating cafés, attractions & local restaurants',
    comfort: 'Selecting top-rated experiences & dining',
    splurge: 'Handpicking premium & luxury experiences',
  }

  if (generating) return (
    <div className="min-h-screen bg-gradient-to-br from-sea-50 via-white to-sage-50 flex items-center justify-center px-6">
      <div className="text-center space-y-8 max-w-sm">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-sea-100 border-t-sea-500 animate-spin" />
          <div className="absolute inset-3 rounded-full border-4 border-sage-100 border-b-sage-400 animate-spin" style={{animationDirection:'reverse',animationDuration:'0.8s'}} />
          <Youtube size={28} className="absolute inset-0 m-auto text-sea-500" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Building your itinerary…</h2>
          <p className="text-slate-500 text-sm">
            Scanning vlogs for <strong className="text-sea-600">{destination}</strong> and building a{' '}
            <strong className="text-sea-600">{activeTier.label.toLowerCase()}</strong> {numDays > 0 ? `${numDays}-day` : ''} trip.
          </p>
        </div>
        <div className="space-y-3">
          {['Scanning YouTube travel vlogs', budgetLoadingLabel[budget], 'Scheduling 8 AM – 11 PM each day', 'Adding airport & hotel logistics'].map((t, i) => (
            <div key={t} className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-sea-100 shadow-soft animate-fade-up" style={{animationDelay:`${i*0.15}s`}}>
              <div className="w-2 h-2 rounded-full bg-sea-400 animate-pulse-soft" style={{animationDelay:`${i*0.3}s`}} />
              <span className="text-sm text-slate-600">{t}</span>
            </div>
          ))}
        </div>
        <div className={cn('p-3 rounded-2xl text-sm font-semibold text-center', activeTier.accent)}>
          {activeTier.emoji} {activeTier.label} budget · {activeTier.daily}/day
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-sea-50 via-white to-sage-50">
      {/* Nav + step progress */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-sea-100 px-6 h-16 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="text-xl font-extrabold text-gradient">RoamRiot</Link>
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-1">
              <button onClick={() => i < step && setStep(i)}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                  i === step ? 'bg-sea-500 text-white shadow-soft' :
                  i < step   ? 'bg-sea-100 text-sea-700 cursor-pointer' :
                               'bg-slate-100 text-slate-400 cursor-default')}>
                {i < step ? <Check size={11} strokeWidth={3} /> : <s.icon size={11} />}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <div className={cn('w-3 h-0.5 rounded-full', i < step ? 'bg-sea-300' : 'bg-slate-200')} />}
            </div>
          ))}
        </div>
      </nav>

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-6 py-12">
        <div className="w-full max-w-lg animate-pop">

          {/* ── Step 0: Destination ── */}
          {step === 0 && (
            <div className="space-y-7">
              <div>
                <p className="text-sea-500 font-semibold text-sm mb-2 flex items-center gap-1.5"><MapPin size={14}/> Where to?</p>
                <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">Where's your next adventure?</h1>
                <p className="text-slate-400 mt-2">We'll pull real travel vlogs to build your itinerary.</p>
              </div>
              <div className="relative">
                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sea-400 pointer-events-none" />
                <input autoFocus className="input pl-11 h-14 text-lg rounded-3xl" placeholder="City, region, country…"
                  value={destination} onChange={e => setDestination(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canNext && handleNext()} />
              </div>
              <div className="flex flex-wrap gap-2">
                {['🏯 Jaipur', '🌴 Bali', '⛩️ Kyoto', '🏖️ Goa', '🇰🇷 Seoul', '🌊 Udaipur'].map(d => {
                  const name = d.split(' ').slice(1).join(' ')
                  return (
                    <button key={d} onClick={() => setDestination(name)}
                      className={cn('px-4 py-2 rounded-full text-sm font-medium border-2 transition-all',
                        destination === name ? 'border-sea-400 bg-sea-50 text-sea-700 shadow-soft' : 'border-slate-200 text-slate-600 hover:border-sea-200 hover:bg-sea-50')}>
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Step 1: Budget ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="text-sea-500 font-semibold text-sm mb-2 flex items-center gap-1.5"><Wallet size={14}/> Set your budget</p>
                <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">
                  What's your daily spend for <span className="text-gradient">{destination}</span>?
                </h1>
                <p className="text-slate-400 mt-2">This shapes every recommendation — stays, food, activities and more.</p>
              </div>

              <div className="space-y-3">
                {BUDGET_TIERS.map(tier => (
                  <button key={tier.v} type="button" onClick={() => setBudget(tier.v)}
                    className={cn(
                      'relative w-full text-left p-4 rounded-2xl border-2 transition-all duration-200',
                      budget === tier.v ? tier.color + ' shadow-soft scale-[1.01]' : 'border-slate-200 bg-white hover:border-sea-200 hover:shadow-soft'
                    )}>
                    {budget === tier.v && (
                      <span className="absolute top-4 right-4 w-5 h-5 bg-sea-500 rounded-full flex items-center justify-center">
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </span>
                    )}
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{tier.emoji}</span>
                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900">{tier.label}</span>
                          <span className="text-sm text-slate-500">{tier.subLabel}</span>
                        </div>
                        <p className="text-xs font-bold text-sea-600 mt-0.5">{tier.daily} total daily spend</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {tier.gets.map((g, i) => (
                            <span key={i} className={cn('text-xs px-2 py-0.5 rounded-full font-medium', budget === tier.v ? tier.accent : 'bg-slate-100 text-slate-500')}>
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Dates & Travelers ── */}
          {step === 2 && (
            <div className="space-y-7">
              <div>
                <p className="text-sea-500 font-semibold text-sm mb-2 flex items-center gap-1.5"><Calendar size={14}/> When?</p>
                <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">
                  When are you heading to <span className="text-gradient">{destination}</span>?
                </h1>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Departure</label>
                  <input type="date" className="input h-12" min={today} value={startDate}
                    onChange={e => { setStartDate(e.target.value); if (endDate && e.target.value > endDate) setEndDate(e.target.value) }} />
                </div>
                <div>
                  <label className="label">Return</label>
                  <input type="date" className="input h-12" min={startDate || today} value={endDate}
                    onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
              {numDays > 0 && (
                <div className="flex items-center gap-3 p-4 bg-sea-50 rounded-2xl border border-sea-100 animate-pop">
                  <div className="w-10 h-10 bg-sea-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-extrabold">{numDays}</span>
                  </div>
                  <div>
                    <p className="font-bold text-sea-800">{numDays} day{numDays > 1 ? 's' : ''} in {destination}</p>
                    <p className="text-xs text-sea-600">
                      {activeTier.emoji} {activeTier.label} budget · est. {activeTier.daily}/day
                    </p>
                  </div>
                </div>
              )}
              <div>
                <label className="label flex items-center gap-1.5"><Users size={13}/> How many people?</label>
                <div className="flex items-center gap-4 mt-1">
                  <button onClick={() => setTravelers(t => Math.max(1, t-1))} className="w-11 h-11 rounded-full border-2 border-slate-200 text-xl font-bold hover:border-sea-300 hover:bg-sea-50 transition-all flex items-center justify-center">−</button>
                  <span className="text-3xl font-extrabold text-slate-900 w-8 text-center">{travelers}</span>
                  <button onClick={() => setTravelers(t => Math.min(20, t+1))} className="w-11 h-11 rounded-full border-2 border-slate-200 text-xl font-bold hover:border-sea-300 hover:bg-sea-50 transition-all flex items-center justify-center">+</button>
                  <span className="text-sm text-slate-500 font-medium">{travelers === 1 ? '🎒 Solo adventure' : `👥 ${travelers} people`}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Logistics ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="text-sea-500 font-semibold text-sm mb-2 flex items-center gap-1.5"><Plane size={14}/> Travel logistics</p>
                <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">Add your bookings</h1>
                <p className="text-slate-400 mt-2">We'll build Day 1 around your arrival and plan airport → hotel transport for you.</p>
              </div>

              {/* Flight toggle */}
              <div className="card p-5">
                <button onClick={() => setHasFlight(v => !v)}
                  className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center transition-all', hasFlight ? 'bg-sea-500' : 'bg-slate-100')}>
                      <Plane size={18} className={hasFlight ? 'text-white' : 'text-slate-400'} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900 text-sm">Flight details</p>
                      <p className="text-xs text-slate-400">Schedule Day 1 around your arrival time</p>
                    </div>
                  </div>
                  <div className={cn('w-12 h-6 rounded-full transition-all relative', hasFlight ? 'bg-sea-500' : 'bg-slate-200')}>
                    <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all', hasFlight ? 'left-7' : 'left-1')} />
                  </div>
                </button>
                {hasFlight && (
                  <div className="mt-4 grid grid-cols-2 gap-3 animate-fade-up">
                    <div>
                      <label className="label">Airline</label>
                      <input className="input" placeholder="IndiGo, Air India…" value={airline} onChange={e => setAirline(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Flight no.</label>
                      <input className="input" placeholder="6E 204" value={flightNum} onChange={e => setFlightNum(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Departing from</label>
                      <input className="input" placeholder="Mumbai" value={departureCity} onChange={e => setDepartureCity(e.target.value)} />
                    </div>
                    <div>
                      <label className="label flex items-center gap-1"><Clock size={11}/> Arrival time</label>
                      <input type="time" className="input" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              {/* Hotel toggle */}
              <div className="card p-5">
                <button onClick={() => setHasHotel(v => !v)}
                  className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center transition-all', hasHotel ? 'bg-sage-500' : 'bg-slate-100')}>
                      <Hotel size={18} className={hasHotel ? 'text-white' : 'text-slate-400'} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900 text-sm">Hotel / accommodation</p>
                      <p className="text-xs text-slate-400">Pin your base on the map and plan around it</p>
                    </div>
                  </div>
                  <div className={cn('w-12 h-6 rounded-full transition-all relative', hasHotel ? 'bg-sage-500' : 'bg-slate-200')}>
                    <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all', hasHotel ? 'left-7' : 'left-1')} />
                  </div>
                </button>
                {hasHotel && (
                  <div className="mt-4 grid grid-cols-2 gap-3 animate-fade-up">
                    <div className="col-span-2">
                      <label className="label">Hotel name</label>
                      <input className="input" placeholder="Taj Hotel, Airbnb on MG Road…" value={hotelName} onChange={e => setHotelName(e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="label">Address (optional)</label>
                      <input className="input" placeholder="Street, area, city" value={hotelAddress} onChange={e => setHotelAddress(e.target.value)} />
                    </div>
                    <div>
                      <label className="label flex items-center gap-1"><Clock size={11}/> Check-in</label>
                      <input type="time" className="input" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
                    </div>
                    <div>
                      <label className="label flex items-center gap-1"><Clock size={11}/> Check-out</label>
                      <input type="time" className="input" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              {!hasFlight && !hasHotel && (
                <p className="text-center text-sm text-slate-400">No bookings yet? No problem — we'll build smart transport suggestions anyway.</p>
              )}
            </div>
          )}

          {/* ── Step 4: Personal prefs ── */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <p className="text-sea-500 font-semibold text-sm mb-2 flex items-center gap-1.5"><Sparkles size={14}/> Almost there!</p>
                <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">Who's travelling?</h1>
                <p className="text-slate-400 mt-2">We'll adjust the tone, stops, and pace to match your group.</p>
              </div>

              {/* Travel variant */}
              <div>
                <label className="label flex items-center gap-1.5"><Users size={13}/> Travel variant</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {([
                    { v:'couple',       l:'Couple',         e:'💑', d:'Romantic & intimate'     },
                    { v:'three_friends',l:'Three friends',  e:'👯', d:'Fun trio energy'          },
                    { v:'girls_gang',   l:'Girls gang',     e:'👩‍👩‍👧', d:'Gals-only adventure'      },
                    { v:'boys_gang',    l:'Boys gang',      e:'👨‍👨‍👦', d:'Lads trip vibes'           },
                    { v:'solo_female',  l:'Solo female',    e:'🦋', d:'Safe & curated for her'   },
                    { v:'solo_male',    l:'Solo male',      e:'🎒', d:'Off the beaten path'      },
                    { v:'family',       l:'Family friendly',e:'👨‍👩‍👧‍👦', d:'Kid-safe, all ages'        },
                    { v:'senior',       l:'Senior friendly',e:'🌿', d:'Relaxed pace & comfort'  },
                  ] as { v: TravelStyle; l: string; e: string; d: string }[]).map(o => (
                    <OptionCard key={o.v} selected={travelStyle === o.v} onClick={() => setTravelStyle(o.v)}>
                      <div className="text-2xl mb-1">{o.e}</div>
                      <div className="font-bold text-slate-800 text-sm">{o.l}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{o.d}</div>
                    </OptionCard>
                  ))}
                </div>
              </div>

              {/* Dietary */}
              <div>
                <label className="label flex items-center gap-1.5"><Utensils size={13}/> Food preference</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {([
                    { v:'none',       l:'No restriction', e:'🍽️', d:'Everything goes'     },
                    { v:'vegetarian', l:'Vegetarian',     e:'🥗', d:'No meat or fish'      },
                    { v:'vegan',      l:'Vegan',          e:'🌱', d:'Plant-based only'     },
                    { v:'jain',       l:'Jain',           e:'☯️', d:'No roots / no meat'   },
                  ] as { v: DietaryPreference; l: string; e: string; d: string }[]).map(o => (
                    <OptionCard key={o.v} selected={dietary === o.v} onClick={() => setDietary(o.v)}>
                      <div className="text-2xl mb-1">{o.e}</div>
                      <div className="font-bold text-slate-800 text-sm">{o.l}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{o.d}</div>
                    </OptionCard>
                  ))}
                </div>
              </div>

              {/* Budget reminder chip */}
              <div className={cn('flex items-center gap-3 p-3 rounded-2xl border-2', activeTier.color)}>
                <span className="text-xl">{activeTier.emoji}</span>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{activeTier.label} budget locked in</p>
                  <p className="text-xs text-slate-500">{activeTier.daily}/day · {activeTier.gets[0]}</p>
                </div>
                <button onClick={() => setStep(1)} className="ml-auto text-xs font-semibold text-sea-600 hover:underline">Change</button>
              </div>

              {error && <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 0
              ? <button onClick={() => setStep(s => s - 1)} className="btn-outline gap-2"><ArrowLeft size={15}/> Back</button>
              : <div />
            }
            <button onClick={handleNext} disabled={!canNext}
              className={cn('btn-primary px-7 py-3 text-base rounded-3xl gap-2', step === STEPS.length - 1 && 'btn-sage')}>
              {step === STEPS.length - 1
                ? <><Youtube size={16}/> Build my itinerary</>
                : <>Next <ArrowRight size={16}/></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NewTripPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sea-50 flex items-center justify-center"><Loader2 className="animate-spin text-sea-500" size={32}/></div>}>
      <WizardInner />
    </Suspense>
  )
}
