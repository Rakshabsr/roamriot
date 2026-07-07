'use client'

import { useEffect, useState } from 'react'

// Curated picsum photo IDs — verified travel/landscape imagery
const PHOTOS = [
  { id: '1285', label: 'Mountain Lake' },
  { id: '1252', label: 'Tropical Coast' },
  { id: '1320', label: 'Desert Dunes' },
  { id: '1271', label: 'Ancient City' },
  { id: '1287', label: 'Alpine Valley' },
  { id: '1246', label: 'Scenic Cliffs' },
  { id: '1268', label: 'River Canyon' },
  { id: '1310', label: 'Ocean Horizon' },
  { id: '1280', label: 'Forest Path' },
  { id: '1257', label: 'Golden Plains' },
]

const INTERVAL_MS = 8 * 1000  // rotate every 8 seconds

function photoUrl(id: string) {
  return `https://picsum.photos/id/${id}/1920/1080`
}

export function TravelBackground({ className = '', fixed = false }: { className?: string; fixed?: boolean }) {
  const [current, setCurrent] = useState(0)
  const [next, setNext]       = useState(1)
  const [fading, setFading]   = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIdx = (current + 1) % PHOTOS.length
      setNext(nextIdx)
      setFading(true)
      setTimeout(() => {
        setCurrent(nextIdx)
        setFading(false)
      }, 1000)
    }, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [current])

  return (
    <div
      className={`${fixed ? 'fixed' : 'absolute'} inset-0 ${fixed ? '-z-10' : 'z-0'} overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Current photo with Ken Burns zoom */}
      <img
        key={`cur-${current}`}
        src={photoUrl(PHOTOS[current].id)}
        alt=""
        className="absolute inset-0 w-full h-full object-cover animate-ken-burns"
        draggable={false}
      />

      {/* Next photo fades in during transition */}
      {fading && (
        <img
          key={`next-${next}`}
          src={photoUrl(PHOTOS[next].id)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 opacity-100"
          draggable={false}
          style={{ animation: 'fadeIn 1s ease forwards' }}
        />
      )}

      {/* Cinematic overlay: dark vignette + warm amber from bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/75" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1a0800]/70 via-transparent to-transparent" />
    </div>
  )
}
