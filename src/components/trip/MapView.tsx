'use client'

import { useEffect, useRef } from 'react'
import { Activity } from '@/lib/types'

// Destination centre coordinates
const DEST_COORDS: Record<string, [number, number]> = {
  jaipur:   [26.9124,  75.7873],
  bali:     [-8.3405, 115.0920],
  kyoto:    [35.0116, 135.7681],
  lisbon:   [38.7223,  -9.1393],
  udaipur:  [24.5854,  73.7125],
  goa:      [15.2993,  74.1240],
  oaxaca:   [17.0732, -96.7266],
  tokyo:    [35.6762, 139.6503],
  paris:    [48.8566,   2.3522],
  london:   [51.5074,  -0.1278],
  mumbai:   [19.0760,  72.8777],
  delhi:    [28.6139,  77.2090],
  default:  [20.5937,  78.9629],
}

function getDestCoords(destination: string): [number, number] {
  const key = destination.toLowerCase().trim()
  for (const [k, v] of Object.entries(DEST_COORDS)) {
    if (key.includes(k)) return v
  }
  return DEST_COORDS.default
}

// Generate a stable offset from a string seed
function seededOffset(seed: string, i: number): [number, number] {
  let h = 0
  for (let c = 0; c < seed.length; c++) h = (Math.imul(31, h) + seed.charCodeAt(c)) | 0
  const rng = (n: number) => (Math.sin(h * (n + 1) * 9301 + 49297) * 233280) % 1
  return [(rng(i) - 0.5) * 0.05, (rng(i + 7) - 0.5) * 0.06]
}

export interface MapActivity {
  id: string
  name: string
  category: string
  start_time: string
  order_index: number
  latitude?: number
  longitude?: number
}

interface MapViewProps {
  destination: string
  activities: MapActivity[]
  activeId?: string
  onPinClick?: (id: string) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  food:          '#f97316',
  attraction:    '#0891b2',
  experience:    '#16a34a',
  accommodation: '#7c3aed',
  transport:     '#64748b',
  essentials:    '#dc2626',
}

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍽️', attraction: '📍', experience: '✨',
  accommodation: '🏨', transport: '🚌', essentials: '💊',
}

export default function MapView({ destination, activities, activeId, onPinClick }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)
  const markersRef = useRef<unknown[]>([])
  const polylineRef = useRef<unknown>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return

    // Dynamically import Leaflet (SSR-safe)
    import('leaflet').then(L => {
      // Fix default icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const centre = getDestCoords(destination)

      // Init map only once
      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current!, {
          center: centre,
          zoom: 14,
          zoomControl: true,
          scrollWheelZoom: true,
        })

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap contributors © CARTO',
          maxZoom: 19,
        }).addTo(map)

        mapInstanceRef.current = map
      }

      const map = mapInstanceRef.current as ReturnType<typeof L.map>

      // Remove old markers & polyline
      markersRef.current.forEach((m: unknown) => (m as ReturnType<typeof L.marker>).remove())
      markersRef.current = []
      if (polylineRef.current) (polylineRef.current as ReturnType<typeof L.polyline>).remove()

      if (activities.length === 0) return

      const coords: [number, number][] = activities.map((a, i) => {
        if (a.latitude && a.longitude) return [a.latitude, a.longitude]
        const [dlat, dlng] = seededOffset(a.name + a.id, i)
        return [centre[0] + dlat, centre[1] + dlng]
      })

      // Route polyline
      polylineRef.current = L.polyline(coords, {
        color: '#0891b2',
        weight: 2.5,
        opacity: 0.5,
        dashArray: '6 5',
      }).addTo(map)

      // Custom markers
      activities.forEach((a, i) => {
        const isActive = a.id === activeId
        const color = CATEGORY_COLORS[a.category] ?? '#0891b2'
        const emoji = CATEGORY_EMOJI[a.category] ?? '📌'

        const iconHtml = `
          <div style="
            display:flex; flex-direction:column; align-items:center;
            filter: ${isActive ? 'drop-shadow(0 4px 12px rgba(8,145,178,0.5))' : 'none'};
            transform: ${isActive ? 'scale(1.25)' : 'scale(1)'};
            transition: all 0.2s;
          ">
            <div style="
              background:${color}; color:white; border-radius:999px;
              padding:5px 10px; font-size:11px; font-weight:700;
              white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.2);
              border:2px solid white; display:flex; align-items:center; gap:4px;
            ">
              <span>${emoji}</span>
              <span>${a.name.length > 16 ? a.name.slice(0, 16) + '…' : a.name}</span>
            </div>
            <div style="
              width:10px; height:10px; border-radius:50%;
              background:${color}; border:2px solid white;
              box-shadow:0 1px 4px rgba(0,0,0,0.25); margin-top:2px;
            "></div>
          </div>
        `

        const icon = L.divIcon({ html: iconHtml, className: '', iconAnchor: [0, 0] })
        const marker = L.marker(coords[i], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:Inter,sans-serif; min-width:160px;">
              <div style="font-weight:700; font-size:13px; color:#0f172a;">${a.name}</div>
              <div style="font-size:11px; color:#64748b; margin-top:2px;">${a.start_time} · ${a.category}</div>
            </div>
          `, { closeButton: false })

        marker.on('click', () => { onPinClick?.(a.id); marker.openPopup() })
        if (isActive) { marker.openPopup() }

        markersRef.current.push(marker)
      })

      // Fit bounds to show all pins
      if (coords.length > 1) {
        map.fitBounds(L.latLngBounds(coords).pad(0.25))
      } else if (coords.length === 1) {
        map.setView(coords[0], 15)
      }
    })

    return () => {
      // Don't destroy map on activity change — just re-render pins
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, activeId, destination])

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={mapRef} className="w-full h-full rounded-3xl" />
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur rounded-2xl border border-sea-100 shadow-soft px-3 py-2 flex flex-wrap gap-2 max-w-[200px]">
        {Object.entries(CATEGORY_EMOJI).slice(0, 4).map(([cat, emoji]) => (
          <div key={cat} className="flex items-center gap-1 text-xs text-slate-600">
            <span>{emoji}</span><span className="capitalize">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
