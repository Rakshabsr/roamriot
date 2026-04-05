'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  MapPin, Clock, Youtube, ExternalLink, Calendar, Star, Info, Play,
  ChevronDown, ChevronUp, Share2, Plus, Navigation, GripVertical,
  Trash2, Lock, Utensils, Wallet, X, Check,
  Train, Bus, Car, Ticket, AlertCircle, Sparkles
} from 'lucide-react'
import { ItineraryDay, Activity, SourceVideo } from '@/lib/types'
import { cn, formatDate, formatTime, categoryColor, categoryIcon, youtubeWatchUrl } from '@/lib/utils'
import type { MapActivity } from '@/components/trip/MapView'

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

interface StoredItinerary {
  destination: string; startDate: string; endDate: string
  days: ItineraryDay[]; sourceVideos: SourceVideo[]
}

// ─── Airport Transfer Card ────────────────────────────────────────────────
const TRANSFER_DATA: Record<string, {
  airport: string
  options: { mode: string; icon: string; time: string; cost: string; costNote: string; where: string; tips: string; badge?: string }[]
}> = {
  korea: {
    airport: 'Incheon International (ICN)',
    options: [
      { mode: 'AREX Express Train', icon: 'train', time: '43 min', cost: '₩9,500', costNote: '~₹590', where: 'Buy at T1 or T2 station below arrivals', tips: 'Fastest option. Runs every 30 min. Goes direct to Seoul Station.', badge: 'Recommended' },
      { mode: 'AREX All-Stop Train', icon: 'train', time: '66 min', cost: '₩4,150', costNote: '~₹260', where: 'Same station — choose "All Stop" on ticket machine', tips: 'Budget option. Stops at Hongik Univ, Susaek etc.'},
      { mode: 'Limousine Bus', icon: 'bus', time: '70–90 min', cost: '₩17,000', costNote: '~₹1,060', where: 'Bus counters at arrivals floor, B1 level', tips: 'Drops near major hotels. Luggage-friendly. Buy ticket at counter.' },
      { mode: 'KakaoTaxi / Taxi', icon: 'car', time: '60–80 min', cost: '₩70,000–90,000', costNote: '~₹4,300–5,600', where: 'App: Download KakaoTaxi before landing. Or use taxi stand.', tips: 'Most convenient door-to-door. Surge possible on weekends.' },
    ],
  },
  seoul: {
    airport: 'Incheon International (ICN)',
    options: [
      { mode: 'AREX Express Train', icon: 'train', time: '43 min', cost: '₩9,500', costNote: '~₹590', where: 'T1 or T2 station below arrivals', tips: 'Direct to Seoul Station.', badge: 'Recommended' },
      { mode: 'Limousine Bus', icon: 'bus', time: '70–90 min', cost: '₩17,000', costNote: '~₹1,060', where: 'Arrivals B1 bus counters', tips: 'Good for hotels near Gangnam or Myeongdong.' },
      { mode: 'KakaoTaxi', icon: 'car', time: '60–80 min', cost: '₩70,000+', costNote: '~₹4,300+', where: 'KakaoTaxi app or taxi stand', tips: 'Best for groups with luggage.' },
    ],
  },
  jaipur: {
    airport: 'Jaipur International (JAI)',
    options: [
      { mode: 'Prepaid Taxi', icon: 'car', time: '25–35 min', cost: '₹300–450', costNote: 'to city centre', where: 'Prepaid taxi counter inside arrivals', tips: 'Most reliable option.', badge: 'Recommended' },
      { mode: 'Ola / Uber', icon: 'car', time: '25–35 min', cost: '₹200–350', costNote: 'varies', where: 'App pickup zone outside terminal', tips: 'Book in the app before exiting.' },
      { mode: 'City Bus', icon: 'bus', time: '45–60 min', cost: '₹20–40', costNote: 'very cheap', where: 'Bus stop 200m from terminal', tips: 'AC buses available. Not ideal with luggage.' },
    ],
  },
  bali: {
    airport: 'Ngurah Rai International (DPS)',
    options: [
      { mode: 'Grab / Gojek', icon: 'car', time: '30–60 min', cost: 'IDR 50,000–120,000', costNote: '~₹260–620', where: 'App pickup at international arrivals', tips: 'Cheapest. Download apps before landing.', badge: 'Recommended' },
      { mode: 'Bluebird Taxi', icon: 'car', time: '30–60 min', cost: 'IDR 100,000–200,000', costNote: '~₹520–1,040', where: 'Official taxi desk inside arrivals', tips: 'Metered & safe. Ask for bluebird specifically.' },
      { mode: 'Prepaid Airport Taxi', icon: 'car', time: '30–60 min', cost: 'IDR 200,000–350,000', costNote: 'fixed rate', where: 'Counter at arrivals', tips: 'No bargaining. Good if apps don\'t work.' },
    ],
  },
  tokyo: {
    airport: 'Narita (NRT) or Haneda (HND)',
    options: [
      { mode: 'Narita Express (N\'EX)', icon: 'train', time: '60 min', cost: '¥3,070', costNote: '~₹1,700', where: 'B1 of Narita terminals — IC card or ticket machine', tips: 'Direct to Shinjuku / Shibuya. Seat reservation included.', badge: 'Recommended' },
      { mode: 'Limousine Bus', icon: 'bus', time: '75–90 min', cost: '¥3,200', costNote: '~₹1,780', where: 'Bus stop outside each terminal', tips: 'Drops at major hotels. Great for luggage.' },
      { mode: 'IC Card + Local Train', icon: 'train', time: '90 min', cost: '¥1,300', costNote: '~₹720', where: 'Top up Suica at any JR machine', tips: 'Budget option. Requires 1-2 changes.' },
    ],
  },
  default: {
    airport: 'International Airport',
    options: [
      { mode: 'Official Prepaid Taxi', icon: 'car', time: 'Varies', cost: 'Fixed rate', costNote: 'ask at counter', where: 'Prepaid taxi counter inside arrivals hall', tips: 'Always use the official prepaid counter to avoid overcharging.', badge: 'Recommended' },
      { mode: 'Ride-hailing App', icon: 'car', time: 'Varies', cost: 'App estimate', costNote: '', where: 'App pickup zone — check signage at exit', tips: 'Uber, Grab, or local app. Download before landing.' },
      { mode: 'Public Transport', icon: 'bus', time: 'Slower', cost: 'Cheapest', costNote: '', where: 'Check airport transport desk or signs to Bus/Rail', tips: 'Look for Airport Bus or Metro links in arrivals.' },
    ],
  },
}

function getTransferData(destination: string) {
  const key = destination.toLowerCase()
  if (key.includes('korea') || key.includes('incheon')) return TRANSFER_DATA.korea
  if (key.includes('seoul'))   return TRANSFER_DATA.seoul
  if (key.includes('jaipur'))  return TRANSFER_DATA.jaipur
  if (key.includes('bali'))    return TRANSFER_DATA.bali
  if (key.includes('tokyo') || key.includes('japan')) return TRANSFER_DATA.tokyo
  return TRANSFER_DATA.default
}

const MODE_ICON: Record<string, React.ElementType> = { train: Train, bus: Bus, car: Car }

function AirportTransferCard({ destination }: { destination: string }) {
  const [open, setOpen] = useState(false)
  const data = getTransferData(destination)

  return (
    <div className="mx-4 mb-3 rounded-3xl border-2 border-sea-200 bg-gradient-to-br from-white to-sea-50 overflow-hidden shadow-soft">
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className="w-10 h-10 rounded-2xl bg-sea-500 flex items-center justify-center flex-shrink-0">
          <Ticket size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-slate-900 text-sm">✈️ Airport → Hotel</p>
          <p className="text-xs text-slate-500 truncate">{data.airport} · tap to see transport options</p>
        </div>
        <div className={cn('w-7 h-7 rounded-full bg-sea-100 flex items-center justify-center transition-transform flex-shrink-0', open && 'rotate-180')}>
          <ChevronDown size={14} className="text-sea-600" />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2.5 animate-fade-up">
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-3">
            <AlertCircle size={11} className="text-amber-400" />
            Compare options below — prices are approximate and may vary.
          </p>
          {data.options.map((opt, i) => {
            const Icon = MODE_ICON[opt.icon] ?? Car
            return (
              <div key={i} className="relative bg-white rounded-2xl border border-slate-100 p-3.5 shadow-soft">
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
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock size={10} /> {opt.time}
                      </span>
                      <span className="text-xs font-bold text-sea-700">{opt.cost}</span>
                      {opt.costNote && <span className="text-xs text-slate-400">{opt.costNote}</span>}
                    </div>
                  </div>
                </div>
                {/* Where to collect */}
                <div className="mt-2.5 flex gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                  <MapPin size={11} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-amber-800">Where to get it</p>
                    <p className="text-[11px] text-amber-700 leading-relaxed">{opt.where}</p>
                  </div>
                </div>
                {/* Tip */}
                <p className="mt-2 text-xs text-slate-500 leading-relaxed flex gap-1.5">
                  <Sparkles size={10} className="text-sea-400 mt-0.5 flex-shrink-0" />
                  {opt.tips}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


// ─── Travel time strip ─────────────────────────────────────────────────────
function TravelStrip({ minutes }: { minutes: number }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-4 ml-11">
      <div className="flex-1 border-t-2 border-dashed border-sea-100" />
      <span className="text-xs font-semibold text-sea-400 whitespace-nowrap flex items-center gap-1">
        <Navigation size={10} /> {minutes} min
      </span>
      <div className="flex-1 border-t-2 border-dashed border-sea-100" />
    </div>
  )
}

// ─── Video card ───────────────────────────────────────────────────────────
function VideoCard({ video }: { video: SourceVideo }) {
  const [embed, setEmbed] = useState(false)
  return (
    <div className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 mt-2">
      <button onClick={() => setEmbed(v=>!v)} className="w-full flex items-center gap-3 p-3 hover:bg-white transition-colors text-left group">
        <img src={video.thumbnailUrl} alt="" className="w-14 h-9 rounded-xl object-cover bg-slate-200 flex-shrink-0"
          onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800 line-clamp-1">{video.title}</p>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <Youtube size={9} className="text-red-500"/> {video.channelTitle}
          </p>
        </div>
        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all', embed?'bg-slate-200':'bg-sea-100 group-hover:bg-sea-200')}>
          {embed ? <ChevronUp size={12} className="text-slate-500"/> : <Play size={11} className="text-sea-600"/>}
        </div>
      </button>
      {embed && (
        <div className="aspect-video">
          <iframe src={`https://www.youtube.com/embed/${video.videoId}?modestbranding=1&rel=0&autoplay=1`}
            className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen title={video.title} />
        </div>
      )}
      {!embed && (
        <div className="px-3 pb-2.5">
          <a href={youtubeWatchUrl(video.videoId)} target="_blank" rel="noopener noreferrer"
            className="text-xs text-sea-600 hover:underline font-medium inline-flex items-center gap-1">
            Watch on YouTube <ExternalLink size={10}/>
          </a>
        </div>
      )}
    </div>
  )
}

// ─── Activity card (draggable) ────────────────────────────────────────────
function ActivityCard({
  activity, index, isLast, isActive, onClick, onDelete, dragHandleProps,
}: {
  activity: Activity; index: number; isLast: boolean; isActive: boolean
  onClick: () => void; onDelete: () => void; dragHandleProps?: Record<string,unknown>
}) {
  const [expanded, setExpanded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const STRIP_COLORS: Record<string,string> = { food:'bg-orange-400', attraction:'bg-sea-500', experience:'bg-sage-500', accommodation:'bg-purple-500', transport:'bg-slate-400', essentials:'bg-red-400' }

  useEffect(() => { if (isActive) ref.current?.scrollIntoView({behavior:'smooth',block:'nearest'}) }, [isActive])

  return (
    <div ref={ref} className="relative flex gap-3 animate-fade-up" style={{animationDelay:`${index*0.04}s`}}>
      {/* Timeline dot */}
      <div className="flex flex-col items-center w-10 flex-shrink-0 pt-1">
        <div className={cn('w-8 h-8 rounded-2xl flex items-center justify-center text-sm z-10 shadow-soft transition-all',
          isActive?'bg-sea-500 text-white scale-110 shadow-lift':'bg-white border-2 border-sea-100')}>
          {categoryIcon(activity.category)}
        </div>
        {!isLast && <div className="w-0.5 bg-gradient-to-b from-sea-200 to-transparent flex-1 mt-1 min-h-[1.5rem]" />}
      </div>

      {/* Card */}
      <div className="flex-1 pb-4">
        <div className={cn('card overflow-hidden transition-all duration-200',
          isActive?'shadow-lift ring-2 ring-sea-300':'hover:shadow-card hover:-translate-y-0.5')}>
          <div className={cn('h-1 w-full', STRIP_COLORS[activity.category]??'bg-sea-400')} />
          <div className="p-3.5">
            {/* Header row */}
            <div className="flex items-start gap-2">
              {/* Drag handle */}
              {!activity.is_fixed && (
                <div {...dragHandleProps} className="mt-0.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 touch-none">
                  <GripVertical size={15}/>
                </div>
              )}
              {activity.is_fixed && <Lock size={13} className="mt-0.5 text-slate-300 flex-shrink-0"/>}

              <button className="flex-1 text-left min-w-0" onClick={() => { onClick(); setExpanded(e=>!e) }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock size={10} className="text-slate-400"/>
                  <span className="text-xs font-bold text-slate-500">{formatTime(activity.start_time)}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-400">{activity.duration_minutes}min</span>
                  {activity.source_videos.length > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-red-400 font-semibold ml-1">
                      <Youtube size={9}/> vlog
                    </span>
                  )}
                </div>
                <p className="font-bold text-slate-900 text-sm leading-snug">{activity.name}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className={cn('badge text-xs', categoryColor(activity.category))}>
                    {categoryIcon(activity.category)} {activity.category}
                  </span>
                  {activity.rating && <span className="badge bg-amber-50 text-amber-600 text-xs"><Star size={9} fill="currentColor"/> {activity.rating}</span>}
                  {activity.price_range && <span className="badge bg-slate-50 text-slate-500 text-xs">{activity.price_range}</span>}
                </div>
              </button>

              <div className="flex flex-col gap-1 flex-shrink-0">
                {!activity.is_fixed && (
                  <button onClick={onDelete} className="w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors group">
                    <Trash2 size={10} className="text-red-400 group-hover:text-red-600"/>
                  </button>
                )}
                <button onClick={() => { onClick(); setExpanded(e=>!e) }} className="w-6 h-6 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors">
                  {expanded ? <ChevronUp size={11} className="text-slate-400"/> : <ChevronDown size={11} className="text-slate-400"/>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded */}
        {expanded && (
          <div className="mt-2 px-1 space-y-2 animate-fade-up">
            {activity.description && <p className="text-sm text-slate-600 leading-relaxed">{activity.description}</p>}
            {activity.tips && (
              <div className="flex gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-100">
                <Info size={13} className="text-amber-500 mt-0.5 flex-shrink-0"/>
                <p className="text-xs text-amber-700 leading-relaxed">{activity.tips}</p>
              </div>
            )}
            {activity.source_videos.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Youtube size={10} className="text-red-400"/> Recommended in
                </p>
                {activity.source_videos.map(v => <VideoCard key={v.videoId} video={v}/>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Add activity modal ───────────────────────────────────────────────────
function AddActivityModal({ onAdd, onClose }: { onAdd: (a: Partial<Activity>) => void; onClose: () => void }) {
  const [name, setName]       = useState('')
  const [time, setTime]       = useState('10:00')
  const [dur, setDur]         = useState(60)
  const [cat, setCat]         = useState<string>('attraction')
  const [notes, setNotes]     = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-pop" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-extrabold text-slate-900 text-lg">Add a stop</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X size={15} className="text-slate-600"/>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Place name</label>
            <input autoFocus className="input" placeholder="e.g. Amber Fort, Local café…" value={name} onChange={e=>setName(e.target.value)}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start time</label>
              <input type="time" className="input" value={time} onChange={e=>setTime(e.target.value)}/>
            </div>
            <div>
              <label className="label">Duration (min)</label>
              <input type="number" className="input" min={15} max={480} step={15} value={dur} onChange={e=>setDur(+e.target.value)}/>
            </div>
          </div>
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {(['attraction','food','experience','transport','accommodation','essentials'] as string[]).map(c => (
                <button key={c} onClick={()=>setCat(c)}
                  className={cn('px-2 py-2 rounded-xl text-xs font-semibold border-2 transition-all capitalize',
                    cat===c?'border-sea-400 bg-sea-50 text-sea-700':'border-slate-200 text-slate-500 hover:border-sea-200')}>
                  {categoryIcon(c)} {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input className="input" placeholder="Any tips or reminders…" value={notes} onChange={e=>setNotes(e.target.value)}/>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-outline flex-1 justify-center">Cancel</button>
          <button disabled={!name.trim()} onClick={() => { onAdd({name, start_time: time, duration_minutes: dur, category: cat as Activity['category'], tips: notes, source_videos:[], is_fixed:false}); onClose() }}
            className="btn-primary flex-1 justify-center">
            <Plus size={15}/> Add stop
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────
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

export default function TripPreviewPage() {
  const [itinerary, setItinerary]           = useState<StoredItinerary|null>(null)
  const [days, setDays]                     = useState<ItineraryDay[]>([])
  const [activeDay, setActiveDay]           = useState(0)
  const [activeActivityId, setActiveActivityId] = useState('')
  const [showAddModal, setShowAddModal]     = useState(false)
  const [dragId, setDragId]                 = useState<string|null>(null)
  const [copied, setCopied]                 = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('roamriot_itinerary')
    if (raw) {
      try {
        const data: StoredItinerary = JSON.parse(raw)
        setItinerary(data)
        setDays(data.days)
        setActiveActivityId(data.days?.[0]?.activities?.[0]?.id ?? '')
      } catch {}
    }
  }, [])

  const day = days[activeDay]

  // Drag and drop (simple implementation without DnD library for SSR compat)
  const dragRef    = useRef<{id:string; idx:number}|null>(null)
  const dragOverRef = useRef<number|null>(null)

  function handleDragStart(e: React.DragEvent, id: string, idx: number) {
    dragRef.current = { id, idx }
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    dragOverRef.current = idx
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (!dragRef.current || dragOverRef.current === null) return
    const fromIdx = dragRef.current.idx
    const toIdx   = dragOverRef.current
    if (fromIdx === toIdx) return

    setDays(prev => {
      const updated = [...prev]
      const acts    = [...updated[activeDay].activities]
      const [moved] = acts.splice(fromIdx, 1)
      acts.splice(toIdx, 0, moved)
      // Reassign order_index
      const reindexed = acts.map((a, i) => ({ ...a, order_index: i }))
      updated[activeDay] = { ...updated[activeDay], activities: reindexed }
      return updated
    })
    dragRef.current    = null
    dragOverRef.current = null
    setDragId(null)
  }

  function handleDragEnd() { setDragId(null) }

  function deleteActivity(id: string) {
    setDays(prev => {
      const updated = [...prev]
      updated[activeDay] = {
        ...updated[activeDay],
        activities: updated[activeDay].activities.filter(a => a.id !== id).map((a,i) => ({...a, order_index:i})),
      }
      return updated
    })
  }

  function addActivity(partial: Partial<Activity>) {
    setDays(prev => {
      const updated = [...prev]
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
        order_index:      updated[activeDay].activities.length,
        rating:           undefined,
        price_range:      undefined,
      }
      const acts = [...updated[activeDay].activities, newAct]
        .sort((a,b) => a.start_time.localeCompare(b.start_time))
        .map((a,i) => ({...a, order_index:i}))
      updated[activeDay] = { ...updated[activeDay], activities: acts }
      return updated
    })
  }

  if (!itinerary) return (
    <div className="min-h-screen bg-sea-50 flex flex-col items-center justify-center gap-4">
      <p className="text-slate-500">No itinerary found.</p>
      <Link href="/trips/new" className="btn-primary">Plan a trip</Link>
    </div>
  )

  const { destination, startDate, endDate, sourceVideos } = itinerary
  const mapActivities: MapActivity[] = day?.activities.map(a => ({
    id:a.id, name:a.name, category:a.category, start_time:a.start_time, order_index:a.order_index,
  })) ?? []
  const totalActs  = days.reduce((s,d) => s+d.activities.length, 0)
  const vlogCount  = days.reduce((s,d) => s+d.activities.filter(a=>a.source_videos.length>0).length, 0)

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {showAddModal && <AddActivityModal onAdd={addActivity} onClose={()=>setShowAddModal(false)}/>}

      {/* ─── Nav ─── */}
      <nav className="bg-white border-b border-sea-100 flex-shrink-0 z-20">
        <div className="h-14 px-4 flex items-center gap-3">
          <Link href="/" className="text-lg font-extrabold text-gradient flex-shrink-0">RoamRiot</Link>
          <div className="h-4 w-px bg-slate-200"/>
          <MapPin size={14} className="text-sea-500 flex-shrink-0"/>
          <span className="font-bold text-slate-900 truncate">{destination}</span>
          <span className="text-slate-300 hidden sm:block">·</span>
          <span className="text-sm text-slate-500 hidden sm:block">{formatDate(startDate,'MMM d')} – {formatDate(endDate,'MMM d')}</span>
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-50 px-2.5 py-1 rounded-full">
              <Youtube size={10}/> {vlogCount} from vlogs
            </span>
            <Link href="/expenses" className="btn-ghost text-xs px-3 py-1.5"><Wallet size={12}/> Budget</Link>
            <Link href="/food" className="btn-ghost text-xs px-3 py-1.5"><Utensils size={12}/> Food</Link>
            <Link href="/events" className="btn-ghost text-xs px-3 py-1.5"><Sparkles size={12}/> Events</Link>
            <button
              onClick={async () => {
                const text = buildShareText(destination, startDate, endDate, days)
                await navigator.clipboard.writeText(text)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="btn-ghost text-xs px-3 py-1.5"
            >
              {copied ? <Check size={12}/> : <Share2 size={12}/>} {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>

        {/* Day tabs */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {days.map((d,i) => (
            <button key={d.id} onClick={()=>{ setActiveDay(i); setActiveActivityId(d.activities[0]?.id??'') }}
              className={cn('flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200',
                i===activeDay?'bg-sea-500 text-white shadow-soft':'bg-slate-100 text-slate-500 hover:bg-sea-50 hover:text-sea-700')}>
              <span className="text-[10px] opacity-70 uppercase tracking-wide">Day {d.day_number}</span>
              <span className={cn('font-extrabold', i===activeDay?'text-white':'text-slate-700')}>{formatDate(d.date,'MMM d')}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ─── Split panel ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — Timeline */}
        <div className="w-full sm:w-[360px] lg:w-[420px] flex-shrink-0 overflow-y-auto bg-white border-r border-sea-100" onDrop={handleDrop} onDragOver={e=>e.preventDefault()}>

          {/* Day summary */}

          {/* Airport transfer card — Day 1 only */}
          {activeDay === 0 && <AirportTransferCard destination={destination} />}

          {/* Add stop button */}
          <div className="px-4 pb-2 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <MapPin size={10}/> {day?.activities.length ?? 0} stops · drag to reorder
            </p>
            <button onClick={()=>setShowAddModal(true)} className="flex items-center gap-1.5 text-xs font-bold text-sea-600 hover:text-sea-800 transition-colors bg-sea-50 hover:bg-sea-100 px-3 py-1.5 rounded-full">
              <Plus size={12}/> Add stop
            </button>
          </div>

          {/* Activities */}
          <div className="px-4 pb-4">
            {day?.activities.map((activity, i) => (
              <div key={activity.id}
                draggable={!activity.is_fixed}
                onDragStart={e=>handleDragStart(e, activity.id, i)}
                onDragOver={e=>handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                className={cn('transition-opacity', dragId===activity.id && 'opacity-40')}
              >
                <ActivityCard
                  activity={activity} index={i}
                  isLast={i===day.activities.length-1}
                  isActive={activity.id===activeActivityId}
                  onClick={()=>setActiveActivityId(activity.id)}
                  onDelete={()=>deleteActivity(activity.id)}
                  dragHandleProps={!activity.is_fixed ? {} : undefined}
                />
                {i < day.activities.length-1 && <TravelStrip minutes={Math.floor(10+Math.random()*20)}/>}
              </div>
            ))}
          </div>

          {/* Source vlogs */}
          {sourceVideos.length > 0 && (
            <div className="mx-4 mb-6 p-4 rounded-3xl bg-gradient-to-br from-sea-50 to-sage-50 border border-sea-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Youtube size={11} className="text-red-400"/> Vlogs used
              </p>
              <div className="space-y-2">
                {sourceVideos.slice(0,4).map(v => (
                  <a key={v.videoId} href={youtubeWatchUrl(v.videoId)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 hover:bg-white/70 p-2 rounded-2xl transition-colors group">
                    <img src={v.thumbnailUrl} alt="" className="w-12 h-8 rounded-xl object-cover bg-slate-200 flex-shrink-0"
                      onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-700 line-clamp-1">{v.title}</p>
                      <p className="text-xs text-slate-400">{v.channelTitle}</p>
                    </div>
                    <ExternalLink size={11} className="text-sea-400 opacity-0 group-hover:opacity-100 flex-shrink-0"/>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Map */}
        <div className="flex-1 p-3 hidden sm:block">
          <MapView destination={destination} activities={mapActivities} activeId={activeActivityId} onPinClick={id=>setActiveActivityId(id)}/>
        </div>
      </div>

      {/* Mobile map FAB */}
      <Link href="/food" className="sm:hidden fixed bottom-20 right-5 z-30 btn-sage rounded-full w-12 h-12 flex items-center justify-center p-0 shadow-lift">
        <Utensils size={18}/>
      </Link>
      <button onClick={()=>setShowAddModal(true)} className="sm:hidden fixed bottom-5 right-5 z-30 btn-primary rounded-full w-14 h-14 flex items-center justify-center p-0 shadow-lift">
        <Plus size={22}/>
      </button>
    </div>
  )
}
