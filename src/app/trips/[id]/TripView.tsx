'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  MapPin, Clock, Youtube, Wallet, Share2, Plus,
  Ticket, Train, Bus, Car, ChevronDown, Sparkles,
  ArrowLeft, Check, Copy, Navigation, Plane, X,
} from 'lucide-react'
import { ItineraryDay, Activity } from '@/lib/types'
import { cn, formatDate, formatTime, categoryIcon } from '@/lib/utils'
import type { MapActivity } from '@/components/trip/MapView'
import { ActivityList } from '@/components/trip/ActivityList'
import { Toast, ToastData } from '@/components/ui/Toast'
import { TripWithDays } from '@/lib/supabase/queries'

const MapView = dynamic(() => import('@/components/trip/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-3xl bg-gradient-to-br from-sea-100 to-sage-100 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-sea-200 border-t-sea-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-sea-600 font-medium">Loading map…</p>
      </div>
    </div>
  ),
})

// ─── Airport Transfer Data ────────────────────────────────────────────────
const TRANSFER_DATA: Record<string, {
  airport: string
  options: { mode: string; icon: string; time: string; cost: string; costNote: string; where: string; tips: string; badge?: string }[]
}> = {
  korea: {
    airport: 'Incheon International (ICN)',
    options: [
      { mode: 'AREX Express Train', icon: 'train', time: '43 min', cost: '₩9,500', costNote: '~₹590', where: 'Buy at T1 or T2 station below arrivals', tips: 'Fastest option. Runs every 30 min. Goes direct to Seoul Station.', badge: 'Recommended' },
      { mode: 'Limousine Bus', icon: 'bus', time: '70–90 min', cost: '₩17,000', costNote: '~₹1,060', where: 'Bus counters at arrivals floor, B1 level', tips: 'Drops near major hotels. Luggage-friendly.' },
      { mode: 'KakaoTaxi', icon: 'car', time: '60–80 min', cost: '₩70,000–90,000', costNote: '~₹4,300–5,600', where: 'App: Download KakaoTaxi before landing.', tips: 'Most convenient door-to-door.' },
    ],
  },
  jaipur: {
    airport: 'Jaipur International (JAI)',
    options: [
      { mode: 'Prepaid Taxi', icon: 'car', time: '25–35 min', cost: '₹300–450', costNote: 'to city centre', where: 'Prepaid taxi counter inside arrivals', tips: 'Most reliable option.', badge: 'Recommended' },
      { mode: 'Ola / Uber', icon: 'car', time: '25–35 min', cost: '₹200–350', costNote: 'varies', where: 'App pickup zone outside terminal', tips: 'Book in the app before exiting.' },
    ],
  },
  bali: {
    airport: 'Ngurah Rai International (DPS)',
    options: [
      { mode: 'Grab / Gojek', icon: 'car', time: '30–60 min', cost: 'IDR 50,000–120,000', costNote: '~₹260–620', where: 'App pickup at international arrivals', tips: 'Cheapest. Download apps before landing.', badge: 'Recommended' },
      { mode: 'Bluebird Taxi', icon: 'car', time: '30–60 min', cost: 'IDR 100,000–200,000', costNote: '~₹520–1,040', where: 'Official taxi desk inside arrivals', tips: 'Metered & safe.' },
    ],
  },
  tokyo: {
    airport: 'Narita (NRT) or Haneda (HND)',
    options: [
      { mode: "Narita Express (N'EX)", icon: 'train', time: '60 min', cost: '¥3,070', costNote: '~₹1,700', where: 'B1 of Narita terminals', tips: 'Direct to Shinjuku / Shibuya.', badge: 'Recommended' },
      { mode: 'Limousine Bus', icon: 'bus', time: '75–90 min', cost: '¥3,200', costNote: '~₹1,780', where: 'Bus stop outside each terminal', tips: 'Drops at major hotels.' },
    ],
  },
  default: {
    airport: 'International Airport',
    options: [
      { mode: 'Official Prepaid Taxi', icon: 'car', time: 'Varies', cost: 'Fixed rate', costNote: 'ask at counter', where: 'Prepaid taxi counter inside arrivals hall', tips: 'Always use the official prepaid counter to avoid overcharging.', badge: 'Recommended' },
      { mode: 'Ride-hailing App', icon: 'car', time: 'Varies', cost: 'App estimate', costNote: '', where: 'App pickup zone — check signage at exit', tips: 'Uber, Grab, or local app. Download before landing.' },
    ],
  },
}

function getTransferData(destination: string) {
  const key = destination.toLowerCase()
  if (key.includes('korea') || key.includes('incheon')) return TRANSFER_DATA.korea
  if (key.includes('seoul')) return TRANSFER_DATA.korea
  if (key.includes('jaipur')) return TRANSFER_DATA.jaipur
  if (key.includes('bali')) return TRANSFER_DATA.bali
  if (key.includes('tokyo') || key.includes('japan')) return TRANSFER_DATA.tokyo
  return TRANSFER_DATA.default
}

const MODE_ICON: Record<string, React.ElementType> = { train: Train, bus: Bus, car: Car }

function mapsLink(icon: string, airport: string, city: string) {
  const o = encodeURIComponent(airport)
  const d = encodeURIComponent(city)
  const mode = icon === 'car' ? 'driving' : 'transit'
  return `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=${mode}`
}

function TransportOptionCard({ opt, airport, city, reverse = false }: {
  opt: { mode: string; icon: string; time: string; cost: string; costNote: string; where: string; tips: string; badge?: string }
  airport: string; city: string; reverse?: boolean
}) {
  const Icon = MODE_ICON[opt.icon] ?? Car
  const origin = reverse ? city : airport
  const dest   = reverse ? airport : city
  return (
    <div className="relative bg-white rounded-2xl border border-slate-100 p-3.5 shadow-soft">
      {opt.badge && (
        <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sage-100 text-sage-700">
          {opt.badge}
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-sea-50 border border-sea-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon size={16} className="text-sea-600" />
        </div>
        <div className="flex-1 min-w-0 pr-14">
          <p className="font-bold text-slate-900 text-sm">{opt.mode}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-slate-500"><Clock size={10} /> {opt.time}</span>
            <span className="text-xs font-bold text-sea-700">{opt.cost}</span>
            {opt.costNote && <span className="text-xs text-slate-400">{opt.costNote}</span>}
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
        <MapPin size={11} className="text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-[11px] font-bold text-amber-800">Where to get it</p>
          <p className="text-[11px] text-amber-700 leading-relaxed">{opt.where}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500 leading-relaxed flex gap-1.5">
        <Sparkles size={10} className="text-sea-400 mt-0.5 flex-shrink-0" />{opt.tips}
      </p>
      <div className="mt-2.5 flex gap-2">
        <a href={mapsLink(opt.icon, origin, dest)} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-sea-50 hover:bg-sea-100 border border-sea-100 text-xs font-bold text-sea-700 transition-colors">
          <Navigation size={11} /> Open in Maps
        </a>
        {opt.icon === 'car' && (
          <a href="https://m.uber.com/ul/?action=setPickup" target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors">
            <Car size={11} /> Uber / Grab
          </a>
        )}
      </div>
    </div>
  )
}

function AirportTransferCard({ destination }: { destination: string }) {
  const [open, setOpen] = useState(false)
  const data = getTransferData(destination)
  return (
    <div className="mx-4 mb-3 rounded-3xl border-2 border-sea-200 bg-gradient-to-br from-white to-sea-50 overflow-hidden shadow-soft">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 p-4 text-left">
        <div className="w-10 h-10 rounded-2xl bg-sea-500 flex items-center justify-center flex-shrink-0">
          <Ticket size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-slate-900 text-sm">✈️ Airport → Hotel</p>
          <p className="text-xs text-slate-500 truncate">{data.airport} · tap for transport options</p>
        </div>
        <div className={cn('w-7 h-7 rounded-full bg-sea-100 flex items-center justify-center transition-transform flex-shrink-0', open && 'rotate-180')}>
          <ChevronDown size={14} className="text-sea-600" />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2.5 animate-fade-up">
          {data.options.map((opt, i) => (
            <TransportOptionCard key={i} opt={opt} airport={data.airport} city={destination} />
          ))}
        </div>
      )}
    </div>
  )
}

function ReturnToAirportCard({ destination }: { destination: string }) {
  const [open, setOpen] = useState(false)
  const data = getTransferData(destination)
  return (
    <div className="mx-4 mb-3 rounded-3xl border-2 border-sage-200 bg-gradient-to-br from-white to-sage-50 overflow-hidden shadow-soft">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 p-4 text-left">
        <div className="w-10 h-10 rounded-2xl bg-sage-500 flex items-center justify-center flex-shrink-0">
          <Plane size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-slate-900 text-sm">🏠 Hotel → Airport</p>
          <p className="text-xs text-slate-500 truncate">{data.airport} · allow 3h international, 2h domestic</p>
        </div>
        <div className={cn('w-7 h-7 rounded-full bg-sage-100 flex items-center justify-center transition-transform flex-shrink-0', open && 'rotate-180')}>
          <ChevronDown size={14} className="text-sage-600" />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2.5 animate-fade-up">
          {data.options.map((opt, i) => (
            <TransportOptionCard key={i} opt={opt} airport={data.airport} city={destination} reverse />
          ))}
        </div>
      )}
    </div>
  )
}

function ShareModal({ destination, startDate, endDate, days, onClose }: {
  destination: string; startDate: string; endDate: string
  days: ItineraryDay[]; onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const text = buildShareText(destination, startDate, endDate, days)
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-6 sm:pb-0"
      onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-pop" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-extrabold text-slate-900 text-lg">Share itinerary</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X size={15} className="text-slate-500" />
          </button>
        </div>
        <div className="space-y-3">
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-green-50 border border-green-100 hover:bg-green-100 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-green-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-bold">W</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">WhatsApp</p>
              <p className="text-xs text-slate-500">Send your full itinerary to the group</p>
            </div>
          </a>
          <button onClick={handleCopy}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors text-left">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 flex items-center justify-center flex-shrink-0">
              {copied ? <Check size={16} className="text-sage-600" /> : <Copy size={16} className="text-slate-600" />}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{copied ? 'Copied!' : 'Copy to clipboard'}</p>
              <p className="text-xs text-slate-500">Paste into any message or note</p>
            </div>
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">Includes all {days.length} days · {days.reduce((s, d) => s + d.activities.length, 0)} stops</p>
      </div>
    </div>
  )
}

// ─── Share helper ─────────────────────────────────────────────────────────
function buildShareText(destination: string, startDate: string, endDate: string, days: ItineraryDay[]): string {
  const lines: string[] = [
    `✈️ RoamRiot Itinerary — ${destination}`,
    `📅 ${startDate} → ${endDate}`,
    '',
  ]
  for (const day of days) {
    lines.push(`── Day ${day.day_number} · ${day.date} ──`)
    for (const a of day.activities) {
      const time = a.start_time.replace(/^0/, '')
      lines.push(`  ${time}  ${a.name}`)
    }
    lines.push('')
  }
  lines.push('Generated with RoamRiot 🌍')
  return lines.join('\n')
}

// ─── AddActivityModal ─────────────────────────────────────────────────────
function AddActivityModal({ onAdd, onClose, dayId }: {
  onAdd: (a: Partial<Activity>) => void
  onClose: () => void
  dayId: string
}) {
  const [name, setName] = useState('')
  const [time, setTime] = useState('10:00')
  const [dur, setDur]   = useState(60)
  const [cat, setCat]   = useState<string>('attraction')
  const [notes, setNotes] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-pop" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-extrabold text-slate-900 text-lg">Add a stop</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <Plus size={15} className="text-slate-600 rotate-45" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Place name</label>
            <input autoFocus className="input" placeholder="e.g. Amber Fort, Local café…" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start time</label>
              <input type="time" className="input" value={time} onChange={e => setTime(e.target.value)} />
            </div>
            <div>
              <label className="label">Duration (min)</label>
              <input type="number" className="input" min={15} max={480} step={15} value={dur} onChange={e => setDur(+e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {(['attraction', 'food', 'experience', 'transport', 'accommodation', 'essentials'] as string[]).map(c => (
                <button key={c} onClick={() => setCat(c)}
                  className={cn('px-2 py-2 rounded-xl text-xs font-semibold border-2 transition-all capitalize',
                    cat === c ? 'border-sea-400 bg-sea-50 text-sea-700' : 'border-slate-200 text-slate-500 hover:border-sea-200')}>
                  {categoryIcon(c)} {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input className="input" placeholder="Any tips or reminders…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-outline flex-1 justify-center">Cancel</button>
          <button
            disabled={!name.trim()}
            onClick={() => {
              onAdd({ name, start_time: time, duration_minutes: dur, category: cat as Activity['category'], tips: notes, source_videos: [], is_fixed: false, day_id: dayId })
              onClose()
            }}
            className="btn-primary flex-1 justify-center"
          >
            <Plus size={15} /> Add stop
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── TripView ─────────────────────────────────────────────────────────────
export default function TripView({ trip }: { trip: TripWithDays }) {
  const [days, setDays]                         = useState<ItineraryDay[]>(trip.days)
  const [activeDay, setActiveDay]               = useState(0)
  const [activeActivityId, setActiveActivityId] = useState(trip.days[0]?.activities[0]?.id ?? '')
  const [showAddModal, setShowAddModal]         = useState(false)
  const [showShareModal, setShowShareModal]     = useState(false)
  const [toast, setToast]                       = useState<ToastData | null>(null)

  const day = days[activeDay]
  const { destination, start_date, end_date, id: tripId } = trip

  // Derive source videos from all activities
  const sourceVideos = days
    .flatMap(d => d.activities.flatMap(a => a.source_videos))
    .filter((v, i, arr) => arr.findIndex(x => x.videoId === v.videoId) === i)
    .slice(0, 6)

  const vlogCount = days.reduce((s, d) => s + d.activities.filter(a => a.source_videos.length > 0).length, 0)

  const mapActivities: MapActivity[] = day?.activities.map(a => ({
    id: a.id, name: a.name, category: a.category, start_time: a.start_time, order_index: a.order_index,
  })) ?? []

  function handleReorder(dayIdx: number, reordered: Activity[]) {
    setDays(prev => {
      const updated = [...prev]
      updated[dayIdx] = { ...updated[dayIdx], activities: reordered }
      return updated
    })
  }

  function handleDelete(activityId: string) {
    setDays(prev => {
      const updated = [...prev]
      updated[activeDay] = {
        ...updated[activeDay],
        activities: updated[activeDay].activities
          .filter(a => a.id !== activityId)
          .map((a, i) => ({ ...a, order_index: i })),
      }
      return updated
    })

    // Persist delete
    fetch(`/api/trips/${tripId}/activities/${activityId}`, { method: 'DELETE' })
      .then(r => { if (r.ok) setToast({ message: 'Stop removed', type: 'success' }) })
      .catch(() => setToast({ message: 'Failed to delete stop', type: 'error' }))
  }

  function addActivity(partial: Partial<Activity>) {
    const newAct: Activity = {
      id:               `custom-${Date.now()}`,
      day_id:           day.id,
      name:             partial.name ?? 'New stop',
      description:      '',
      location:         partial.name ?? '',
      start_time:       partial.start_time ?? '10:00',
      duration_minutes: partial.duration_minutes ?? 60,
      category:         partial.category ?? 'attraction',
      tips:             partial.tips ?? '',
      is_fixed:         false,
      source_videos:    [],
      order_index:      day.activities.length,
    }
    setDays(prev => {
      const updated = [...prev]
      const acts = [...updated[activeDay].activities, newAct]
        .sort((a, b) => a.start_time.localeCompare(b.start_time))
        .map((a, i) => ({ ...a, order_index: i }))
      updated[activeDay] = { ...updated[activeDay], activities: acts }
      return updated
    })
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden animate-fade-up">
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
      {showAddModal && (
        <AddActivityModal
          onAdd={addActivity}
          onClose={() => setShowAddModal(false)}
          dayId={day?.id ?? ''}
        />
      )}
      {showShareModal && (
        <ShareModal
          destination={destination}
          startDate={start_date}
          endDate={end_date}
          days={days}
          onClose={() => setShowShareModal(false)}
        />
      )}
      {/* ─── Nav ─── */}
      <nav className="bg-white border-b border-sea-100 flex-shrink-0 z-20">
        <div className="h-14 px-4 flex items-center gap-3">
          <Link href="/dashboard" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0">
            <ArrowLeft size={15} className="text-slate-600" />
          </Link>
          <Link href="/" className="text-lg font-extrabold text-gradient flex-shrink-0">RoamRiot</Link>
          <div className="h-4 w-px bg-slate-200" />
          <MapPin size={14} className="text-sea-500 flex-shrink-0" />
          <span className="font-bold text-slate-900 truncate">{destination}</span>
          <span className="text-slate-300 hidden sm:block">·</span>
          <span className="text-sm text-slate-500 hidden sm:block">
            {formatDate(start_date, 'MMM d')} – {formatDate(end_date, 'MMM d')}
          </span>
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {vlogCount > 0 && (
              <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-50 px-2.5 py-1 rounded-full">
                <Youtube size={10} /> {vlogCount} from vlogs
              </span>
            )}
            <Link href="/expenses" className="btn-ghost text-xs px-3 py-1.5"><Wallet size={12} /> Budget</Link>
            <Link href="/events" className="btn-ghost text-xs px-3 py-1.5"><Sparkles size={12} /> Events</Link>
            <button onClick={() => setShowShareModal(true)} className="btn-ghost text-xs px-3 py-1.5">
              <Share2 size={12} /> Share
            </button>
          </div>
        </div>

        {/* Day tabs */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {days.map((d, i) => (
            <button
              key={d.id}
              onClick={() => { setActiveDay(i); setActiveActivityId(d.activities[0]?.id ?? '') }}
              className={cn(
                'flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200',
                i === activeDay
                  ? 'bg-sea-500 text-white shadow-soft'
                  : 'bg-slate-100 text-slate-500 hover:bg-sea-50 hover:text-sea-700'
              )}
            >
              <span className="text-[10px] opacity-70 uppercase tracking-wide">Day {d.day_number}</span>
              <span className={cn('font-extrabold', i === activeDay ? 'text-white' : 'text-slate-700')}>
                {formatDate(d.date, 'MMM d')}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* ─── Split panel ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — Timeline */}
        <div className="w-full sm:w-[360px] lg:w-[420px] flex-shrink-0 overflow-y-auto bg-white border-r border-sea-100">

          {activeDay === 0 && <AirportTransferCard destination={destination} />}
          {activeDay === days.length - 1 && days.length > 1 && <ReturnToAirportCard destination={destination} />}

          {/* Add stop button */}
          <div className="px-4 pb-2 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <MapPin size={10} /> {day?.activities.length ?? 0} stops · drag to reorder
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-sea-600 hover:text-sea-800 transition-colors bg-sea-50 hover:bg-sea-100 px-3 py-1.5 rounded-full"
            >
              <Plus size={12} /> Add stop
            </button>
          </div>

          {/* Activities (dnd-kit) */}
          {day && (
            <ActivityList
              activities={day.activities}
              activeActivityId={activeActivityId}
              tripId={tripId}
              dayId={day.id}
              onActivityClick={id => setActiveActivityId(id)}
              onReorder={reordered => handleReorder(activeDay, reordered)}
              onDelete={handleDelete}
            />
          )}

          {/* Source vlogs */}
          {sourceVideos.length > 0 && (
            <div className="mx-4 mb-6 p-4 rounded-3xl bg-gradient-to-br from-sea-50 to-sage-50 border border-sea-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Youtube size={11} className="text-red-400" /> Vlogs used
              </p>
              <div className="space-y-2">
                {sourceVideos.slice(0, 4).map(v => (
                  <a
                    key={v.videoId}
                    href={`https://www.youtube.com/watch?v=${v.videoId}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 hover:bg-white/70 p-2 rounded-2xl transition-colors group"
                  >
                    <img
                      src={v.thumbnailUrl} alt=""
                      className="w-12 h-8 rounded-xl object-cover bg-slate-200 flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-700 line-clamp-1">{v.title}</p>
                      <p className="text-xs text-slate-400">{v.channelTitle}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Map */}
        <div className="flex-1 p-3 hidden sm:block">
          <MapView
            destination={destination}
            activities={mapActivities}
            activeId={activeActivityId}
            onPinClick={id => setActiveActivityId(id)}
          />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="sm:hidden fixed bottom-5 right-5 z-30 btn-primary rounded-full w-14 h-14 flex items-center justify-center p-0 shadow-lift"
      >
        <Plus size={22} />
      </button>
    </div>
  )
}
