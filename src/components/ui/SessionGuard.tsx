'use client'

import { useEffect, useRef } from 'react'

const KEY            = 'roamriot_last_active'
const MAX_MS         = 24 * 60 * 60 * 1000
const STAMP_DEBOUNCE = 60 * 1000

export function SessionGuard() {
  const lastStamped = useRef(0)

  useEffect(() => {
    // Bail out safely if Supabase isn't configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return

    let supabase: ReturnType<typeof import('@/lib/supabase/client').createClient> | null = null
    try {
      const { createClient } = require('@/lib/supabase/client')
      supabase = createClient()
    } catch {
      return
    }

    try {
      const last = Number(localStorage.getItem(KEY) ?? '0')
      if (last > 0 && Date.now() - last > MAX_MS) {
        supabase?.auth.signOut().finally(() => {
          window.location.href = '/login?reason=inactivity'
        })
        return
      }
    } catch { return }

    function stamp() {
      try {
        const now = Date.now()
        if (now - lastStamped.current > STAMP_DEBOUNCE) {
          localStorage.setItem(KEY, String(now))
          lastStamped.current = now
        }
      } catch { /* ignore */ }
    }

    stamp()
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const
    events.forEach(e => window.addEventListener(e, stamp, { passive: true }))

    function onVisibilityChange() {
      if (document.visibilityState !== 'visible') return
      try {
        const last = Number(localStorage.getItem(KEY) ?? '0')
        if (last > 0 && Date.now() - last > MAX_MS) {
          supabase?.auth.signOut().finally(() => {
            window.location.href = '/login?reason=inactivity'
          })
        }
      } catch { /* ignore */ }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      events.forEach(e => window.removeEventListener(e, stamp))
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return null
}
