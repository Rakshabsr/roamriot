'use client'

import { useEffect, useState } from 'react'

// Real travel photos from picsum.photos — free, no API key, reliable CDN
// Each seed consistently returns the same beautiful landscape photo
const PHOTO_SEEDS = [
  'mountain-lake',
  'coastal-cliffs',
  'ancient-temple',
  'desert-dunes',
  'tropical-beach',
  'city-lights',
  'green-valley',
  'snowy-peaks',
  'river-canyon',
  'old-town-street',
]

const INTERVAL_MS = 2 * 60 * 1000  // rotate every 2 minutes

function photoUrl(seed: string) {
  // picsum.photos seed-based URL — always returns a real photograph, no key needed
  return `https://picsum.photos/seed/${seed}/1920/1080`
}

export function TravelBackground({ className = '', fixed = false }: { className?: string; fixed?: boolean }) {
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)

  // Rotate every 2 minutes with crossfade
  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrent(c => (c + 1) % PHOTO_SEEDS.length)
        setVisible(true)
      }, 700)
    }, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  const seed = PHOTO_SEEDS[current]

  return (
    <div
      className={`${fixed ? 'fixed' : 'absolute'} inset-0 ${fixed ? '-z-10' : 'z-0'} ${className}`}
      aria-hidden="true"
    >
      <img
        key={seed}
        src={photoUrl(seed)}
        alt=""
        className={`w-full h-full object-cover transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}
        draggable={false}
      />
      {/* Dark overlay keeps text readable over any photo */}
      <div className="absolute inset-0 bg-black/50" />
    </div>
  )
}
