'use client'

import { useEffect, useState } from 'react'

// Seed-based picsum URLs — always work, return consistent landscape photos
const PHOTOS = [
  { id: 'mountain-lake-travel',    label: 'Mountain Lake'   },
  { id: 'coastal-cliffs-sunset',   label: 'Coastal Cliffs'  },
  { id: 'ancient-temple-mist',     label: 'Ancient Temple'  },
  { id: 'desert-dunes-golden',     label: 'Desert Dunes'    },
  { id: 'tropical-beach-turquoise',label: 'Tropical Beach'  },
  { id: 'city-lights-aerial',      label: 'City Lights'     },
  { id: 'green-valley-forest',     label: 'Green Valley'    },
  { id: 'snowy-peaks-alpine',      label: 'Snowy Peaks'     },
  { id: 'river-canyon-autumn',     label: 'River Canyon'    },
  { id: 'old-town-evening-glow',   label: 'Old Town'        },
]

const INTERVAL_MS = 8 * 1000  // rotate every 8 seconds

function photoUrl(id: string) {
  return `https://picsum.photos/seed/${id}/1920/1080`
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
