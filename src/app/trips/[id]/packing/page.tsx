'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Plus, Trash2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TravelStyle } from '@/lib/types'

interface PackingItem {
  id: string
  label: string
  checked: boolean
  custom?: boolean
}

interface PackingSection {
  id: string
  title: string
  emoji: string
  items: PackingItem[]
}

interface TripMeta {
  destination: string
  start_date: string
  end_date: string
  preferences: {
    travelStyle?: TravelStyle
    dietary?: string
    budget?: string
  }
}

function numDays(start: string, end: string) {
  return Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1)
}

function buildPackingList(trip: TripMeta | null): PackingSection[] {
  const days = trip ? numDays(trip.start_date, trip.end_date) : 5
  const style = trip?.preferences?.travelStyle ?? 'couple'
  const isSolo = style === 'solo_female' || style === 'solo_male'
  const isFamily = style === 'family'
  const isSenior = style === 'senior'
  const isLuxury = trip?.preferences?.budget === 'splurge' || trip?.preferences?.budget === 'comfort'

  const clothesItems = [
    { label: `T-shirts / tops × ${Math.min(days + 1, 7)}`, id: 'clothes-1' },
    { label: `Bottoms (pants/shorts) × ${Math.ceil(days / 2)}`, id: 'clothes-2' },
    { label: 'Comfortable walking shoes', id: 'clothes-3' },
    { label: 'Sandals / flip flops', id: 'clothes-4' },
    { label: `Underwear × ${Math.min(days + 1, 7)}`, id: 'clothes-5' },
    { label: `Socks × ${Math.min(days, 6)}`, id: 'clothes-6' },
    { label: 'Light jacket / cardigan', id: 'clothes-7' },
    ...(!isLuxury ? [{ label: 'Laundry bag (separate dirties)', id: 'clothes-8' }] : []),
    ...(isFamily ? [{ label: 'Kids clothes × days × number of kids', id: 'clothes-9' }] : []),
    ...(style === 'girls_gang' || style === 'solo_female' ? [{ label: 'One evening outfit', id: 'clothes-10' }] : []),
  ]

  const toiletries = [
    { label: 'Toothbrush + toothpaste', id: 'tlt-1' },
    { label: 'Shampoo + conditioner (travel size)', id: 'tlt-2' },
    { label: 'Body wash / soap', id: 'tlt-3' },
    { label: 'Deodorant', id: 'tlt-4' },
    { label: 'Sunscreen SPF 50+', id: 'tlt-5' },
    { label: 'Moisturiser / lip balm', id: 'tlt-6' },
    { label: 'Razor + shaving cream', id: 'tlt-7' },
    { label: 'Feminine hygiene products', id: 'tlt-8' },
    ...(isFamily ? [{ label: 'Baby wipes + nappies', id: 'tlt-9' }] : []),
  ]

  const documents = [
    { label: 'Passport (valid 6+ months)', id: 'doc-1' },
    { label: 'Visa (printed + digital copy)', id: 'doc-2' },
    { label: 'Flight tickets (printed + phone)', id: 'doc-3' },
    { label: 'Hotel confirmation', id: 'doc-4' },
    { label: 'Travel insurance certificate', id: 'doc-5' },
    { label: 'Emergency contacts list', id: 'doc-6' },
    { label: 'Local currency (cash for Day 1)', id: 'doc-7' },
    { label: 'Credit / debit card with no forex fee', id: 'doc-8' },
    ...(isSolo ? [{ label: 'Hostel / accommodation backup printout', id: 'doc-9' }] : []),
  ]

  const electronics = [
    { label: 'Phone + charger', id: 'elec-1' },
    { label: 'Power bank (10,000+ mAh)', id: 'elec-2' },
    { label: 'Universal travel adapter', id: 'elec-3' },
    { label: 'Earphones / AirPods', id: 'elec-4' },
    { label: 'Camera + memory card', id: 'elec-5' },
    ...(days > 3 ? [{ label: 'Laptop / tablet (if needed)', id: 'elec-6' }] : []),
    { label: 'Downloaded offline maps (Google Maps)', id: 'elec-7' },
    { label: 'RoamRiot app (this!) bookmarked offline', id: 'elec-8' },
  ]

  const health = [
    { label: 'Basic first-aid kit (band-aids, antiseptic)', id: 'hlth-1' },
    { label: 'Personal prescription medicines (extra supply)', id: 'hlth-2' },
    { label: 'Paracetamol / ibuprofen', id: 'hlth-3' },
    { label: 'Antacids / digestive tablets', id: 'hlth-4' },
    { label: 'ORS sachets (rehydration)', id: 'hlth-5' },
    { label: 'Motion sickness pills (if needed)', id: 'hlth-6' },
    { label: 'Mosquito repellent / patches', id: 'hlth-7' },
    ...(isSenior ? [{ label: "Doctor's letter for prescription meds", id: 'hlth-8' }] : []),
    ...(isFamily ? [{ label: "Children's Calpol / fever meds", id: 'hlth-9' }] : []),
  ]

  const misc = [
    { label: 'Reusable water bottle', id: 'misc-1' },
    { label: 'Day backpack / tote bag', id: 'misc-2' },
    { label: 'Padlock (for hostel / luggage)', id: 'misc-3' },
    { label: 'Sunglasses', id: 'misc-4' },
    { label: 'Travel pillow (for flights 4h+)', id: 'misc-5' },
    { label: 'Snacks for the journey', id: 'misc-6' },
    ...(isSolo ? [{ label: 'Door alarm / personal safety whistle', id: 'misc-7' }] : []),
  ]

  const sections: PackingSection[] = [
    { id: 'docs', title: 'Documents & Money', emoji: '📋', items: documents.map(i => ({ ...i, checked: false })) },
    { id: 'clothes', title: 'Clothes', emoji: '👕', items: clothesItems.map(i => ({ ...i, checked: false })) },
    { id: 'toiletries', title: 'Toiletries', emoji: '🪥', items: toiletries.map(i => ({ ...i, checked: false })) },
    { id: 'electronics', title: 'Electronics', emoji: '🔌', items: electronics.map(i => ({ ...i, checked: false })) },
    { id: 'health', title: 'Health & Safety', emoji: '💊', items: health.map(i => ({ ...i, checked: false })) },
    { id: 'misc', title: 'Miscellaneous', emoji: '🎒', items: misc.map(i => ({ ...i, checked: false })) },
  ]

  return sections
}

function toId(item: string) {
  return item.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 30)
}

export default function PackingListPage({ params }: { params: { id: string } }) {
  const tripId = params.id
  const [trip, setTrip] = useState<TripMeta | null>(null)
  const [sections, setSections] = useState<PackingSection[]>([])
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [newItem, setNewItem] = useState('')
  const storageKey = `roamriot_packing_${tripId}`

  // Load trip meta, then build or restore packing list
  useEffect(() => {
    fetch(`/api/trips/${tripId}/meta`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const t = data?.trip ?? null
        setTrip(t)

        const saved = localStorage.getItem(storageKey)
        if (saved) {
          try {
            setSections(JSON.parse(saved))
            return
          } catch { /* fall through to rebuild */ }
        }
        setSections(buildPackingList(t))
      })
      .catch(() => setSections(buildPackingList(null)))
  }, [tripId, storageKey])

  // Persist to localStorage whenever sections change
  const persist = useCallback((updated: PackingSection[]) => {
    setSections(updated)
    try { localStorage.setItem(storageKey, JSON.stringify(updated)) } catch {}
  }, [storageKey])

  function toggle(sectionId: string, itemId: string) {
    persist(sections.map(s =>
      s.id !== sectionId ? s : {
        ...s,
        items: s.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i),
      }
    ))
  }

  function removeItem(sectionId: string, itemId: string) {
    persist(sections.map(s =>
      s.id !== sectionId ? s : { ...s, items: s.items.filter(i => i.id !== itemId) }
    ))
  }

  function addItem(sectionId: string) {
    if (!newItem.trim()) return
    const id = `custom-${toId(newItem)}-${Date.now()}`
    persist(sections.map(s =>
      s.id !== sectionId ? s : {
        ...s,
        items: [...s.items, { id, label: newItem.trim(), checked: false, custom: true }],
      }
    ))
    setNewItem('')
    setAddingTo(null)
  }

  function resetList() {
    try { localStorage.removeItem(storageKey) } catch {}
    setSections(buildPackingList(trip))
  }

  const totalItems   = sections.reduce((s, sec) => s + sec.items.length, 0)
  const packedItems  = sections.reduce((s, sec) => s + sec.items.filter(i => i.checked).length, 0)
  const pct          = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0

  const days = trip ? numDays(trip.start_date, trip.end_date) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-sea-50 to-white">
      {/* Nav */}
      <nav className="bg-white/90 dark:bg-[#111a18]/90 backdrop-blur-xl border-b border-sea-100 dark:border-[#1e2f2b] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href={`/trips/${tripId}`} className="btn-ghost text-xs px-3 py-1.5 gap-1.5">
            <ArrowLeft size={13} /> Itinerary
          </Link>
          <span className="font-extrabold text-gradient text-lg">Packing List</span>
          <button onClick={resetList}
            className="ml-auto btn-ghost text-xs px-3 py-1.5 gap-1.5 text-slate-500 dark:text-slate-400">
            <RefreshCw size={12} /> Reset
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Trip + progress header */}
        <div className="card p-5 shadow-soft">
          {trip && (
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
              {trip.destination.split(',')[0]}
              {days && <span className="text-slate-400 font-normal"> · {days} day{days > 1 ? 's' : ''}</span>}
            </p>
          )}
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{packedItems}<span className="text-slate-300 text-xl font-normal">/{totalItems}</span></p>
              <p className="text-xs text-slate-400 mt-0.5">items packed</p>
            </div>
            <span className={cn(
              'text-2xl font-extrabold',
              pct === 100 ? 'text-sage-600' : pct >= 50 ? 'text-sea-600' : 'text-slate-500'
            )}>{pct}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500',
                pct === 100 ? 'bg-sage-500' : 'bg-gradient-to-r from-sea-400 to-sage-400')}
              style={{ width: `${pct}%` }}
            />
          </div>
          {pct === 100 && (
            <p className="text-center text-sm font-bold text-sage-600 mt-3">All packed! Have a great trip.</p>
          )}
        </div>

        {/* Sections */}
        {sections.map(section => {
          const sectionPacked = section.items.filter(i => i.checked).length
          return (
            <div key={section.id} className="card overflow-hidden shadow-soft">
              {/* Section header */}
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
                <span className="text-xl">{section.emoji}</span>
                <p className="font-extrabold text-slate-900 dark:text-slate-100 flex-1">{section.title}</p>
                <span className="text-xs font-bold text-slate-400">
                  {sectionPacked}/{section.items.length}
                </span>
              </div>

              {/* Items */}
              <div className="divide-y divide-slate-50">
                {section.items.map(item => (
                  <div key={item.id}
                    className={cn('flex items-center gap-3 px-5 py-3 group transition-colors',
                      item.checked ? 'bg-slate-50' : 'bg-white hover:bg-sea-50/30')}>
                    <button
                      onClick={() => toggle(section.id, item.id)}
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                        item.checked
                          ? 'bg-sage-500 border-sage-500'
                          : 'border-slate-300 hover:border-sage-400'
                      )}>
                      {item.checked && <Check size={10} className="text-white" strokeWidth={3} />}
                    </button>
                    <span className={cn('text-sm flex-1', item.checked ? 'line-through text-slate-400' : 'text-slate-800')}>
                      {item.label}
                    </span>
                    <button
                      onClick={() => removeItem(section.id, item.id)}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full hover:bg-red-100 flex items-center justify-center transition-all">
                      <Trash2 size={11} className="text-slate-300 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add item */}
              <div className="px-5 py-3 border-t border-slate-50">
                {addingTo === section.id ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      className="input flex-1 h-9 text-sm"
                      placeholder="Add item…"
                      value={newItem}
                      onChange={e => setNewItem(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') addItem(section.id)
                        if (e.key === 'Escape') { setAddingTo(null); setNewItem('') }
                      }}
                    />
                    <button onClick={() => addItem(section.id)} className="btn-primary text-xs px-3 py-2">Add</button>
                    <button onClick={() => { setAddingTo(null); setNewItem('') }} className="btn-ghost text-xs px-3 py-2">Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingTo(section.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-sea-600 hover:text-sea-800 transition-colors">
                    <Plus size={12} /> Add item
                  </button>
                )}
              </div>
            </div>
          )
        })}

        <p className="text-center text-xs text-slate-400 pb-6">
          List auto-saved on this device. Tip: pack docs and electronics first.
        </p>
      </div>
    </div>
  )
}
